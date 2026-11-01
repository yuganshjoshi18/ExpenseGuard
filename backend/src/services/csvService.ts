import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { Decimal } from 'decimal.js';
import { prisma } from '../utils/prisma';
import { categoryRepository } from '../repositories/categoryRepository';
import { transactionRepository } from '../repositories/transactionRepository';
import { Prisma, TransactionType } from '@prisma/client';

function makeUtcDate(year: number, month: number, day: number): Date | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function parseDate(dateStr: string): Date | null {
  const parts = dateStr.split(/[-/.]/);
  if (parts.length !== 3) return null;

  const [first, second, third] = parts.map(part => Number(part));
  if ([first, second, third].some(Number.isNaN)) return null;

  // Year-first formats: yyyy-MM-dd / yyyy/MM/dd
  if (parts[0].length === 4) {
    return makeUtcDate(first, second, third);
  }

  // Year-last formats. Prefer dd/MM unless the first component can only be a
  // month (e.g. 01/15/2024).
  if (parts[2].length === 4) {
    const monthFirst = first <= 12 && second > 12;
    return monthFirst
      ? makeUtcDate(third, first, second)
      : makeUtcDate(third, second, first);
  }

  return null;
}

export const csvService = {
  async import(
    csvContent: string,
    options: { skipDuplicates: boolean } = { skipDuplicates: true }
  ) {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const validTransactions: Prisma.TransactionUncheckedCreateInput[] = [];
    const errors: Array<{ row: number; field: string; message: string; value?: string }> = [];
    let duplicates = 0;

    // Get all categories for lookup
    const categories = await categoryRepository.findMany();
    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

    for (let i = 0; i < records.length; i++) {
      const row: Record<string, string> = records[i] as Record<string, string>;
      const rowNum = i + 2; // +2 for header and 0-index

      try {
        // Validate required fields
        if (!row.title || !row.title.trim()) {
          errors.push({ row: rowNum, field: 'title', message: 'Title is required', value: row.title });
          continue;
        }

        if (!row.amount || row.amount.trim() === '') {
          errors.push({ row: rowNum, field: 'amount', message: 'Amount is required', value: row.amount });
          continue;
        }

        const amount = new Decimal(row.amount);
        if (amount.lte(0)) {
          errors.push({ row: rowNum, field: 'amount', message: 'Amount must be positive', value: row.amount });
          continue;
        }

        if (!row.type || !['INCOME', 'EXPENSE'].includes(row.type.toUpperCase())) {
          errors.push({ row: rowNum, field: 'type', message: 'Type must be INCOME or EXPENSE', value: row.type });
          continue;
        }

        if (!row.category || !row.category.trim()) {
          errors.push({ row: rowNum, field: 'category', message: 'Category is required', value: row.category });
          continue;
        }

        const categoryId = categoryMap.get(row.category.trim().toLowerCase());
        if (!categoryId) {
          errors.push({ row: rowNum, field: 'category', message: 'Category not found', value: row.category });
          continue;
        }

        if (!row.date || !row.date.trim()) {
          errors.push({ row: rowNum, field: 'date', message: 'Date is required', value: row.date });
          continue;
        }

        const parsedDate = parseDate(row.date.trim());
        if (!parsedDate) {
          errors.push({ row: rowNum, field: 'date', message: 'Invalid date format', value: row.date });
          continue;
        }

        // Check for duplicates
        if (options.skipDuplicates) {
          const existing = await transactionRepository.findDuplicates(
            row.title.trim(),
            amount,
            parsedDate,
            categoryId
          );
          if (existing.length > 0) {
            duplicates++;
            continue;
          }
        }

        validTransactions.push({
          title: row.title.trim(),
          amount: amount.toFixed(2),
          type: row.type.toUpperCase() as TransactionType,
          categoryId,
          date: parsedDate,
          description: row.description?.trim() || null,
          paymentMethod: (row.paymentMethod?.trim() || null) as Prisma.TransactionUncheckedCreateInput['paymentMethod'],
        });
      } catch (error) {
        errors.push({ row: rowNum, field: 'unknown', message: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // Import valid transactions in a transaction
    let imported = 0;
    if (validTransactions.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const t of validTransactions) {
          await tx.transaction.create({ data: t });
          imported++;
        }
      });
    }

    return {
      total: records.length,
      valid: validTransactions.length + duplicates,
      invalid: errors.length,
      duplicates,
      imported,
      errors,
      transactions: validTransactions,
    };
  },

  async export(): Promise<string> {
    const transactions = await transactionRepository.findMany(
      {},
      { page: 1, limit: 10000, sortBy: 'date', sortOrder: 'asc' }
    );

    const categories = await categoryRepository.findMany();
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    const records = transactions.data.map(t => ({
      id: t.id,
      title: t.title,
      amount: t.amount.toFixed(2),
      type: t.type,
      category: categoryMap.get(t.categoryId) || '',
      date: t.date.toISOString().split('T')[0],
      description: t.description || '',
      paymentMethod: t.paymentMethod || '',
      createdAt: t.createdAt.toISOString(),
    }));

    return stringify(records, { header: true });
  },
};