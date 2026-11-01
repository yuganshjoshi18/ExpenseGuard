import { Prisma, Budget } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { Decimal } from 'decimal.js';
import { transactionRepository } from './transactionRepository';

export const budgetRepository = {
  async create(data: Prisma.BudgetUncheckedCreateInput): Promise<Budget> {
    return prisma.budget.create({ data });
  },

  async findById(id: string): Promise<Budget | null> {
    return prisma.budget.findUnique({ where: { id } });
  },

  async findByCategoryMonthYear(categoryId: string, month: number, year: number): Promise<Budget | null> {
    return prisma.budget.findUnique({
      where: {
        categoryId_month_year: { categoryId, month, year },
      },
    });
  },

  async findMany(month?: number, year?: number): Promise<Budget[]> {
    const where: Prisma.BudgetWhereInput = {};
    if (month && year) {
      where.month = month;
      where.year = year;
    }
    return prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  },

  async update(id: string, data: Prisma.BudgetUpdateInput): Promise<Budget> {
    return prisma.budget.update({ where: { id }, data });
  },

  async delete(id: string): Promise<Budget> {
    return prisma.budget.delete({ where: { id } });
  },

  async upsert(data: Prisma.BudgetUncheckedCreateInput): Promise<Budget> {
    const { categoryId, month, year, amount } = data;
    return prisma.budget.upsert({
      where: { categoryId_month_year: { categoryId, month, year } },
      create: data,
      update: { amount },
    });
  },

  async getBudgetStatus(month: number, year: number, timezone: string): Promise<Array<{
    budget: Budget;
    spent: Decimal;
    remaining: Decimal;
    percentage: number;
    isWarning: boolean;
    isCritical: boolean;
  }>> {
    const budgets = await this.findMany(month, year);
    const categoryTotals = await transactionRepository.getCategoryTotals(year, month, timezone);

    const expenseTotals = new Map<string, Decimal>();
    for (const ct of categoryTotals) {
      if (ct.type === 'EXPENSE') {
        expenseTotals.set(ct.categoryId, ct.amount);
      }
    }

    return budgets.map(budget => {
      const spent = expenseTotals.get(budget.categoryId) || new Decimal(0);
      const budgetAmount = new Decimal(budget.amount.toString());
      const remaining = budgetAmount.minus(spent);
      const percentage = budgetAmount.gt(0) ? spent.div(budgetAmount).mul(100).toNumber() : 0;

      return {
        budget,
        spent,
        remaining,
        percentage: Math.round(percentage * 100) / 100,
        isWarning: percentage >= 80 && percentage < 100,
        isCritical: percentage >= 100,
      };
    });
  },

  async getOverallBudgetStatus(month: number, year: number, timezone: string): Promise<{
    totalBudget: Decimal;
    totalSpent: Decimal;
    totalRemaining: Decimal;
    overallPercentage: number;
    isWarning: boolean;
    isCritical: boolean;
  }> {
    const budgets = await this.findMany(month, year);
    const totals = await transactionRepository.getMonthlyTotals(year, month, timezone);

    const totalBudget = budgets.reduce((sum, b) => sum.plus(new Decimal(b.amount.toString())), new Decimal(0));
    const totalSpent = totals.expense;
    const totalRemaining = totalBudget.minus(totalSpent);
    const overallPercentage = totalBudget.gt(0) ? totalSpent.div(totalBudget).mul(100).toNumber() : 0;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallPercentage: Math.round(overallPercentage * 100) / 100,
      isWarning: overallPercentage >= 80 && overallPercentage < 100,
      isCritical: overallPercentage >= 100,
    };
  },
};