import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

describe('Timezone Handling', () => {
  const TIMEZONE = 'Asia/Kolkata';

  describe('Month Boundaries in Asia/Kolkata', () => {
    test('January 2024 start and end in UTC', () => {
      // Create local date string for start of month in Asia/Kolkata
      const localStart = '2024-01-01T00:00:00';
      const localEnd = '2024-01-31T23:59:59.999';

      // Convert to UTC
      const startUTC = zonedTimeToUtc(localStart, TIMEZONE);
      const endUTC = zonedTimeToUtc(localEnd, TIMEZONE);

      expect(startUTC.toISOString()).toBe('2023-12-31T18:30:00.000Z');
      expect(endUTC.toISOString()).toBe('2024-01-31T18:29:59.999Z');
    });

    test('February 2024 (leap year) in UTC', () => {
      const localStart = '2024-02-01T00:00:00';
      const localEnd = '2024-02-29T23:59:59.999';

      const startUTC = zonedTimeToUtc(localStart, TIMEZONE);
      const endUTC = zonedTimeToUtc(localEnd, TIMEZONE);

      expect(startUTC.toISOString()).toBe('2024-01-31T18:30:00.000Z');
      expect(endUTC.toISOString()).toBe('2024-02-29T18:29:59.999Z');
    });

    test('December 2024 to January 2025 transition', () => {
      const decEnd = '2024-12-31T23:59:59.999';
      const janStart = '2025-01-01T00:00:00';

      const decEndUTC = zonedTimeToUtc(decEnd, TIMEZONE);
      const janStartUTC = zonedTimeToUtc(janStart, TIMEZONE);

      expect(decEndUTC.toISOString()).toBe('2024-12-31T18:29:59.999Z');
      expect(janStartUTC.toISOString()).toBe('2024-12-31T18:30:00.000Z');
    });
  });

  describe('UTC Midnight Boundary Cases', () => {
    test('Transaction at UTC midnight on month boundary', () => {
      // 2024-01-31T23:30:00Z = 2024-02-01T05:00:00+05:30
      const utcDate = new Date('2024-01-31T23:30:00.000Z');
      const zoned = utcToZonedTime(utcDate, TIMEZONE);
      const month = zoned.getMonth() + 1;

      expect(month).toBe(2); // Should be February in Asia/Kolkata
    });

    test('Transaction at UTC midnight on year boundary', () => {
      // 2024-12-31T23:30:00Z = 2025-01-01T05:00:00+05:30
      const utcDate = new Date('2024-12-31T23:30:00.000Z');
      const zoned = utcToZonedTime(utcDate, TIMEZONE);
      const month = zoned.getMonth() + 1;
      const year = zoned.getFullYear();

      expect(month).toBe(1); // Should be January
      expect(year).toBe(2025); // Should be 2025
    });

    test('Transaction exactly at UTC midnight', () => {
      const utcDate = new Date('2024-01-31T00:00:00.000Z');
      const zoned = utcToZonedTime(utcDate, TIMEZONE);
      const month = zoned.getMonth() + 1;

      expect(month).toBe(1); // Should still be January in Asia/Kolkata
    });
  });

  describe('Timezone Conversion Consistency', () => {
    test('Round-trip UTC -> Zone -> UTC preserves time', () => {
      const original = new Date('2024-06-15T12:00:00.000Z');
      const zoned = utcToZonedTime(original, TIMEZONE);
      const backToUtc = zonedTimeToUtc(zoned, TIMEZONE);

      expect(backToUtc.getTime()).toBe(original.getTime());
    });

    test('Different timezones produce different local times', () => {
      const utc = new Date('2024-01-15T12:00:00.000Z');
      const kolkata = utcToZonedTime(utc, 'Asia/Kolkata');
      const newYork = utcToZonedTime(utc, 'America/New_York');
      const london = utcToZonedTime(utc, 'Europe/London');

      expect(kolkata.getHours()).toBe(17); // 12:00 + 5:30
      expect(newYork.getHours()).toBe(7);  // 12:00 - 5:00 (EST)
      expect(london.getHours()).toBe(12);  // 12:00 + 0:00 (GMT)
    });
  });

  describe('Month Boundary Queries', () => {
    test('Query range covers full local month', () => {
      const year = 2024;
      const month = 1; // January

      const localStart = `${year}-${String(month).padStart(2, '0')}-01T00:00:00`;
      const localEnd = `${year}-${String(month).padStart(2, '0')}-31T23:59:59.999`;

      const startUTC = zonedTimeToUtc(localStart, TIMEZONE);
      const endUTC = zonedTimeToUtc(localEnd, TIMEZONE);

      // A transaction at 2024-01-31T18:00:00Z = 2024-01-31T23:30 IST should be included
      const testDate = new Date('2024-01-31T18:00:00.000Z');
      expect(testDate >= startUTC && testDate <= endUTC).toBe(true);

      // A transaction at 2024-01-31T23:30:00Z = 2024-02-01T05:00 IST should NOT be included
      const nextMonthDate = new Date('2024-01-31T23:30:00.000Z');
      expect(nextMonthDate >= startUTC && nextMonthDate <= endUTC).toBe(false);
    });
  });
});
