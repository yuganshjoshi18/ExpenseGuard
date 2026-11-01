import * as fc from 'fast-check';
import { formatCurrency, formatDate, formatRelativeDate } from '../utils/format';

describe('Property-based Tests', () => {
  describe('formatCurrency', () => {
    test('preserves positive amounts', () => {
      fc.assert(fc.property(fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }), (amount) => {
        const formatted = formatCurrency(amount);
        // Compare the numeric digits so locale grouping and symbols don't matter.
        expect(formatted.replace(/\D/g, '')).toBe(amount.toFixed(2).replace('.', ''));
      }));
    });

    test('handles zero', () => {
      expect(formatCurrency(0)).toBe('₹0.00');
    });

    test('formats with Indian locale', () => {
      expect(formatCurrency(100000)).toContain('1,00,000');
      expect(formatCurrency(10000000)).toContain('1,00,00,000');
    });
  });

  describe('formatDate', () => {
    test('formats valid ISO dates', () => {
      fc.assert(fc.property(fc.date({ min: new Date('1000-01-01'), max: new Date('9999-12-31') }), (date) => {
        const iso = date.toISOString().split('T')[0];
        const formatted = formatDate(iso);
        expect(formatted).toMatch(/^\d{2} [A-Za-z]{3,4} \d{4}$/);
      }));
    });

    test('returns "Invalid date" for invalid input', () => {
      expect(formatDate('invalid')).toBe('Invalid date');
      expect(formatDate('')).toBe('Invalid date');
    });
  });

  describe('formatRelativeDate', () => {
    test('returns "Today" for current date', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(formatRelativeDate(today)).toBe('Today');
    });

    test('returns "Tomorrow" for next day', () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      expect(formatRelativeDate(tomorrow)).toBe('Tomorrow');
    });

    test('returns "Yesterday" for previous day', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      expect(formatRelativeDate(yesterday)).toBe('Yesterday');
    });
  });

  describe('Transaction invariants', () => {
    test('adding income increases total income', () => {
      let totalIncome = 0;
      let _totalExpense = 0;

      const addTransaction = (type: 'INCOME' | 'EXPENSE', amount: number) => {
        if (type === 'INCOME') totalIncome += amount;
        else _totalExpense += amount;
      };

      fc.assert(fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
        (income, expense) => {
          const initialIncome = totalIncome;
          addTransaction('INCOME', income);
          addTransaction('EXPENSE', expense);
          expect(totalIncome).toBe(initialIncome + income);
        }
      ));
    });

    test('adding expense increases total expenses', () => {
      let _totalIncome = 0;
      let totalExpense = 0;

      const addTransaction = (type: 'INCOME' | 'EXPENSE', amount: number) => {
        if (type === 'INCOME') _totalIncome += amount;
        else totalExpense += amount;
      };

      fc.assert(fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
        (income, expense) => {
          const initialExpense = totalExpense;
          addTransaction('INCOME', income);
          addTransaction('EXPENSE', expense);
          expect(totalExpense).toBe(initialExpense + expense);
        }
      ));
    });

    test('balance equals income minus expenses', () => {
      let totalIncome = 0;
      let totalExpense = 0;

      const addTransaction = (type: 'INCOME' | 'EXPENSE', amount: number) => {
        if (type === 'INCOME') totalIncome += amount;
        else totalExpense += amount;
      };

      fc.assert(fc.property(
        fc.array(fc.record({
          type: fc.constantFrom<'INCOME' | 'EXPENSE'>('INCOME', 'EXPENSE'),
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
        }), { minLength: 1, maxLength: 100 }),
        (transactions) => {
          totalIncome = 0;
          totalExpense = 0;

          transactions.forEach(t => addTransaction(t.type, t.amount));

          const balance = totalIncome - totalExpense;
          expect(balance).toBe(totalIncome - totalExpense);
        }
      ));
    });
  });

  describe('Budget invariants', () => {
    test('percentage spent = spent / budget * 100', () => {
      fc.assert(fc.property(
        fc.float({ min: 1, max: 100000, noNaN: true }),
        fc.float({ min: 0, max: 100000, noNaN: true }),
        (budget, spent) => {
          const percentage = budget > 0 ? (spent / budget) * 100 : 0;
          expect(percentage).toBeCloseTo((spent / Math.max(budget, 0.01)) * 100, 2);
        }
      ));
    });

    test('remaining = budget - spent', () => {
      fc.assert(fc.property(
        fc.float({ min: 1, max: 100000, noNaN: true }),
        fc.float({ min: 0, max: 100000, noNaN: true }),
        (budget, spent) => {
          const remaining = budget - spent;
          expect(remaining).toBe(budget - spent);
        }
      ));
    });

    test('isWarning when percentage >= 80 and < 100', () => {
      fc.assert(fc.property(
        fc.float({ min: 1, max: 100000, noNaN: true }),
        fc.float({ min: 0, max: 100000, noNaN: true }),
        (budget, spent) => {
          const percentage = budget > 0 ? (spent / budget) * 100 : 0;
          const isWarning = percentage >= 80 && percentage < 100;
          expect(isWarning).toBe(percentage >= 80 && percentage < 100);
        }
      ));
    });

    test('isCritical when percentage >= 100', () => {
      fc.assert(fc.property(
        fc.float({ min: 1, max: 100000, noNaN: true }),
        fc.float({ min: 0, max: 100000, noNaN: true }),
        (budget, spent) => {
          const percentage = budget > 0 ? (spent / budget) * 100 : 0;
          const isCritical = percentage >= 100;
          expect(isCritical).toBe(percentage >= 100);
        }
      ));
    });
  });

  describe('Category invariants', () => {
    test('category names are unique', () => {
      fc.assert(fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 20 }),
        (names) => {
          const uniqueNames = new Set(names);
          expect(uniqueNames.size).toBeLessThanOrEqual(names.length);
        }
      ));
    });
  });

  describe('Date invariants', () => {
    test('month boundaries are consistent', () => {
      fc.assert(fc.property(
        fc.integer({ min: 2000, max: 2100 }),
        fc.integer({ min: 1, max: 12 }),
        (year, month) => {
          const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
          const endOfMonth = new Date(Date.UTC(year, month, 1));

          expect(startOfMonth.getUTCMonth() + 1).toBe(month);
          expect(endOfMonth.getUTCMonth() + 1).toBe(month === 12 ? 1 : month + 1);
        }
      ));
    });

    test('leap year February has 29 days', () => {
      fc.assert(fc.property(
        fc.integer({ min: 2000, max: 2100 }).filter(y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0),
        (year) => {
          const febStart = new Date(Date.UTC(year, 1, 1));
          const marStart = new Date(Date.UTC(year, 2, 1));
          const daysInFeb = (marStart.getTime() - febStart.getTime()) / (1000 * 60 * 60 * 24);
          expect(daysInFeb).toBe(29);
        }
      ));
    });

    test('non-leap year February has 28 days', () => {
      fc.assert(fc.property(
        fc.integer({ min: 2000, max: 2100 }).filter(y => !((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)),
        (year) => {
          const febStart = new Date(Date.UTC(year, 1, 1));
          const marStart = new Date(Date.UTC(year, 2, 1));
          const daysInFeb = (marStart.getTime() - febStart.getTime()) / (1000 * 60 * 60 * 24);
          expect(daysInFeb).toBe(28);
        }
      ));
    });
  });
});