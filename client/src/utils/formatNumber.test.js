import { fCurrency, fPercent, fNumber, fShortenNumber } from './formatNumber';

describe('Number Formatting Utilities', () => {

  describe('fCurrency', () => {
    it('should format a positive number into a currency string', () => {
      expect(fCurrency(12345.67)).toBe('$12,345.67');
    });

    it('should format zero correctly', () => {
      expect(fCurrency(0)).toBe('$0.00');
    });

    it('should handle non-number inputs gracefully', () => {
      expect(fCurrency(null)).toBe('');
      expect(fCurrency(undefined)).toBe('');
    });
  });

  describe('fPercent', () => {
    it('should format a number into a percentage string', () => {
      // Note: The function divides by 100 before formatting.
      // numeral(50 / 100).format('0.0%') => numeral(0.5).format('0.0%') => '50.0%'
      expect(fPercent(50)).toBe('50.0%');
    });

    it('should handle decimal values correctly', () => {
      expect(fPercent(99.95)).toBe('99.95%');
    });
  });

  describe('fNumber', () => {
    it('should format a number with thousand separators', () => {
      expect(fNumber(1234567)).toBe('1,234,567');
    });
  });

  describe('fShortenNumber', () => {
    it('should shorten numbers in the thousands with a "k"', () => {
      expect(fShortenNumber(5500)).toBe('5.5k');
    });

    it('should shorten numbers in the millions with an "m"', () => {
      expect(fShortenNumber(1200000)).toBe('1.2m');
    });

    it('should not shorten numbers less than 1000', () => {
      expect(fShortenNumber(999)).toBe(999);
    });
  });

});