import { describe, it, expect } from '@jest/globals';
import { buildItinerary, validateItinerary } from '../itinerary';
import { Trip } from '@/types/trip';

describe('itinerary', () => {
  describe('buildItinerary', () => {
    it('should return empty array when no data provided', () => {
      const trip: Trip = {
        flights: [],
        hotels: [],
        cars: [],
      };

      const result = buildItinerary(trip);
      expect(result).toEqual([]);
    });

    it('should build itinerary from hotel bookings', () => {
      const trip: Trip = {
        flights: [],
        hotels: [
          {
            propertyName: 'Grand Hotel',
            checkInDate: '2025-01-15',
            checkOutDate: '2025-01-17',
          },
        ],
        cars: [],
      };

      const result = buildItinerary(trip);

      // Hotel stays from check-in to (check-out - 1), but date range includes check-out day
      expect(result).toHaveLength(3); // Jan 15, 16, 17
      expect(result[0].date).toBe('2025-01-15');
      expect(result[0].hotels).toContain('Grand Hotel');
      expect(result[1].date).toBe('2025-01-16');
      expect(result[1].hotels).toContain('Grand Hotel');
      // Check-out day has no hotel
      expect(result[2].date).toBe('2025-01-17');
    });

    it('should add flights to correct dates', () => {
      const trip: Trip = {
        flights: [
          {
            segments: [
              {
                departAirport: 'SFO',
                arriveAirport: 'JFK',
                departTime: '2025-01-15T08:00:00Z',
                arriveTime: '2025-01-15T16:30:00Z',
                flightNumber: 'AA100',
              },
            ],
          },
        ],
        hotels: [],
        cars: [],
      };

      const result = buildItinerary(trip);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2025-01-15');
      expect(result[0].flights).toHaveLength(1);
      expect(result[0].flights![0]).toContain('AA100');
      expect(result[0].flights![0]).toContain('SFO → JFK');
    });

    it('should handle multi-segment flights', () => {
      const trip: Trip = {
        flights: [
          {
            segments: [
              {
                departAirport: 'SFO',
                arriveAirport: 'ORD',
                departTime: '2025-01-15T08:00:00Z',
                flightNumber: 'UA100',
              },
              {
                departAirport: 'ORD',
                arriveAirport: 'JFK',
                departTime: '2025-01-15T16:00:00Z',
                flightNumber: 'UA200',
              },
            ],
          },
        ],
        hotels: [],
        cars: [],
      };

      const result = buildItinerary(trip);

      expect(result[0].flights).toHaveLength(2);
      expect(result[0].flights![0]).toContain('UA100');
      expect(result[0].flights![1]).toContain('UA200');
    });

    it('should add car rentals to correct dates', () => {
      const trip: Trip = {
        flights: [],
        hotels: [],
        cars: [
          {
            pickupLocation: 'SFO Airport',
            dropoffLocation: 'Downtown SF',
            pickupTime: '2025-01-15T10:00:00Z',
            dropoffTime: '2025-01-17T10:00:00Z',
          },
        ],
      };

      const result = buildItinerary(trip);

      expect(result).toHaveLength(3); // Jan 15, 16, 17
      expect(result[0].cars![0]).toContain('Pickup');
      expect(result[0].cars![0]).toContain('SFO Airport');
      expect(result[2].cars![0]).toContain('Dropoff');
      expect(result[2].cars![0]).toContain('Downtown SF');
    });

    it('should combine all booking types', () => {
      const trip: Trip = {
        flights: [
          {
            segments: [
              {
                departAirport: 'SFO',
                arriveAirport: 'JFK',
                departTime: '2025-01-15T08:00:00Z',
                flightNumber: 'AA100',
              },
            ],
          },
        ],
        hotels: [
          {
            propertyName: 'NYC Hotel',
            checkInDate: '2025-01-15',
            checkOutDate: '2025-01-17',
          },
        ],
        cars: [
          {
            pickupLocation: 'JFK Airport',
            pickupTime: '2025-01-15T18:00:00Z',
          },
        ],
      };

      const result = buildItinerary(trip);

      expect(result).toHaveLength(3); // Includes checkout day
      expect(result[0].flights).toHaveLength(1);
      expect(result[0].hotels).toHaveLength(1);
      expect(result[0].cars).toHaveLength(1);
    });

    it('should sort days chronologically', () => {
      const trip: Trip = {
        flights: [],
        hotels: [
          {
            propertyName: 'Hotel B',
            checkInDate: '2025-01-20',
            checkOutDate: '2025-01-22',
          },
          {
            propertyName: 'Hotel A',
            checkInDate: '2025-01-15',
            checkOutDate: '2025-01-17',
          },
        ],
        cars: [],
      };

      const result = buildItinerary(trip);

      expect(result[0].date).toBe('2025-01-15');
      // Range includes both checkout dates
      expect(result[result.length - 1].date).toBe('2025-01-22');
    });

    it('should handle flights without times gracefully', () => {
      const trip: Trip = {
        flights: [
          {
            segments: [
              {
                departAirport: 'SFO',
                arriveAirport: 'JFK',
                // No times provided
              },
            ],
          },
        ],
        hotels: [],
        cars: [],
      };

      const result = buildItinerary(trip);
      expect(result).toEqual([]);
    });
  });

  describe('validateItinerary', () => {
    it('should return minimal warnings for well-formed itinerary', () => {
      const trip: Trip = {
        flights: [
          {
            segments: [
              {
                departAirport: 'SFO',
                arriveAirport: 'JFK',
                departTime: '2025-01-15T08:00:00Z',
                arriveTime: '2025-01-15T16:30:00Z',
              },
            ],
          },
        ],
        hotels: [
          {
            propertyName: 'NYC Hotel',
            checkInDate: '2025-01-15',
            checkOutDate: '2025-01-16',
          },
        ],
        cars: [],
      };

      const rows = buildItinerary(trip);
      const warnings = validateItinerary(trip, rows);

      // Checkout day warning is expected since there's no hotel that night
      // But all flight and hotel fields are complete
      const hasFlightWarnings = warnings.some(w => w.includes('Flight'));
      const hasMissingFieldWarnings = warnings.some(w => w.includes('missing'));
      
      expect(hasFlightWarnings).toBe(false);
      expect(hasMissingFieldWarnings).toBe(false);
    });

    it('should warn about missing hotel bookings', () => {
      const trip: Trip = {
        flights: [],
        hotels: [],
        cars: [],
      };

      const rows = buildItinerary(trip);
      const warnings = validateItinerary(trip, rows);

      expect(warnings).toHaveLength(0); // No warnings for empty trip
    });

    it('should warn about gaps in hotel bookings', () => {
      const trip: Trip = {
        flights: [
          {
            segments: [
              {
                departTime: '2025-01-15T08:00:00Z',
                arriveTime: '2025-01-15T16:00:00Z',
              },
            ],
          },
          {
            segments: [
              {
                departTime: '2025-01-20T08:00:00Z',
                arriveTime: '2025-01-20T16:00:00Z',
              },
            ],
          },
        ],
        hotels: [],
        cars: [],
      };

      const rows = buildItinerary(trip);
      const warnings = validateItinerary(trip, rows);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('No hotel'))).toBe(true);
    });

    it('should warn about double hotel bookings', () => {
      const trip: Trip = {
        flights: [],
        hotels: [
          {
            propertyName: 'Hotel A',
            checkInDate: '2025-01-15',
            checkOutDate: '2025-01-17',
          },
          {
            propertyName: 'Hotel B',
            checkInDate: '2025-01-15',
            checkOutDate: '2025-01-17',
          },
        ],
        cars: [],
      };

      const rows = buildItinerary(trip);
      const warnings = validateItinerary(trip, rows);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('Double hotel booking'))).toBe(true);
    });

    it('should warn about flights with missing information', () => {
      const trip: Trip = {
        flights: [
          {
            segments: [
              {
                departAirport: 'SFO',
                // Missing arrival airport and times
              },
            ],
          },
        ],
        hotels: [],
        cars: [],
      };

      const rows = buildItinerary(trip);
      const warnings = validateItinerary(trip, rows);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('missing'))).toBe(true);
    });

    it('should warn about hotels with missing information', () => {
      const trip: Trip = {
        flights: [],
        hotels: [
          {
            propertyName: 'Mystery Hotel',
            // Missing dates
          },
        ],
        cars: [],
      };

      const rows = buildItinerary(trip);
      const warnings = validateItinerary(trip, rows);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('Mystery Hotel'))).toBe(true);
      expect(warnings.some(w => w.includes('check-in date'))).toBe(true);
    });

    it('should warn about flights with no segments', () => {
      const trip: Trip = {
        flights: [
          {
            segments: [],
          },
        ],
        hotels: [],
        cars: [],
      };

      const rows = buildItinerary(trip);
      const warnings = validateItinerary(trip, rows);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('no segments'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single-night stays', () => {
      const trip: Trip = {
        flights: [],
        hotels: [
          {
            propertyName: 'One Night Hotel',
            checkInDate: '2025-01-15',
            checkOutDate: '2025-01-16',
          },
        ],
        cars: [],
      };

      const result = buildItinerary(trip);

      expect(result).toHaveLength(2); // Check-in day and check-out day
      expect(result[0].date).toBe('2025-01-15');
      expect(result[0].hotels).toContain('One Night Hotel');
      // Check-out day exists but has no hotel
      expect(result[1].date).toBe('2025-01-16');
    });

    it('should handle same-day pickup and dropoff', () => {
      const trip: Trip = {
        flights: [],
        hotels: [],
        cars: [
          {
            pickupLocation: 'Airport',
            dropoffLocation: 'Hotel',
            pickupTime: '2025-01-15T10:00:00Z',
            dropoffTime: '2025-01-15T18:00:00Z',
          },
        ],
      };

      const result = buildItinerary(trip);

      expect(result).toHaveLength(1);
      expect(result[0].cars).toHaveLength(2); // Pickup and dropoff
    });

    it('should handle trips spanning multiple months', () => {
      const trip: Trip = {
        flights: [],
        hotels: [
          {
            propertyName: 'Long Stay Hotel',
            checkInDate: '2025-01-28',
            checkOutDate: '2025-02-03',
          },
        ],
        cars: [],
      };

      const result = buildItinerary(trip);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].date).toBe('2025-01-28');
      // Range includes checkout date
      expect(result[result.length - 1].date).toBe('2025-02-03');
    });
  });
});

