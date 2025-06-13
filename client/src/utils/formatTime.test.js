import { fDate, fDateTime, fToNow } from './formatTime';

describe('Time Formatting Utilities', () => {
  // Use a fixed date for all tests to ensure the output is always the same.
  const testDate = '2023-10-26T10:30:00.000Z';

  describe('fDate', () => {
    it('should format a date string into DD/MM/YYYY format', () => {
      expect(fDate(testDate)).toBe('26/10/2023');
    });
  });

  describe('fDateTime', () => {
    it('should format a date-time string into DD/MM/YYYY p format', () => {
      // The output will depend on the timezone of the test runner environment,
      // but we can check the general format.
      // Example for a specific timezone might be: '26/10/2023 1:30 PM'
      // We'll check that it contains the date and a time component.
      const result = fDateTime(testDate);
      expect(result).toContain('26/10/2023');
      expect(result).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/); // Checks for h:mm AM/PM
    });
  });

  describe('fToNow', () => {
    // This is the standard way to test time-sensitive functions
    beforeAll(() => {
      // Lock the current time to a specific point
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-10-26T11:00:00.000Z'));
    });

    afterAll(() => {
      // Restore the real time
      jest.useRealTimers();
    });

    it('should format a date string to a relative time', () => {
      // `testDate` is 30 minutes before the "current" mocked time
      expect(fToNow(testDate)).toBe('30 minutes ago');
    });

    it('should handle dates a few days ago', () => {
      const fewDaysAgo = '2023-10-23T10:00:00.000Z';
      expect(fToNow(fewDaysAgo)).toBe('3 days ago');
    });
  });
});