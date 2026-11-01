import { Decimal } from 'decimal.js';

describe('Decimal.js Financial Calculations', () => {
  describe('Basic Operations', () => {
    test('addition preserves precision', () => {
      const a = new Decimal('0.1');
      const b = new Decimal('0.2');
      expect(a.plus(b).toFixed(2)).toBe('0.30');
    });

    test('subtraction preserves precision', () => {
      const a = new Decimal('1.00');
      const b = new Decimal('0.10');
      expect(a.minus(b).toFixed(2)).toBe('0.90');
    });

    test('multiplication preserves precision', () => {
      const a = new Decimal('100.00');
      const b = new Decimal('1.05');
      expect(a.times(b).toFixed(2)).toBe('105.00');
    });

    test('division preserves precision', () => {
      const a = new Decimal('100.00');
      const b = new Decimal('3');
      const result = a.div(b);
      expect(result.toFixed(2)).toBe('33.33');
      expect(result.times(b).toFixed(2)).toBe('100.00');
    });
  });

  describe('Currency Rounding', () => {
    test('rounds to 2 decimal places', () => {
      const values = ['100.123', '100.126', '100.125', '100.1249'];
      const expected = ['100.12', '100.13', '100.13', '100.12'];

      values.forEach((val, i) => {
        expect(new Decimal(val).toFixed(2)).toBe(expected[i]);
      });
    });

    test('handles large numbers', () => {
      const large = new Decimal('999999999999.99');
      const small = new Decimal('0.01');
      expect(large.plus(small).toFixed(2)).toBe('1000000000000.00');
    });

    test('handles very small numbers', () => {
      const small = new Decimal('0.001');
      expect(small.toFixed(2)).toBe('0.00');
    });
  });

  describe('Financial Invariants', () => {
    test('income minus expense equals balance', () => {
      const income = new Decimal('5000.00');
      const expense = new Decimal('1200.50');
      const balance = income.minus(expense);
      expect(balance.toFixed(2)).toBe('3799.50');
    });

    test('sum of category totals equals monthly total', () => {
      const categories = [
        new Decimal('500.00'),
        new Decimal('300.00'),
        new Decimal('200.00'),
        new Decimal('100.50'),
        new Decimal('100.00'),
      ];
      const sum = categories.reduce((acc, val) => acc.plus(val), new Decimal('0'));
      expect(sum.toFixed(2)).toBe('1200.50');
    });

    test('percentage calculation is accurate', () => {
      const spent = new Decimal('800.00');
      const budget = new Decimal('1000.00');
      const percentage = spent.div(budget).mul(100);
      expect(percentage.toFixed(2)).toBe('80.00');
    });

    test('repeating decimal handling', () => {
      const result = new Decimal('100').div(3);
      expect(result.toFixed(2)).toBe('33.33');
      expect(result.times(3).toFixed(2)).toBe('100.00');
    });
  });

  describe('Edge Cases', () => {
    test('zero handling', () => {
      expect(new Decimal('0').toFixed(2)).toBe('0.00');
      expect(new Decimal('0').plus('100').toFixed(2)).toBe('100.00');
    });

    test('negative numbers for validation', () => {
      const negative = new Decimal('-100');
      expect(negative.isNegative()).toBe(true);
      expect(negative.abs().toFixed(2)).toBe('100.00');
    });

    test('string input parsing', () => {
      expect(new Decimal('1000.50').toFixed(2)).toBe('1000.50');
      expect(new Decimal('1000').toFixed(2)).toBe('1000.00');
      expect(new Decimal('.50').toFixed(2)).toBe('0.50');
    });

    test('chained operations maintain precision', () => {
      let result = new Decimal('1000');
      result = result.plus('100').minus('50').times('1.1').div('2');
      expect(result.toFixed(2)).toBe('577.50');
    });
  });

  describe('Comparison Operations', () => {
    test('equals comparison', () => {
      expect(new Decimal('100.00').equals('100')).toBe(true);
      expect(new Decimal('100.00').equals('100.01')).toBe(false);
    });

    test('greater than / less than', () => {
      expect(new Decimal('100').gt('99')).toBe(true);
      expect(new Decimal('100').lt('101')).toBe(true);
      expect(new Decimal('100').gte('100')).toBe(true);
      expect(new Decimal('100').lte('100')).toBe(true);
    });
  });

  describe('Precision Configuration', () => {
    test('default precision is 20', () => {
      expect(Decimal.precision).toBe(20);
    });

    test('can configure precision', () => {
      Decimal.set({ precision: 10 });
      expect(new Decimal('1').div('3').toString()).toBe('0.3333333333');
      Decimal.set({ precision: 20 });
    });

    test('rounding modes', () => {
      Decimal.set({ rounding: Decimal.ROUND_HALF_UP });
      expect(new Decimal('1.005').toFixed(2)).toBe('1.01');
      Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN });
    });
  });
});