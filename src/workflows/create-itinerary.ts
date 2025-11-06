import { classifyDoc } from "@/lib/ai/classify";
import { extractFields } from "@/lib/ai/extract";
import {
  dataIsCar,
  dataIsFlight,
  dataIsHotel,
  normalizeRecord,
} from "@/services/data-processing";
import { Car, DayRow, Flight, Hotel, Trip } from "@/types/trip";
import { buildItinerary, validateItinerary } from "@/services/itinerary";
import { buildMarkdownContent } from "@/services/markdown-generator";
import { getWritable } from "workflow";
import { WorkflowStep, WorkflowUpdate } from "@/types/workflow";

interface FileData {
  name: string;
  content: string;
}

interface Document {
  name: string;
  extractedText: string;
}

export async function createItinerary(files: FileData[]): Promise<void> {
  "use workflow";

  const writable = getWritable<WorkflowUpdate>();

  await writeProgressUpdate(writable, {
    name: "INIT",
    status: "completed",
    timestamp: Date.now(),
  });

  // Step 1: Extract text from PDF files
  await writeProgressUpdate(writable, {
    name: "EXTRACT_FILES",
    status: "running",
    message: `Extracting text from ${files.length} PDF file(s)`,
    timestamp: Date.now(),
  });

  const documents = await Promise.all(files.map(extractPDFStep));

  await writeProgressUpdate(writable, {
    name: "EXTRACT_FILES",
    status: "completed",
    message: `Extracted text from ${files.length} PDF file(s)`,
    timestamp: Date.now(),
  });

  // Step 2: Process documents (classify and extract fields)
  await writeProgressUpdate(writable, {
    name: "PROCESS_DOCUMENTS",
    status: "running",
    timestamp: Date.now(),
  });

  const tripDetails = await Promise.all(documents.map((doc) => processDocumentStep(doc, writable)));

  await writeProgressUpdate(writable, {
    name: "PROCESS_DOCUMENTS",
    status: "completed",
    message: `Processed ${documents.length} document(s)`,
    timestamp: Date.now(),
  });

  // Step 3: Merge all trip details
  await writeProgressUpdate(writable, {
    name: "MERGING",
    status: "running",
    timestamp: Date.now(),
  });

  const mergedTrip = await mergeTripDetailsStep(tripDetails);

  await writeProgressUpdate(writable, {
    name: "MERGING",
    status: "completed",
    message: `Merged ${mergedTrip.flights.length} flights, ${mergedTrip.hotels.length} hotels, ${mergedTrip.cars.length} cars`,
    timestamp: Date.now(),
  });

  await writeProgressUpdate(writable, {
    name: "BUILD",
    status: "running",
    message: "Building day-by-day itinerary",
    timestamp: Date.now(),
  });

  const itinerary = await buildItineraryStep(mergedTrip);

  await writeProgressUpdate(writable, {
    name: "BUILD",
    status: "completed",
    message: `Built ${itinerary.length} day(s)`,
    timestamp: Date.now(),
  });

  await writeProgressUpdate(writable, {
    name: "VALIDATE",
    status: "running",
    message: "Validating itinerary",
    timestamp: Date.now(),
  });

  const warnings = await validateItineraryStep(mergedTrip, itinerary);

  await writeProgressUpdate(writable, {
    name: "VALIDATE",
    status: "completed",
    message: warnings.length > 0 ? `Found ${warnings.length} warning(s)` : "No warnings found",
    timestamp: Date.now(),
  });

  await writeProgressUpdate(writable, {
    name: "BUILD_MARKDOWN",
    status: "running",
    message: "Building markdown content",
    timestamp: Date.now(),
  });

  const markdown = await buildMarkdownContentStep(itinerary, warnings);

  await writeProgressUpdate(writable, {
    name: "BUILD_MARKDOWN",
    status: "completed",
    message: "Generated final output",
    timestamp: Date.now(),
  });

  await writeCompletionUpdate(writable, warnings, markdown);
}

async function extractPDFStep(fileData: FileData): Promise<Document> {
  "use step";

  // Use the base64 content directly with the OCR processor
  const { mistral } = await import("@/lib/mistral/provider");
  
  const ocrResponse = await mistral.ocr.process({
    model: "mistral-ocr-latest",
    document: {
      type: "document_url",
      documentUrl: "data:application/pdf;base64," + fileData.content,
    },
  });

  const extractedText =
    ocrResponse.pages
      ?.map((page) => page.markdown)
      .filter(Boolean)
      .join("\n\n") || "";

  return {
    name: fileData.name,
    extractedText,
  };
}

async function processDocumentStep(
  doc: Document,
  writable: WritableStream<WorkflowUpdate>,
): Promise<Flight | Hotel | Car> {
  "use step";

  await writeProgressUpdate(writable, {
    name: `Processing document ${doc.name}`,
    status: "running",
    timestamp: Date.now(),
  });

  const docType = await classifyDoc(doc.extractedText);

  const extracted = await extractFields(doc.extractedText, docType);

  const normalized = normalizeRecord(extracted, docType);

  await writeProgressUpdate(writable, {
    name: `Processing document ${doc.name}`,
    status: "completed",
    timestamp: Date.now(),
  });

  return normalized;
}

async function mergeTripDetailsStep(processedDocs: (Flight | Hotel | Car)[]) {
  "use step";

  const merged: Trip = {
    flights: [],
    hotels: [],
    cars: [],
  };

  processedDocs.forEach((data) => {
    if (dataIsFlight(data)) {
      merged.flights.push(data);
    } else if (dataIsHotel(data)) {
      merged.hotels.push(data);
    } else if (dataIsCar(data)) {
      merged.cars.push(data);
    }
  });

  return merged;
}

async function validateItineraryStep(
  trip: Trip,
  rows: DayRow[],
): Promise<string[]> {
  "use step";

  return validateItinerary(trip, rows);
}

async function buildItineraryStep(trip: Trip): Promise<DayRow[]> {
  "use step";

  return buildItinerary(trip);
}

async function buildMarkdownContentStep(
  rows: DayRow[],
  warnings: string[],
): Promise<string> {
  "use step";

  return buildMarkdownContent(rows, warnings);
}

async function writeProgressUpdate(
  writable: WritableStream<WorkflowUpdate>,
  step: WorkflowStep,
) {
  "use step";

  const writer = writable.getWriter();

  await writer.write({
    type: "progress",
    step,
  });

  writer.releaseLock();
}

async function writeCompletionUpdate(
  writable: WritableStream<WorkflowUpdate>,
  warnings: string[],
  markdown: string,
) {
  "use step";

  const writer = writable.getWriter();

  await writer.write({
    type: "completion",
    warnings,
    markdown,
  });
}
