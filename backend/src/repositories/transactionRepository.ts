import { Prisma, Transaction, TransactionType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { Decimal } from 'decimal.js';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

const padMonth = (month: number) => String(month).padStart(2, '0');

/**
 * Returns the [start, end) UTC instants that cover a calendar month in the
 * requested reporting timezone. The end is the start of the following month.
 */
function getMonthRange(year: number, month: number, timezone: string) {
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  return {
    startDate: zonedTimeToUtc(`${year}-${padMonth(month)}-01T00:00:00`, timezone),
    endDate: zonedTimeToUtc(`${nextYear}-${padMonth(nextMonth)}-01T00:00:00`, timezone),
  };
}

export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: 'date' | 'amount' | 'title' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const transactionRepository = {
  async create(data: Prisma.TransactionUncheckedCreateInput): Promise<Transaction> {
    return prisma.transaction.create({ data });
  },

  async findById(id: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({ where: { id } });
  },

  async findMany(
    filters: TransactionFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<Transaction>> {
    const where: Prisma.TransactionWhereInput = {};

    if (filters.type) where.type = filters.type;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: { category: true },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  },

  async update(id: string, data: Prisma.TransactionUpdateInput): Promise<Transaction> {
    return prisma.transaction.update({ where: { id }, data });
  },

  async delete(id: string): Promise<Transaction> {
    return prisma.transaction.delete({ where: { id } });
  },

  async getMonthlyTotals(year: number, month: number, timezone: string): Promise<{
    income: Decimal;
    expense: Decimal;
    balance: Decimal;
  }> {
    const { startDate, endDate } = getMonthRange(year, month, timezone);

    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: { amount: true, type: true },
    });

    let income = new Decimal(0);
    let expense = new Decimal(0);

    for (const t of transactions) {
      const amount = new Decimal(t.amount.toString());
      if (t.type === 'INCOME') {
        income = income.plus(amount);
      } else {
        expense = expense.plus(amount);
      }
    }

    return {
      income,
      expense,
      balance: income.minus(expense),
    };
  },

  async getCategoryTotals(year: number, month: number, timezone: string): Promise<Array<{
    categoryId: string;
    categoryName: string;
    amount: Decimal;
    type: TransactionType;
  }>> {
    const { startDate, endDate } = getMonthRange(year, month, timezone);

    const results = await prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const categoryIds = [...new Set(results.map(r => r.categoryId))];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    return results.map(r => ({
      categoryId: r.categoryId,
      categoryName: categoryMap.get(r.categoryId) || 'Unknown',
      amount: new Decimal(r._sum.amount?.toString() || '0'),
      type: r.type,
    }));
  },

  async findDuplicates(
    title: string,
    amount: Decimal,
    date: Date,
    categoryId: string
  ): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: {
        title,
        amount: amount.toFixed(2),
        date: {
          gte: new Date(date.getTime() - 24 * 60 * 60 * 1000),
          lte: new Date(date.getTime() + 24 * 60 * 60 * 1000),
        },
        categoryId,
      },
    });
  },

  async createMany(data: Prisma.TransactionCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return prisma.transaction.createMany({ data, skipDuplicates: true });
  },

  async getYearlyComparison(year: number, timezone: string): Promise<Array<{
    month: number;
    income: Decimal;
    expense: Decimal;
  }>> {
    const startDate = zonedTimeToUtc(`${year}-01-01T00:00:00`, timezone);
    const endDate = zonedTimeToUtc(`${year + 1}-01-01T00:00:00`, timezone);

    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: { amount: true, type: true, date: true },
    });

    const monthlyMap = new Map<number, { income: Decimal; expense: Decimal }>();
    for (let m = 1; m <= 12; m++) {
      monthlyMap.set(m, { income: new Decimal(0), expense: new Decimal(0) });
    }

    for (const t of transactions) {
      const month = utcToZonedTime(t.date, timezone).getMonth() + 1;
      const amount = new Decimal(t.amount.toString());
      const entry = monthlyMap.get(month)!;
      if (t.type === 'INCOME') {
        entry.income = entry.income.plus(amount);
      } else {
        entry.expense = entry.expense.plus(amount);
      }
    }

    return Array.from(monthlyMap.entries()).map(([month, totals]) => ({
      month,
      income: totals.income,
      expense: totals.expense,
    }));
  },
};