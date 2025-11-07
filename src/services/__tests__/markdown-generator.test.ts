import { describe, it, expect } from '@jest/globals';
import { buildMarkdownContent } from '../markdown-generator';
import { DayRow } from '@/types/trip';

describe('markdown-generator', () => {
  describe('buildMarkdownContent', () => {
    it('should generate markdown with title and headers', () => {
      const rows: DayRow[] = [];
      const warnings: string[] = [];

      const result = buildMarkdownContent(rows, warnings);

      expect(result).toContain('# Your Trip Itinerary');
      expect(result).toContain('## Daily Itinerary');
      expect(result).toContain('## Validation Warnings');
    });

    it('should show "no data" message for empty itinerary', () => {
      const rows: DayRow[] = [];
      const warnings: string[] = [];

      const result = buildMarkdownContent(rows, warnings);

      expect(result).toContain('*No itinerary data available.*');
    });

    it('should display trip duration summary', () => {
      const rows: DayRow[] = [
        {
          date: '2025-01-15',
          hotels: ['Hotel A'],
          flights: [],
          cars: [],
        },
        {
          date: '2025-01-16',
          hotels: ['Hotel A'],
          flights: [],
          cars: [],
        },
        {
          date: '2025-01-17',
          hotels: ['Hotel B'],
          flights: [],
          cars: [],
        },
      ];
      const warnings: string[] = [];

      const result = buildMarkdownContent(rows, warnings);

      expect(result).toContain('**Trip Duration:**');
      expect(result).toContain('2025-01-15');
      expect(result).toContain('2025-01-17');
      expect(result).toContain('3 days');
    });

    it('should generate table with all columns', () => {
      const rows: DayRow[] = [
        {
          date: '2025-01-15',
          hotels: ['Grand Hotel'],
          flights: ['AA100 SFO → JFK 08:00'],
          cars: ['Pickup JFK Airport 10:00'],
        },
      ];
      const warnings: string[] = [];

      const result = buildMarkdownContent(rows, warnings);

      expect(result).toContain('| Date | Day | Lodging | Flights | Car |');
      expect(result).toContain('Grand Hotel');
      expect(result).toContain('AA100 SFO → JFK 08:00');
      expect(result).toContain('Pickup JFK Airport 10:00');
    });

    it('should use dash for empty cells', () => {
      const rows: DayRow[] = [
        {
          date: '2025-01-15',
          hotels: [],
          flights: [],
          cars: [],
        },
      ];
      const warnings: string[] = [];

      const result = buildMarkdownContent(rows, warnings);

      // Should have dashes for empty cells
      expect(result).toMatch(/\|\s+-\s+\|\s+-\s+\|\s+-\s+\|/);
    });

    it('should handle multiple items in same column with line breaks', () => {
      const rows: DayRow[] = [
        {
          date: '2025-01-15',
          hotels: ['Hotel A', 'Hotel B'],
          flights: ['Flight 1', 'Flight 2'],
          cars: ['Car 1', 'Car 2'],
        },
      ];
      const warnings: string[] = [];

      const result = buildMarkdownContent(rows, warnings);

      expect(result).toContain('Hotel A<br>Hotel B');
      expect(result).toContain('Flight 1<br>Flight 2');
      expect(result).toContain('Car 1<br>Car 2');
    });

    it('should show checkmark when no warnings', () => {
      const rows: DayRow[] = [
        {
          date: '2025-01-15',
          hotels: ['Hotel'],
          flights: [],
          cars: [],
        },
      ];
      const warnings: string[] = [];

      const result = buildMarkdownContent(rows, warnings);

      expect(result).toContain('✅ **None** - Your itinerary looks good!');
    });

    it('should list warnings when present', () => {
      const rows: DayRow[] = [];
      const warnings: string[] = [
        'No hotel booked for 2025-01-16',
        'Flight #1 missing departure time',
      ];

      const result = buildMarkdownContent(rows, warnings);

      expect(result).toContain('⚠️ **Please review the following:**');
      expect(result).toContain('- No hotel booked for 2025-01-16');
      expect(result).toContain('- Flight #1 missing departure time');
    });

    it('should format dates correctly', () => {
      const rows: DayRow[] = [
        {
          date: '2025-01-15',
          hotels: [],
          flights: [],
          cars: [],
        },
      ];
      const warnings: string[] = [];

      const result = buildMarkdownContent(rows, warnings);

      // Should contain formatted date like "Jan 15, 2025"
      expect(result).toContain('Jan 15, 2025');
      // Should contain day name like "Wed"
      expect(result).toMatch(/\|\s+\w{3}\s+\|/);
    });

    it('should handle multiple days correctly', () => {
      const rows: DayRow[] = [
        {
          date: '2025-01-15',
          hotels: ['Hotel A'],
          flights: [],
          cars: [],
        },
        {
          date: '2025-01-16',
          hotels: ['Hotel A'],
          flights: [],
          cars: [],
        },
        {
          date: '2025-01-17',
          hotels: ['Hotel B'],
          flights: ['Flight home'],
          cars: [],
        },
      ];
      const warnings: string[] = [];

      const result = buildMarkdownContent(rows, warnings);

      // Should have 3 data rows (plus header rows)
      const tableRows = result.split('\n').filter(line => 
        line.startsWith('|') && !line.includes('---') && !line.includes('Date | Day')
      );
      expect(tableRows.length).toBe(3);
    });

    it('should escape special markdown characters if needed', () => {
      const rows: DayRow[] = [
        {
          date: '2025-01-15',
          hotels: ['Hotel * Special'],
          flights: [],
          cars: [],
        },
      ];
      const warnings: string[] = [];

      const result = buildMarkdownContent(rows, warnings);

      // Should still contain the hotel name
      expect(result).toContain('Hotel * Special');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long item names', () => {
      const rows: DayRow[] = [
        {
          date: '2025-01-15',
          hotels: ['A Very Long Hotel Name That Goes On And On And On'],
          flights: [],
          cars: [],
        },
      ];
      const warnings: string[] = [];

      const result = buildMarkdownContent(rows, warnings);

      expect(result).toContain('A Very Long Hotel Name That Goes On And On And On');
    });

    it('should handle undefined arrays gracefully', () => {
      const rows: DayRow[] = [
        {
          date: '2025-01-15',
        },
      ];
      const warnings: string[] = [];

      const result = buildMarkdownContent(rows, warnings);

      // Should handle undefined arrays and show dashes
      expect(result).toMatch(/\|\s+-\s+\|\s+-\s+\|\s+-\s+\|/);
    });

    it('should handle many warnings', () => {
      const rows: DayRow[] = [];
      const warnings: string[] = Array(10).fill('Warning message');

      const result = buildMarkdownContent(rows, warnings);

      const warningLines = result.split('\n').filter(line => line.startsWith('- Warning'));
      expect(warningLines.length).toBe(10);
    });
  });
});

