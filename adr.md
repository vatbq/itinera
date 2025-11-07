# Itinera — Approach, Trade-offs, and Internals

This document summarizes how I approached the Travel Itinerary Processor, why I tried **`"use workflow"`** with **SSE**, what I kept **deterministic**, how I would build it **without** the workflow directive, and the trade-offs I encountered.

---

## Problem Framing

**Goal:** Convert a set of travel PDFs (flights, hotels, car rentals) into a consolidated Markdown itinerary, plus validation warnings (gaps in lodging and double hotel bookings).

**MVP constraints**

* ~80% extraction accuracy is acceptable.
* Keep token/cost/latency predictable; avoid oversized prompts.
* Provide real-time progress in the UI during OCR/LLM steps.

---

## Architecture at a Glance

* **AI (LLM) only**

  1. **Document classification** → `hotel | flight | car`
  2. **Field extraction** per type → strict JSON (validated with Zod)

* **Deterministic code**

  * **Normalization** (dates → ISO; prefer IATA codes when present)
  * **Merge** (single `Trip` model)
  * **Itinerary builder** (expand hotel nights; attach flights/cars per day)
  * **Validation** (gaps & double hotel bookings)
  * **Markdown rendering**

**Rationale:** Use AI only where vendor formats are inconsistent; keep core logic testable and auditable.

---

## Why I Did **Not** Use One Big LLM Call

I initially considered sending all OCR output in a single request (produce itinerary + warnings). I rejected this because:

* **Token blow-ups** across multiple PDFs and noisy OCR.
* **Unpredictable latency/cost** per run.
* **Poor debuggability**: hard to identify which document/field failed.
* **No granular progress**: difficult to stream step-level updates.

**Decision:** Small, **per-document** model calls (classify + extract) with deterministic assembly afterward.

---

## Orchestration & Real-time Updates

### Why **`"use workflow"`**

* **Durable, retryable steps** for flaky/slow OCR and LLM calls.
* **Straightforward async/await** programming model; the runtime handles replay and checkpoints.
* Natural fit for **fan-out** (per file) and **fan-in** (merge → validate → render).

### Why **SSE** for the Frontend

* Lightweight, one-way **streaming** of progress events.
* Great DX for “step finished” updates (`OCR_DONE`, `EXTRACTED`, `BUILD`, …).
* Lower overhead than WebSockets; automatic reconnection is simple.

---

## Trade-offs (Quick Table)

| Decision                           | Why                                                 | Pros                                  | Cons / Risks                                                                   | Mitigation                                                                              |
| ---------------------------------- | --------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `use workflow`                     | Try the new directive; good fit for multi-step jobs | Durability, retries, “write async” DX | New API; **inputs/outputs must be serializable**; dev replays can confuse logs | Strong **runId** logging, **idempotency keys**; learned from the official examples repo |
| **SSE** for progress               | Real-time UX with minimal infra                     | Simple, low overhead                  | One-way only; long streams can hit proxy timeouts                              | Small events; reconnection; fallback **polling** endpoint                               |
| AI only for **classify + extract** | Bound tokens; reliability                           | Predictable cost; easier debugging    | Slightly more glue code                                                        | Tight prompts + Zod schemas                                                             |
| Deterministic **Markdown builder** | Control & testability                               | Stable output; easy diffs             | None for MVP                                                                   | N/A                                                                                     |
| Base64 files into workflow         | Needed serialization                                | Quick to prototype                    | **Heavy payloads**; memory; replay overhead                                    | Prefer **storage references** (`{id, url, checksum}`) and fetch inside steps            |

---

## How It Works Internally

**Per-upload pipeline:**

1. **OCR (Mistral)** → text/markdown
2. **Classify (LLM)** → `hotel | flight | car` (fallback regex if confidence is low)
3. **Extract (LLM)** → strict JSON for that type (Zod-validated)
4. **Normalize (code)** → canonical dates/times, uppercase IATA where present
5. **Merge (code)** → `Trip { flights[], hotels[], cars[] }`
6. **Build (code)** → day-by-day rows (expand hotel nights; attach flights/cars)
7. **Validate (code)** → gaps and double hotel bookings
8. **Render (code)** → `Itinerary.md` (table + warnings)

**Real-time:**
Each step records progress; an **SSE** endpoint streams `{ step, status, message, timestamp }` to the client. On completion, the stream includes the Markdown URL and warnings.

---

## Notes from Using the New Directive

* **Serializable inputs/outputs only.** You can’t pass `File`/`Blob` directly to a workflow or step.

  * I initially used **base64** to serialize PDFs. It works, but it’s **risky**: large payloads, memory pressure, and slower replays.
  * **Better practice:** Upload to blob/S3/Supabase and pass a **lightweight reference** `{ id, url, checksum }`; fetch the bytes inside steps.
* The directive is **new**, so I had to dive into documentation and **example repos** to understand step boundaries and replay behavior.
* In development you’ll see multiple `/.well-known/workflow/...` calls due to **replays**. That’s expected. Use **run IDs** and **idempotency** to avoid duplicate runs and disable client double-submits.

---

## How I Would Build This **Without** `use workflow` (Queue Approach)

If I removed the directive, I would keep the **same step graph** but run it via a job runner:

### Option A — Managed Job Runner (portable)

* **Trigger.dev** or **Inngest**.
* Emit an event `{ files: [FileRef] }`. The job does: OCR → classify → extract → normalize (per file, in parallel) → merge/build/validate/render.
* Built-in retries and dashboards.
* **SSE** remains the same: the API reads job state and streams updates.

### Option B — DIY Queue

* **SQS/Cloudflare Queues** + worker (or BullMQ + Redis).
* Server action creates a `jobId`; the worker processes steps and stores checkpoints in a `runs` table.
* The SSE endpoint polls `runs` and pushes progress.

### Option C — `after()` (only if jobs are short)

* Fire-and-forget background work after responding.
* **Not durable** across restarts/redeploys; I wouldn’t use this for long OCR/LLM steps.

**Trade-off vs `use workflow`:**
Queues add some boilerplate but are mature and portable (with good visibility UIs). `use workflow` reduces external infra but is newer and enforces serializable inputs.


## Known Limitations

* **OCR quality:** Scanned or low-quality PDFs degrade extraction. I prefer partial extraction + warnings over blocking the run.
* **Time zones:** MVP uses local/naive times; cross-TZ flights may be confusing.
* **Partial data:** If fields are missing, I keep the partial object; validation highlights coverage issues.
* **Large inputs:** Base64 is acceptable for a prototype but not ideal for production—prefer storage references.


## Future Improvements

* Replace base64 with **storage references** and per-step **artifacts**:

  * `ocr.txt`, `extraction.json` keyed by content checksum for idempotent retries.
* **User corrections** prior to rendering (editable grid for extracted fields).
* **Timezone handling** for flights (map airports to offsets when available).
* **Exports**: JSON, iCal, Google Calendar.
* **Targeted extraction retries**: when a critical field is missing, run a second, hint-based extraction.