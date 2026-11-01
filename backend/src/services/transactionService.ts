import { Decimal } from 'decimal.js';
import { transactionRepository } from '../repositories/transactionRepository';
import { categoryRepository } from '../repositories/categoryRepository';
import { AppError } from '../middleware/errorHandler';
import { TransactionType, PaymentMethod, Prisma } from '@prisma/client';

export const transactionService = {
  async create(data: {
    title: string;
    amount: string;
    type: TransactionType;
    categoryId: string;
    date: string;
    description?: string;
    paymentMethod?: PaymentMethod;
  }) {
    const category = await categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    const amount = new Decimal(data.amount);
    if (amount.lte(0)) {
      throw new AppError(400, 'Amount must be positive');
    }

    const transaction = await transactionRepository.create({
      title: data.title,
      amount: amount.toFixed(2),
      type: data.type,
      categoryId: data.categoryId,
      date: new Date(data.date),
      description: data.description,
      paymentMethod: data.paymentMethod,
    });

    return transaction;
  },

  async getById(id: string) {
    const transaction = await transactionRepository.findById(id);
    if (!transaction) {
      throw new AppError(404, 'Transaction not found');
    }
    return transaction;
  },

  async getAll(filters: {
    type?: TransactionType;
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page: number;
    limit: number;
    sortBy: 'date' | 'amount' | 'title' | 'createdAt';
    sortOrder: 'asc' | 'desc';
  }) {
    return transactionRepository.findMany(
      {
        type: filters.type,
        categoryId: filters.categoryId,
        startDate: filters.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters.endDate ? new Date(filters.endDate) : undefined,
        search: filters.search,
      },
      {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }
    );
  },

  async update(id: string, data: {
    title?: string;
    amount?: string;
    type?: TransactionType;
    categoryId?: string;
    date?: string;
    description?: string;
    paymentMethod?: PaymentMethod;
  }) {
    await this.getById(id);

    if (data.categoryId) {
      const category = await categoryRepository.findById(data.categoryId);
      if (!category) {
        throw new AppError(404, 'Category not found');
      }
    }

    const updateData: Prisma.TransactionUncheckedUpdateInput = { ...data };
    if (data.amount) {
      const amount = new Decimal(data.amount);
      if (amount.lte(0)) {
        throw new AppError(400, 'Amount must be positive');
      }
      updateData.amount = amount.toFixed(2);
    }
    if (data.date) {
      updateData.date = new Date(data.date);
    }

    return transactionRepository.update(id, updateData);
  },

  async delete(id: string) {
    await this.getById(id);
    return transactionRepository.delete(id);
  },

  async getMonthlySummary(year: number, month: number, timezone: string) {
    return transactionRepository.getMonthlyTotals(year, month, timezone);
  },

  async getCategoryTotals(year: number, month: number, timezone: string) {
    return transactionRepository.getCategoryTotals(year, month, timezone);
  },

  async getYearlyComparison(year: number, timezone: string) {
    return transactionRepository.getYearlyComparison(year, timezone);
  },

  async checkDuplicate(title: string, amount: string, date: string, categoryId: string) {
    const duplicates = await transactionRepository.findDuplicates(
      title,
      new Decimal(amount),
      new Date(date),
      categoryId
    );
    return duplicates.length > 0 ? duplicates[0] : null;
  },
};