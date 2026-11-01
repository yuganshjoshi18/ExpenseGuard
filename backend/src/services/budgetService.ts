import { Decimal } from 'decimal.js';
import { budgetRepository } from '../repositories/budgetRepository';
import { categoryRepository } from '../repositories/categoryRepository';
import { AppError } from '../middleware/errorHandler';

export const budgetService = {
  async create(data: {
    categoryId: string;
    amount: string;
    month: number;
    year: number;
  }) {
    const category = await categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    const existing = await budgetRepository.findByCategoryMonthYear(
      data.categoryId,
      data.month,
      data.year
    );
    if (existing) {
      throw new AppError(409, 'Budget already exists for this category and month');
    }

    const amount = new Decimal(data.amount);
    if (amount.lte(0)) {
      throw new AppError(400, 'Amount must be positive');
    }

    return budgetRepository.create({
      categoryId: data.categoryId,
      amount: amount.toFixed(2),
      month: data.month,
      year: data.year,
    });
  },

  async getById(id: string) {
    const budget = await budgetRepository.findById(id);
    if (!budget) {
      throw new AppError(404, 'Budget not found');
    }
    return budget;
  },

  async getAll(month?: number, year?: number) {
    return budgetRepository.findMany(month, year);
  },

  async getBudgetStatus(month: number, year: number, timezone: string) {
    return budgetRepository.getBudgetStatus(month, year, timezone);
  },

  async getOverallBudgetStatus(month: number, year: number, timezone: string) {
    return budgetRepository.getOverallBudgetStatus(month, year, timezone);
  },

  async update(id: string, data: {
    amount?: string;
  }) {
    await this.getById(id);

    if (data.amount) {
      const amount = new Decimal(data.amount);
      if (amount.lte(0)) {
        throw new AppError(400, 'Amount must be positive');
      }
      data.amount = amount.toFixed(2);
    }

    return budgetRepository.update(id, data);
  },

  async upsert(data: {
    categoryId: string;
    amount: string;
    month: number;
    year: number;
  }) {
    const category = await categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    const amount = new Decimal(data.amount);
    if (amount.lte(0)) {
      throw new AppError(400, 'Amount must be positive');
    }

    return budgetRepository.upsert({
      categoryId: data.categoryId,
      amount: amount.toFixed(2),
      month: data.month,
      year: data.year,
    });
  },

  async delete(id: string) {
    await this.getById(id);
    return budgetRepository.delete(id);
  },
};