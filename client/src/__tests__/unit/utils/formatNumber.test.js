/**
 * White-Box Unit Tests for Format Number Utility
 * File: client/src/__tests__/unit/utils/formatNumber.test.js
 * 
 * Tests internal logic and edge cases of number formatting functions
 * Coverage: All formatting functions, edge cases, error handling
 */

import {
  fNumber,
  fCurrency,
  fPercent,
  fShortenNumber,
  fData
} from '../../../utils/formatNumber';

// Mock numeral to control its behavior
jest.mock('numeral', () => {
  const mockNumeral = jest.fn();
  mockNumeral.mockReturnValue({
    format: jest.fn()
  });
  return mockNumeral;
});

import numeral from 'numeral';

describe('Format Number Utility - White-Box Testing', () => {
  let mockFormat;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormat = jest.fn();
    numeral.mockReturnValue({ format: mockFormat });
  });

  describe('fNumber Function - White-Box Testing', () => {
    test('TC_WB_CLIENT_001: Should call numeral with input number', () => {
      const testNumber = 12345;
      mockFormat.mockReturnValue('12,345');

      fNumber(testNumber);

      expect(numeral).toHaveBeenCalledWith(testNumber);
      expect(mockFormat).toHaveBeenCalledWith();
    });

    test('TC_WB_CLIENT_002: Should return formatted result from numeral', () => {
      const testNumber = 12345;
      const expectedFormat = '12,345';
      mockFormat.mockReturnValue(expectedFormat);

      const result = fNumber(testNumber);

      expect(result).toBe(expectedFormat);
    });

    test('TC_WB_CLIENT_003: Should handle zero input', () => {
      mockFormat.mockReturnValue('0');

      const result = fNumber(0);

      expect(numeral).toHaveBeenCalledWith(0);
      expect(result).toBe('0');
    });

    test('TC_WB_CLIENT_004: Should handle negative numbers', () => {
      const testNumber = -12345;
      mockFormat.mockReturnValue('-12,345');

      const result = fNumber(testNumber);

      expect(numeral).toHaveBeenCalledWith(testNumber);
      expect(result).toBe('-12,345');
    });

    test('TC_WB_CLIENT_005: Should handle decimal numbers', () => {
      const testNumber = 12345.67;
      mockFormat.mockReturnValue('12,345.67');

      const result = fNumber(testNumber);

      expect(numeral).toHaveBeenCalledWith(testNumber);
      expect(result).toBe('12,345.67');
    });
  });

  describe('fCurrency Function - White-Box Testing', () => {
    test('TC_WB_CLIENT_006: Should format valid number with currency format', () => {
      const testNumber = 12345.67;
      mockFormat.mockReturnValue('$12,345.67');

      const result = fCurrency(testNumber);

      expect(numeral).toHaveBeenCalledWith(testNumber);
      expect(mockFormat).toHaveBeenCalledWith('$0,0.00');
      expect(result).toBe('$12,345.67');
    });

    test('TC_WB_CLIENT_007: Should return empty string for falsy input', () => {
      const result = fCurrency(null);

      expect(numeral).not.toHaveBeenCalled();
      expect(result).toBe('');
    });

    test('TC_WB_CLIENT_008: Should handle zero input', () => {
      mockFormat.mockReturnValue('$0.00');

      const result = fCurrency(0);

      expect(numeral).toHaveBeenCalledWith(0);
      expect(result).toBe('$0');
    });

    test('TC_WB_CLIENT_009: Should remove .00 suffix when present', () => {
      mockFormat.mockReturnValue('$123.00');

      const result = fCurrency(123);

      expect(result).toBe('$123');
    });

    test('TC_WB_CLIENT_010: Should preserve non-.00 decimals', () => {
      mockFormat.mockReturnValue('$123.45');

      const result = fCurrency(123.45);

      expect(result).toBe('$123.45');
    });

    test('TC_WB_CLIENT_011: Should handle undefined input', () => {
      const result = fCurrency(undefined);

      expect(result).toBe('');
    });

    test('TC_WB_CLIENT_012: Should handle empty string input', () => {
      const result = fCurrency('');

      expect(result).toBe('');
    });
  });

  describe('fPercent Function - White-Box Testing', () => {
    test('TC_WB_CLIENT_013: Should convert number to percentage', () => {
      const testNumber = 50;
      mockFormat.mockReturnValue('0.5%');

      const result = fPercent(testNumber);

      expect(numeral).toHaveBeenCalledWith(0.5); // 50/100
      expect(mockFormat).toHaveBeenCalledWith('0.0%');
      expect(result).toBe('0.5%');
    });

    test('TC_WB_CLIENT_014: Should handle string number input', () => {
      const testNumber = '75';
      mockFormat.mockReturnValue('0.8%');

      const result = fPercent(testNumber);

      expect(numeral).toHaveBeenCalledWith(0.75); // Number('75')/100
      expect(result).toBe('0.8%');
    });

    test('TC_WB_CLIENT_015: Should return empty string for falsy input', () => {
      const result = fPercent(null);

      expect(numeral).not.toHaveBeenCalled();
      expect(result).toBe('');
    });

    test('TC_WB_CLIENT_016: Should remove .0 suffix when present', () => {
      mockFormat.mockReturnValue('1.0%');

      const result = fPercent(100);

      expect(result).toBe('1%');
    });

    test('TC_WB_CLIENT_017: Should preserve non-.0 decimals', () => {
      mockFormat.mockReturnValue('1.5%');

      const result = fPercent(150);

      expect(result).toBe('1.5%');
    });

    test('TC_WB_CLIENT_018: Should handle zero input', () => {
      mockFormat.mockReturnValue('0.0%');

      const result = fPercent(0);

      expect(numeral).toHaveBeenCalledWith(0);
      expect(result).toBe('0%');
    });
  });

  describe('fShortenNumber Function - White-Box Testing', () => {
    test('TC_WB_CLIENT_019: Should format number with abbreviated suffix', () => {
      const testNumber = 1500000;
      mockFormat.mockReturnValue('1.50m');

      const result = fShortenNumber(testNumber);

      expect(numeral).toHaveBeenCalledWith(testNumber);
      expect(mockFormat).toHaveBeenCalledWith('0.00a');
      expect(result).toBe('1.50m');
    });

    test('TC_WB_CLIENT_020: Should return empty string for falsy input', () => {
      const result = fShortenNumber(null);

      expect(numeral).not.toHaveBeenCalled();
      expect(result).toBe('');
    });

    test('TC_WB_CLIENT_021: Should remove .00 suffix when present', () => {
      mockFormat.mockReturnValue('1.00k');

      const result = fShortenNumber(1000);

      expect(result).toBe('1k');
    });

    test('TC_WB_CLIENT_022: Should preserve non-.00 decimals', () => {
      mockFormat.mockReturnValue('1.25k');

      const result = fShortenNumber(1250);

      expect(result).toBe('1.25k');
    });

    test('TC_WB_CLIENT_023: Should handle small numbers', () => {
      mockFormat.mockReturnValue('123.00');

      const result = fShortenNumber(123);

      expect(result).toBe('123');
    });
  });

  describe('fData Function - White-Box Testing', () => {
    test('TC_WB_CLIENT_024: Should format data size with byte suffix', () => {
      const testNumber = 1024;
      mockFormat.mockReturnValue('1.0 KB');

      const result = fData(testNumber);

      expect(numeral).toHaveBeenCalledWith(testNumber);
      expect(mockFormat).toHaveBeenCalledWith('0.0 b');
      expect(result).toBe('1.0 KB');
    });

    test('TC_WB_CLIENT_025: Should return empty string for falsy input', () => {
      const result = fData(null);

      expect(numeral).not.toHaveBeenCalled();
      expect(result).toBe('');
    });

    test('TC_WB_CLIENT_026: Should remove .0 suffix when present', () => {
      mockFormat.mockReturnValue('1.0 MB');

      const result = fData(1048576);

      expect(result).toBe('1 MB');
    });

    test('TC_WB_CLIENT_027: Should preserve non-.0 decimals', () => {
      mockFormat.mockReturnValue('1.5 MB');

      const result = fData(1572864);

      expect(result).toBe('1.5 MB');
    });

    test('TC_WB_CLIENT_028: Should handle zero input', () => {
      mockFormat.mockReturnValue('0.0 B');

      const result = fData(0);

      expect(numeral).toHaveBeenCalledWith(0);
      expect(result).toBe('0 B');
    });
  });

  describe('Internal result Function Logic - White-Box Testing', () => {
    test('TC_WB_CLIENT_029: Should remove .00 suffix correctly', () => {
      mockFormat.mockReturnValue('$123.00');

      const result = fCurrency(123);

      expect(result).toBe('$123');
    });

    test('TC_WB_CLIENT_030: Should remove .0 suffix correctly', () => {
      mockFormat.mockReturnValue('50.0%');

      const result = fPercent(5000);

      expect(result).toBe('50%');
    });

    test('TC_WB_CLIENT_031: Should not remove partial matches', () => {
      mockFormat.mockReturnValue('$1.000');

      const result = fCurrency(1);

      expect(result).toBe('$1.000'); // Should not remove .00 from .000
    });

    test('TC_WB_CLIENT_032: Should handle multiple occurrences of suffix', () => {
      mockFormat.mockReturnValue('$1.00.00');

      const result = fCurrency(1);

      expect(result).toBe('$1.00'); // Should only remove first occurrence
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('TC_WB_CLIENT_033: Should handle NaN input', () => {
      mockFormat.mockReturnValue('NaN');

      const result = fNumber(NaN);

      expect(numeral).toHaveBeenCalledWith(NaN);
      expect(result).toBe('NaN');
    });

    test('TC_WB_CLIENT_034: Should handle Infinity input', () => {
      mockFormat.mockReturnValue('∞');

      const result = fNumber(Infinity);

      expect(numeral).toHaveBeenCalledWith(Infinity);
      expect(result).toBe('∞');
    });

    test('TC_WB_CLIENT_035: Should handle very large numbers', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER;
      mockFormat.mockReturnValue('9,007,199,254,740,991');

      const result = fNumber(largeNumber);

      expect(numeral).toHaveBeenCalledWith(largeNumber);
      expect(result).toBe('9,007,199,254,740,991');
    });

    test('TC_WB_CLIENT_036: Should handle very small numbers', () => {
      const smallNumber = Number.MIN_VALUE;
      mockFormat.mockReturnValue('5e-324');

      const result = fNumber(smallNumber);

      expect(numeral).toHaveBeenCalledWith(smallNumber);
      expect(result).toBe('5e-324');
    });

    test('TC_WB_CLIENT_037: Should handle boolean input', () => {
      mockFormat.mockReturnValue('1');

      const result = fNumber(true);

      expect(numeral).toHaveBeenCalledWith(true);
      expect(result).toBe('1');
    });

    test('TC_WB_CLIENT_038: Should handle array input', () => {
      const arrayInput = [1, 2, 3];
      mockFormat.mockReturnValue('NaN');

      const result = fNumber(arrayInput);

      expect(numeral).toHaveBeenCalledWith(arrayInput);
      expect(result).toBe('NaN');
    });

    test('TC_WB_CLIENT_039: Should handle object input', () => {
      const objectInput = { value: 123 };
      mockFormat.mockReturnValue('NaN');

      const result = fNumber(objectInput);

      expect(numeral).toHaveBeenCalledWith(objectInput);
      expect(result).toBe('NaN');
    });

    test('TC_WB_CLIENT_040: Should handle numeral throwing error', () => {
      numeral.mockImplementation(() => {
        throw new Error('Numeral error');
      });

      expect(() => {
        fNumber(123);
      }).toThrow('Numeral error');
    });
  });
}); 