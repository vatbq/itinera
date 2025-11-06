import { z } from "zod";

export const FlightSegmentSchema = z.object({
  departAirport: z.string().optional(),
  arriveAirport: z.string().optional(),
  departTime: z.string().optional(), // ISO datetime or partial
  arriveTime: z.string().optional(), // ISO datetime or partial
  flightNumber: z.string().optional(),
  airline: z.string().optional(),
});

export type FlightSegment = z.infer<typeof FlightSegmentSchema>;

export const FlightSchema = z.object({
  segments: z.array(FlightSegmentSchema).default([]),
  confirmationNumber: z.string().optional(),
  passengerName: z.string().optional(),
});

export type Flight = z.infer<typeof FlightSchema>;

export const HotelSchema = z.object({
  propertyName: z.string().optional(),
  checkInDate: z.string().optional(), // ISO date (YYYY-MM-DD preferred)
  checkOutDate: z.string().optional(), // ISO date
  confirmationNumber: z.string().optional(),
  address: z.string().optional(),
  guestName: z.string().optional(),
});

export type Hotel = z.infer<typeof HotelSchema>;

export const CarSchema = z.object({
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  pickupTime: z.string().optional(), // ISO datetime or partial
  dropoffTime: z.string().optional(), // ISO datetime or partial
  confirmationNumber: z.string().optional(),
  vehicleType: z.string().optional(),
  rentalCompany: z.string().optional(),
});

export type Car = z.infer<typeof CarSchema>;

export const TripSchema = z.object({
  flights: z.array(FlightSchema).default([]),
  hotels: z.array(HotelSchema).default([]),
  cars: z.array(CarSchema).default([]),
});

export type Trip = z.infer<typeof TripSchema>;

export const DayRowSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  hotels: z.array(z.string()).optional(),
  flights: z.array(z.string()).optional(),
  cars: z.array(z.string()).optional(),
});

export type DayRow = z.infer<typeof DayRowSchema>;
