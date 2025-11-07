import { describe, it, expect } from '@jest/globals';
import {
  normalizeRecord,
  dataIsFlight,
  dataIsHotel,
  dataIsCar,
} from '../data-processing';
import { Flight, Hotel, Car } from '@/types/trip';

describe('data-processing', () => {
  describe('Type Guards', () => {
    it('should identify Flight data correctly', () => {
      const flight: Flight = {
        segments: [
          {
            departAirport: 'SFO',
            arriveAirport: 'JFK',
          },
        ],
      };
      expect(dataIsFlight(flight)).toBe(true);
      expect(dataIsHotel(flight)).toBe(false);
      expect(dataIsCar(flight)).toBe(false);
    });

    it('should identify Hotel data correctly', () => {
      const hotel: Hotel = {
        propertyName: 'Grand Hotel',
        checkInDate: '2025-01-15',
      };
      expect(dataIsHotel(hotel)).toBe(true);
      expect(dataIsFlight(hotel)).toBe(false);
      expect(dataIsCar(hotel)).toBe(false);
    });

    it('should identify Car data correctly', () => {
      const car: Car = {
        pickupLocation: 'SFO Airport',
        dropoffLocation: 'Downtown',
      };
      expect(dataIsCar(car)).toBe(true);
      expect(dataIsFlight(car)).toBe(false);
      expect(dataIsHotel(car)).toBe(false);
    });
  });

  describe('normalizeFlight', () => {
    it('should normalize flight with complete data', () => {
      const raw: Flight = {
        segments: [
          {
            departAirport: 'sfo',
            arriveAirport: 'jfk',
            departTime: '2025-01-15T08:00:00Z',
            arriveTime: '2025-01-15T16:30:00Z',
            flightNumber: 'AA100',
            airline: 'American Airlines',
          },
        ],
        confirmationNumber: '  ABC123  ',
        passengerName: '  John Doe  ',
      };

      const result = normalizeRecord(raw, 'flight') as Flight;

      expect(result.segments).toHaveLength(1);
      expect(result.segments[0].departAirport).toBe('SFO');
      expect(result.segments[0].arriveAirport).toBe('JFK');
      expect(result.segments[0].departTime).toBe('2025-01-15T08:00:00.000Z');
      expect(result.segments[0].flightNumber).toBe('AA100');
      expect(result.confirmationNumber).toBe('ABC123');
      expect(result.passengerName).toBe('John Doe');
    });

    it('should handle multi-segment flights', () => {
      const raw: Flight = {
        segments: [
          {
            departAirport: 'sfo',
            arriveAirport: 'ord',
            departTime: '2025-01-15T08:00:00Z',
            arriveTime: '2025-01-15T14:00:00Z',
          },
          {
            departAirport: 'ord',
            arriveAirport: 'jfk',
            departTime: '2025-01-15T16:00:00Z',
            arriveTime: '2025-01-15T19:00:00Z',
          },
        ],
      };

      const result = normalizeRecord(raw, 'flight') as Flight;

      expect(result.segments).toHaveLength(2);
      expect(result.segments[0].departAirport).toBe('SFO');
      expect(result.segments[1].arriveAirport).toBe('JFK');
    });

    it('should normalize airport codes to uppercase', () => {
      const raw: Flight = {
        segments: [
          {
            departAirport: 'lax',
            arriveAirport: 'nyc',
          },
        ],
      };

      const result = normalizeRecord(raw, 'flight') as Flight;

      expect(result.segments[0].departAirport).toBe('LAX');
      expect(result.segments[0].arriveAirport).toBe('NYC');
    });

    it('should handle missing optional fields', () => {
      const raw: Flight = {
        segments: [
          {
            departAirport: 'SFO',
          },
        ],
      };

      const result = normalizeRecord(raw, 'flight') as Flight;

      expect(result.segments[0].departAirport).toBe('SFO');
      expect(result.segments[0].arriveAirport).toBeUndefined();
      expect(result.confirmationNumber).toBeUndefined();
    });
  });

  describe('normalizeHotel', () => {
    it('should normalize hotel with complete data', () => {
      const raw: Hotel = {
        propertyName: '  Grand Hotel  ',
        checkInDate: '2025-01-15',
        checkOutDate: '2025-01-17',
        confirmationNumber: '  HOTEL123  ',
        address: '  123 Main St  ',
        guestName: '  Jane Smith  ',
      };

      const result = normalizeRecord(raw, 'hotel') as Hotel;

      expect(result.propertyName).toBe('Grand Hotel');
      expect(result.checkInDate).toBe('2025-01-15');
      expect(result.checkOutDate).toBe('2025-01-17');
      expect(result.confirmationNumber).toBe('HOTEL123');
      expect(result.address).toBe('123 Main St');
      expect(result.guestName).toBe('Jane Smith');
    });

    it('should normalize various date formats to ISO', () => {
      const testCases = [
        { input: '2025-01-05', expected: '2025-01-05' }, // Already ISO
        { input: '01/15/2025', expected: '2025-01-15' },
        { input: '1/5/2025', expected: '2025-01-05' },
      ];

      testCases.forEach(({ input, expected }) => {
        const raw: Hotel = {
          propertyName: 'Test Hotel', // Add propertyName so type guard recognizes it
          checkInDate: input,
        };
        const result = normalizeRecord(raw, 'hotel') as Hotel;
        expect(result.checkInDate).toBe(expected);
      });
    });

    it('should handle missing optional fields', () => {
      const raw: Hotel = {
        propertyName: 'Hotel',
      };

      const result = normalizeRecord(raw, 'hotel') as Hotel;

      expect(result.propertyName).toBe('Hotel');
      expect(result.checkInDate).toBeUndefined();
      expect(result.address).toBeUndefined();
    });
  });

  describe('normalizeCar', () => {
    it('should normalize car rental with complete data', () => {
      const raw: Car = {
        pickupLocation: '  SFO Airport  ',
        dropoffLocation: '  Downtown SF  ',
        pickupTime: '2025-01-15T10:00:00Z',
        dropoffTime: '2025-01-17T10:00:00Z',
        confirmationNumber: '  CAR456  ',
        vehicleType: '  SUV  ',
        rentalCompany: '  Hertz  ',
      };

      const result = normalizeRecord(raw, 'car') as Car;

      expect(result.pickupLocation).toBe('SFO Airport');
      expect(result.dropoffLocation).toBe('Downtown SF');
      expect(result.pickupTime).toBe('2025-01-15T10:00:00.000Z');
      expect(result.dropoffTime).toBe('2025-01-17T10:00:00.000Z');
      expect(result.confirmationNumber).toBe('CAR456');
      expect(result.vehicleType).toBe('SUV');
      expect(result.rentalCompany).toBe('Hertz');
    });

    it('should handle missing optional fields', () => {
      const raw: Car = {
        pickupLocation: 'Airport',
      };

      const result = normalizeRecord(raw, 'car') as Car;

      expect(result.pickupLocation).toBe('Airport');
      expect(result.dropoffLocation).toBeUndefined();
      expect(result.vehicleType).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty flight segments', () => {
      const raw: Flight = {
        segments: [],
      };

      const result = normalizeRecord(raw, 'flight') as Flight;

      expect(result.segments).toEqual([]);
    });

    it('should trim all string fields', () => {
      const raw: Hotel = {
        propertyName: '   Spaces Everywhere   ',
        address: '\t\tTabs Too\t\t',
      };

      const result = normalizeRecord(raw, 'hotel') as Hotel;

      expect(result.propertyName).toBe('Spaces Everywhere');
      expect(result.address).toBe('Tabs Too');
    });
  });
});

