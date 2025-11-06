import {
  parseISO,
  isValid,
  eachDayOfInterval,
  format,
  addDays,
} from "date-fns";
import { Trip, DayRow, Flight, Hotel, Car } from "@/types/trip";

export function buildItinerary(trip: Trip): DayRow[] {
  const { startDate, endDate } = getTripDateRange(trip);

  if (!startDate || !endDate) {
    return [];
  }

  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  const dayMap = new Map<string, DayRow>();

  dates.forEach((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    dayMap.set(dateStr, {
      date: dateStr,
      hotels: [],
      flights: [],
      cars: [],
    });
  });

  trip.hotels.forEach((hotel) => {
    addHotelToItinerary(hotel, dayMap);
  });

  trip.flights.forEach((flight) => {
    addFlightToItinerary(flight, dayMap);
  });

  trip.cars.forEach((car) => {
    addCarToItinerary(car, dayMap);
  });

  return Array.from(dayMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

function getTripDateRange(trip: Trip): {
  startDate: Date | null;
  endDate: Date | null;
} {
  const allDates: Date[] = [];

  trip.hotels.forEach((hotel) => {
    if (hotel.checkInDate) {
      const date = parseISOSafe(hotel.checkInDate);
      if (date) allDates.push(date);
    }
    if (hotel.checkOutDate) {
      const date = parseISOSafe(hotel.checkOutDate);
      if (date) allDates.push(date);
    }
  });

  trip.flights.forEach((flight) => {
    flight.segments.forEach((segment) => {
      if (segment.departTime) {
        const date = parseISOSafe(segment.departTime);
        if (date) allDates.push(date);
      }
      if (segment.arriveTime) {
        const date = parseISOSafe(segment.arriveTime);
        if (date) allDates.push(date);
      }
    });
  });

  trip.cars.forEach((car) => {
    if (car.pickupTime) {
      const date = parseISOSafe(car.pickupTime);
      if (date) allDates.push(date);
    }
    if (car.dropoffTime) {
      const date = parseISOSafe(car.dropoffTime);
      if (date) allDates.push(date);
    }
  });

  if (allDates.length === 0) {
    return { startDate: null, endDate: null };
  }

  const sortedDates = allDates.sort((a, b) => a.getTime() - b.getTime());
  return {
    startDate: sortedDates[0],
    endDate: sortedDates[sortedDates.length - 1],
  };
}

function addHotelToItinerary(hotel: Hotel, dayMap: Map<string, DayRow>): void {
  if (!hotel.checkInDate || !hotel.checkOutDate) return;

  const checkIn = parseISOSafe(hotel.checkInDate);
  const checkOut = parseISOSafe(hotel.checkOutDate);

  if (!checkIn || !checkOut) return;

  const nights = eachDayOfInterval({
    start: checkIn,
    end: addDays(checkOut, -1),
  });

  const hotelLabel = hotel.propertyName || "Hotel (unnamed)";

  nights.forEach((night) => {
    const dateStr = format(night, "yyyy-MM-dd");
    const dayRow = dayMap.get(dateStr);
    if (dayRow) {
      dayRow.hotels = dayRow.hotels || [];
      dayRow.hotels.push(hotelLabel);
    }
  });
}

function addFlightToItinerary(
  flight: Flight,
  dayMap: Map<string, DayRow>
): void {
  if (flight.segments.length === 0) return;

  flight.segments.forEach((segment, idx) => {
    // Build a descriptive label for this segment
    const parts: string[] = [];

    if (segment.flightNumber) {
      parts.push(segment.flightNumber);
    } else {
      parts.push(`Flight ${idx + 1}`);
    }

    if (segment.departAirport && segment.arriveAirport) {
      parts.push(`${segment.departAirport} → ${segment.arriveAirport}`);
    }

    if (segment.departTime) {
      const departDate = parseISOSafe(segment.departTime);
      if (departDate) {
        parts.push(format(departDate, "HH:mm"));
      }
    }

    const flightLabel = parts.join(" ");

    // Attach to departure date
    if (segment.departTime) {
      const departDate = parseISOSafe(segment.departTime);
      if (departDate) {
        const dateStr = format(departDate, "yyyy-MM-dd");
        const dayRow = dayMap.get(dateStr);
        if (dayRow) {
          dayRow.flights = dayRow.flights || [];
          dayRow.flights.push(flightLabel);
        }
      }
    }
  });
}

function addCarToItinerary(car: Car, dayMap: Map<string, DayRow>): void {
  // Pickup
  if (car.pickupTime) {
    const pickupDate = parseISOSafe(car.pickupTime);
    if (pickupDate) {
      const dateStr = format(pickupDate, "yyyy-MM-dd");
      const dayRow = dayMap.get(dateStr);
      if (dayRow) {
        const location = car.pickupLocation || "Location";
        const time = format(pickupDate, "HH:mm");
        const label = `Pickup ${location} ${time}`;
        dayRow.cars = dayRow.cars || [];
        dayRow.cars.push(label);
      }
    }
  }

  // Dropoff
  if (car.dropoffTime) {
    const dropoffDate = parseISOSafe(car.dropoffTime);
    if (dropoffDate) {
      const dateStr = format(dropoffDate, "yyyy-MM-dd");
      const dayRow = dayMap.get(dateStr);
      if (dayRow) {
        const location = car.dropoffLocation || "Location";
        const time = format(dropoffDate, "HH:mm");
        const label = `Dropoff ${location} ${time}`;
        dayRow.cars = dayRow.cars || [];
        dayRow.cars.push(label);
      }
    }
  }
}

function parseISOSafe(dateStr: string): Date | null {
  try {
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function validateItinerary(trip: Trip, rows: DayRow[]): string[] {
  const warnings: string[] = [];

  // Check for missing hotels (gaps)
  const gapWarnings = checkForGaps(rows);
  warnings.push(...gapWarnings);

  // Check for double bookings (multiple hotels on same night)
  const doubleWarnings = checkForDoubleBookings(rows);
  warnings.push(...doubleWarnings);

  // Check for flights without times
  const flightWarnings = checkFlights(trip);
  warnings.push(...flightWarnings);

  // Check for hotels without names
  const hotelWarnings = checkHotels(trip);
  warnings.push(...hotelWarnings);

  return warnings;
}

function checkForGaps(rows: DayRow[]): string[] {
  const warnings: string[] = [];

  if (rows.length === 0) {
    return warnings;
  }

  rows.forEach((row) => {
    const hasHotel = row.hotels && row.hotels.length > 0;

    if (!hasHotel) {
      warnings.push(`No hotel booked for ${row.date}`);
    }
  });

  if (rows.length > 1) {
    const totalHotels = rows.reduce(
      (sum, row) => sum + (row.hotels?.length || 0),
      0
    );
    if (totalHotels === 0) {
      warnings.push("No hotel bookings found for multi-day trip");
    }
  }

  return warnings;
}

function checkForDoubleBookings(rows: DayRow[]): string[] {
  const warnings: string[] = [];

  rows.forEach((row) => {
    if (row.hotels && row.hotels.length > 1) {
      const hotelNames = row.hotels.join(", ");
      warnings.push(`Double hotel booking on ${row.date}: ${hotelNames}`);
    }
  });

  return warnings;
}

function checkFlights(trip: Trip): string[] {
  const warnings: string[] = [];

  trip.flights.forEach((flight, idx) => {
    if (flight.segments.length === 0) {
      warnings.push(`Flight #${idx + 1} has no segments`);
      return;
    }

    flight.segments.forEach((segment, segIdx) => {
      const missing: string[] = [];

      if (!segment.departAirport) missing.push("departure airport");
      if (!segment.arriveAirport) missing.push("arrival airport");
      if (!segment.departTime) missing.push("departure time");
      if (!segment.arriveTime) missing.push("arrival time");

      if (missing.length > 0) {
        warnings.push(
          `Flight #${idx + 1} segment #${segIdx + 1} missing: ${missing.join(", ")}`
        );
      }
    });
  });

  return warnings;
}

function checkHotels(trip: Trip): string[] {
  const warnings: string[] = [];

  trip.hotels.forEach((hotel, idx) => {
    const missing: string[] = [];

    if (!hotel.propertyName) missing.push("property name");
    if (!hotel.checkInDate) missing.push("check-in date");
    if (!hotel.checkOutDate) missing.push("check-out date");

    if (missing.length > 0) {
      const label = hotel.propertyName || `Hotel #${idx + 1}`;
      warnings.push(`${label} missing: ${missing.join(", ")}`);
    }
  });

  return warnings;
}
