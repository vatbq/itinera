import { generateObject } from "ai";
import { getClassifyModel } from "@/lib/ai/provider";
import { ClassificationResultSchema, DocType } from "@/types/classification";

const CONFIDENCE_THRESHOLD = 0.6;

export async function classifyDoc(text: string): Promise<DocType> {
  const clippedText = text.slice(0, 4000);

  try {
    const result = await generateObject({
      model: getClassifyModel(),
      schema: ClassificationResultSchema,
      prompt: `You are a document classifier for travel documents.

Analyze the following text and classify it as one of: hotel, flight, or car.

Rules:
- Return ONLY valid JSON matching the schema
- "hotel" for hotel/accommodation bookings
- "flight" for airline tickets/boarding passes
- "car" for car rental/vehicle reservations
- Include a confidence score (0-1)
- Do NOT add explanations

Document text:
${clippedText}`,
    });

    const { doc_type, confidence } = result.object;

    if (confidence < CONFIDENCE_THRESHOLD) {
      const heuristicType = applyHeuristics(text);
      if (heuristicType) {
        console.log(
          `Low confidence (${confidence}), using heuristic: ${heuristicType}`,
        );
        return heuristicType;
      }
    }

    return doc_type;
  } catch (error) {
    console.error(
      "AI classification failed, falling back to heuristics:",
      error,
    );
    // Fallback to heuristics if AI fails
    return applyHeuristics(text) || "hotel"; // Default to hotel if all else fails
  }
}

function applyHeuristics(text: string): DocType | null {
  const lowerText = text.toLowerCase();

  const hotelKeywords = [
    "check-in",
    "check-out",
    "reservation",
    "room",
    "hotel",
    "accommodation",
    "guest",
    "property",
  ];

  const flightKeywords = [
    "flight",
    "airline",
    "boarding",
    "departure",
    "arrival",
    "gate",
    "seat",
    "passenger",
    "aircraft",
  ];

  const carKeywords = [
    "rental",
    "vehicle",
    "pickup",
    "drop-off",
    "car",
    "suv",
    "sedan",
    "driver",
  ];

  const hotelScore = hotelKeywords.filter((kw) =>
    lowerText.includes(kw),
  ).length;

  const flightScore = flightKeywords.filter((kw) =>
    lowerText.includes(kw),
  ).length;

  const carScore = carKeywords.filter((kw) => lowerText.includes(kw)).length;
  const maxScore = Math.max(hotelScore, flightScore, carScore);

  if (maxScore === 0) return null;

  if (hotelScore === maxScore) return "hotel";
  if (flightScore === maxScore) return "flight";
  if (carScore === maxScore) return "car";

  return null;
}
