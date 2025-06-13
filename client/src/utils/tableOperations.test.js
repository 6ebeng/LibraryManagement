import { applySortFilter, getComparator } from './tableOperations';

describe('Table Operation Utilities', () => {
  // Create a sample dataset to test against
  const testData = [
    { name: 'Charlie', age: 30, city: 'London' },
    { name: 'Alice', age: 25, city: 'Paris' },
    { name: 'Bob', age: 35, city: 'London' },
  ];

  describe('getComparator', () => {
    it('should create a descending comparator that sorts correctly', () => {
      const comparator = getComparator('desc', 'age');
      const sorted = [...testData].sort(comparator);
      expect(sorted[0].name).toBe('Bob'); // Age 35
      expect(sorted[2].name).toBe('Alice'); // Age 25
    });

    it('should create an ascending comparator that sorts correctly', () => {
      const comparator = getComparator('asc', 'age');
      const sorted = [...testData].sort(comparator);
      expect(sorted[0].name).toBe('Alice'); // Age 25
      expect(sorted[2].name).toBe('Bob'); // Age 35
    });
  });

  describe('applySortFilter', () => {
    it('should filter the array based on the query', () => {
      const comparator = getComparator('asc', 'name');
      const filtered = applySortFilter(testData, comparator, 'london'); // Case-insensitive
      expect(filtered.length).toBe(2);
      expect(filtered.some(item => item.name === 'Charlie')).toBe(true);
      expect(filtered.some(item => item.name === 'Bob')).toBe(true);
    });

    it('should sort the array after filtering', () => {
      // Sort by name (asc) and filter for 'London'
      const comparator = getComparator('asc', 'name');
      const result = applySortFilter(testData, comparator, 'london');
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Bob'); // B comes before C
      expect(result[1].name).toBe('Charlie');
    });

    it('should return the original sorted array if query is empty', () => {
      const comparator = getComparator('desc', 'age');
      const result = applySortFilter(testData, comparator, '');
      expect(result.length).toBe(3);
      expect(result[0].name).toBe('Bob'); // Still sorted by age desc
    });
  });
});