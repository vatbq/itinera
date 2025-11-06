import { classifyDoc } from "@/lib/ai/classify";
import {
  completeRun,
  newRun,
  recordProgress,
  updateRunStatus,
} from "@/services/workflow-progress";
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

interface Document {
  name: string;
  extractedText: string;
}

export async function createItinerary(documents: Document[]): Promise<string> {
  "use workflow";

  const runId = newRun();
  updateRunStatus(runId, "running");
  recordProgress(runId, {
    name: "INIT",
    status: "completed",
    timestamp: Date.now(),
  });

  recordProgress(runId, {
    name: "PROCESS_DOCUMENTS",
    status: "running",
    timestamp: Date.now(),
  });

  const tripDetails = await Promise.all(documents.map(processDocumentStep));

  recordProgress(runId, {
    name: "PROCESS_DOCUMENTS",
    status: "completed",
    message: `Processed ${documents.length} documents`,
    timestamp: Date.now(),
  });

  recordProgress(runId, {
    name: "MERGING",
    status: "running",
    timestamp: Date.now(),
  });

  const mergedTrip = await mergeTripDetailsStep(tripDetails);

  recordProgress(runId, {
    name: "MERGING",
    status: "completed",
    message: `Merged ${mergedTrip.flights.length} flights, ${mergedTrip.hotels.length} hotels, ${mergedTrip.cars.length} cars`,
    timestamp: Date.now(),
  });

  // Build itinerary
  recordProgress(runId, {
    name: "BUILD",
    status: "running",
    message: "Building day-by-day itinerary",
    timestamp: Date.now(),
  });

  const itinerary = await buildItineraryStep(mergedTrip);

  console.log("itinerary", itinerary);

  recordProgress(runId, {
    name: "BUILD",
    status: "completed",
    message: `Built ${itinerary.length} day-by-day itinerary`,
    timestamp: Date.now(),
  });

  recordProgress(runId, {
    name: "VALIDATE",
    status: "running",
    message: "Validating itinerary",
    timestamp: Date.now(),
  });

  const warnings = await validateItineraryStep(mergedTrip, itinerary);
  
  recordProgress(runId, {
    name: "VALIDATE",
    status: "completed",
    message: `Validated ${warnings.length} warnings`,
    timestamp: Date.now(),
  });

  recordProgress(runId, {
    name: "BUILD_MARKDOWN",
    status: "running",
    message: "Building markdown content",
    timestamp: Date.now(),
  });
  
  const markdown = await buildMarkdownContentStep(itinerary, warnings);

  recordProgress(runId, {
    name: "BUILD_MARKDOWN",
    status: "completed",
    message: "Built markdown content",
    timestamp: Date.now(),
  });

  completeRun(runId, {
    warnings,
    markdown,
  });

  return "Itinerary created";
}

async function processDocumentStep(
  doc: Document,
): Promise<Flight | Hotel | Car> {
  "use step";

  const docType = await classifyDoc(doc.extractedText);

  const extracted = await extractFields(doc.extractedText, docType);

  const normalized = normalizeRecord(extracted, docType);

  return normalized;
}

async function mergeTripDetailsStep(
  processedDocs: (Flight | Hotel | Car)[],
) {
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

async function validateItineraryStep(trip: Trip, rows: DayRow[]): Promise<string[]> {
  "use step";

  return validateItinerary(trip, rows);
}

async function buildItineraryStep(trip: Trip): Promise<DayRow[]> {
  "use step";

  return buildItinerary(trip);
}

async function buildMarkdownContentStep(rows: DayRow[], warnings: string[]): Promise<string> {
  "use step";

  return buildMarkdownContent(rows, warnings);
}