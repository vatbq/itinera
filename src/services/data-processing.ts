import { parseISO, isValid, format } from "date-fns";
import { Flight, FlightSegment, Hotel, Car } from "@/types/trip";
import { DocType } from "@/types/classification";

export function normalizeRecord(
  raw: Flight | Hotel | Car,
  kind: DocType,
): Flight | Hotel | Car {
  if (dataIsFlight(raw)) {
    return normalizeFlight(raw);
  }

  if (dataIsHotel(raw)) {
    return normalizeHotel(raw);
  }

  if (dataIsCar(raw)) {
    return normalizeCar(raw);
  }

  throw new Error(`Unknown document type: ${kind}`);
}

function normalizeFlight(raw: Flight): Flight {
  const flight: Flight = {
    segments: [],
  };

  // Normalize segments
  if (Array.isArray(raw.segments)) {
    flight.segments = raw.segments.map((seg: FlightSegment) => ({
      departAirport: normalizeAirportCode(seg.departAirport),
      arriveAirport: normalizeAirportCode(seg.arriveAirport),
      departTime: normalizeDateTime(seg.departTime),
      arriveTime: normalizeDateTime(seg.arriveTime),
      flightNumber: seg.flightNumber?.toString().trim(),
      airline: seg.airline?.toString().trim(),
    }));
  }

  // Normalize confirmation number
  if (raw.confirmationNumber) {
    flight.confirmationNumber = raw.confirmationNumber.toString().trim();
  }

  // Normalize passenger name
  if (raw.passengerName) {
    flight.passengerName = raw.passengerName.toString().trim();
  }

  return flight;
}

function normalizeHotel(raw: Hotel): Hotel {
  const hotel: Hotel = {};

  if (raw.propertyName) {
    hotel.propertyName = raw.propertyName.toString().trim();
  }

  if (raw.checkInDate) {
    hotel.checkInDate = normalizeDate(raw.checkInDate);
  }

  if (raw.checkOutDate) {
    hotel.checkOutDate = normalizeDate(raw.checkOutDate);
  }

  if (raw.confirmationNumber) {
    hotel.confirmationNumber = raw.confirmationNumber.toString().trim();
  }

  if (raw.address) {
    hotel.address = raw.address.toString().trim();
  }

  if (raw.guestName) {
    hotel.guestName = raw.guestName.toString().trim();
  }

  return hotel;
}

function normalizeCar(raw: Car): Car {
  const car: Car = {};

  if (raw.pickupLocation) {
    car.pickupLocation = raw.pickupLocation.toString().trim();
  }

  if (raw.dropoffLocation) {
    car.dropoffLocation = raw.dropoffLocation.toString().trim();
  }

  if (raw.pickupTime) {
    car.pickupTime = normalizeDateTime(raw.pickupTime);
  }

  if (raw.dropoffTime) {
    car.dropoffTime = normalizeDateTime(raw.dropoffTime);
  }

  if (raw.confirmationNumber) {
    car.confirmationNumber = raw.confirmationNumber.toString().trim();
  }

  if (raw.vehicleType) {
    car.vehicleType = raw.vehicleType.toString().trim();
  }

  if (raw.rentalCompany) {
    car.rentalCompany = raw.rentalCompany.toString().trim();
  }

  return car;
}

function normalizeAirportCode(code?: string): string | undefined {
  if (!code) return undefined;

  const normalized = code.toString().trim().toUpperCase();

  // If it looks like an IATA code (3 letters), return it
  if (/^[A-Z]{3}$/.test(normalized)) {
    return normalized;
  }

  // Otherwise, return the original (might be full name)
  return code.toString().trim();
}

function normalizeDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;

  const str = dateStr.toString().trim();

  // Try parsing as ISO
  const parsed = parseISO(str);
  if (isValid(parsed)) {
    return format(parsed, "yyyy-MM-dd");
  }

  // Try common formats (add more as needed)
  const formats = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD or YYYY-M-D
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY
  ];

  for (const fmt of formats) {
    const match = str.match(fmt);
    if (match) {
      try {
        // Construct ISO date
        let year, month, day;
        if (fmt.source.startsWith("^\\(\\\\d\\{4\\}")) {
          // YYYY-MM-DD format
          [, year, month, day] = match;
        } else {
          // MM/DD/YYYY or MM-DD-YYYY format
          [, month, day, year] = match;
        }
        const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        const testParsed = parseISO(isoDate);
        if (isValid(testParsed)) {
          return format(testParsed, "yyyy-MM-dd");
        }
      } catch {
        // Continue to next format
      }
    }
  }

  // If all else fails, return original string
  // (validation later will catch if it's unusable)
  return str;
}

function normalizeDateTime(dateTimeStr?: string): string | undefined {
  if (!dateTimeStr) return undefined;

  const str = dateTimeStr.toString().trim();

  // Try parsing as ISO datetime
  const parsed = parseISO(str);
  if (isValid(parsed)) {
    return parsed.toISOString();
  }

  // For MVP, if we can't parse it, keep original
  // (validation/display layer will handle gracefully)
  return str;
}

// Type guards
export const dataIsFlight = (data: Flight | Hotel | Car): data is Flight => {
  return data && typeof data === "object" && "segments" in data;
};

export const dataIsHotel = (data: Flight | Hotel | Car): data is Hotel => {
  return data && typeof data === "object" && "propertyName" in data;
};

export const dataIsCar = (data: Flight | Hotel | Car): data is Car => {
  return data && typeof data === "object" && "pickupLocation" in data;
};
