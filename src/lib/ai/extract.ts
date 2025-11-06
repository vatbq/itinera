import { generateObject } from "ai";
import { getExtractModel } from "./provider";
import {
  FlightSchema,
  HotelSchema,
  CarSchema,
  Flight,
  Hotel,
  Car,
} from "@/types/trip";
import { DocType } from "@/types/classification";

const MAX_TEXT_LENGTH = 8000;

export async function extractFields(
  text: string,
  kind: DocType,
): Promise<Flight | Hotel | Car> {
  const clippedText = text.slice(0, MAX_TEXT_LENGTH);

  switch (kind) {
    case "flight":
      return extractFlight(clippedText);
    case "hotel":
      return extractHotel(clippedText);
    case "car":
      return extractCar(clippedText);
    default:
      throw new Error(`Unknown document type: ${kind}`);
  }
}

async function extractFlight(text: string): Promise<Flight> {
  const prompt = `You are a flight data extractor. Extract flight information from the following text.

Rules:
- Extract ALL flight segments if this is a multi-leg journey
- For each segment, extract: departAirport, arriveAirport, departTime, arriveTime, flightNumber, airline
- Use IATA airport codes when available (e.g., SFO, JFK)
- For times, use ISO format if possible, or keep as-is if format is unclear
- If a field is missing or unclear, OMIT it - do NOT invent values
- Return strictly valid JSON matching the schema
- No explanations or additional text

Document text:
${text}`;

  try {
    const result = await generateObject({
      model: getExtractModel(),
      schema: FlightSchema,
      prompt,
    });

    return result.object;
  } catch (error) {
    console.error("Flight extraction failed:", error);
    return { segments: [] };
  }
}

/**
 * Extract hotel information
 */
async function extractHotel(text: string): Promise<Hotel> {
  const prompt = `You are a hotel data extractor. Extract hotel booking information from the following text.

Rules:
- Extract: propertyName, checkInDate, checkOutDate, confirmationNumber, address, guestName
- For dates, use ISO format YYYY-MM-DD if possible
- If a field is missing or unclear, OMIT it - do NOT invent values
- Return strictly valid JSON matching the schema
- No explanations or additional text

Document text:
${text}`;

  try {
    const result = await generateObject({
      model: getExtractModel(),
      schema: HotelSchema,
      prompt,
    });

    return result.object;
  } catch (error) {
    console.error("Hotel extraction failed:", error);
    return {};
  }
}

async function extractCar(text: string): Promise<Car> {
  const prompt = `You are a car rental data extractor. Extract car rental information from the following text.

Rules:
- Extract: pickupLocation, dropoffLocation, pickupTime, dropoffTime, confirmationNumber, vehicleType, rentalCompany
- For times, use ISO format if possible
- Use IATA codes for airport locations when available
- If a field is missing or unclear, OMIT it - do NOT invent values
- Return strictly valid JSON matching the schema
- No explanations or additional text

Document text:
${text}`;

  try {
    const result = await generateObject({
      model: getExtractModel(),
      schema: CarSchema,
      prompt,
    });

    return result.object;
  } catch (error) {
    console.error("Car extraction failed:", error);
    return {};
  }
}
