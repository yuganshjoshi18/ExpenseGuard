import { Decimal } from 'decimal.js';
import { recurringExpenseRepository } from '../repositories/recurringExpenseRepository';
import { categoryRepository } from '../repositories/categoryRepository';
import { transactionService } from './transactionService';
import { AppError } from '../middleware/errorHandler';
import { Prisma, RecurrenceFrequency, ExecutionStatus, PaymentMethod } from '@prisma/client';

export const recurringExpenseService = {
  async create(data: {
    title: string;
    amount: string;
    categoryId: string;
    frequency: RecurrenceFrequency;
    startDate: string;
    endDate?: string;
    description?: string;
    paymentMethod?: PaymentMethod;
    isActive?: boolean;
  }) {
    const category = await categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    const amount = new Decimal(data.amount);
    if (amount.lte(0)) {
      throw new AppError(400, 'Amount must be positive');
    }

    const startDate = new Date(data.startDate);
    const nextExecutionAt = recurringExpenseRepository.calculateNextExecution(
      data.frequency,
      startDate
    );

    return recurringExpenseRepository.create({
      title: data.title,
      amount: amount.toFixed(2),
      category: { connect: { id: data.categoryId } },
      frequency: data.frequency,
      startDate,
      endDate: data.endDate ? new Date(data.endDate) : null,
      nextExecutionAt,
      description: data.description,
      paymentMethod: data.paymentMethod,
      isActive: data.isActive,
    });
  },

  async getById(id: string) {
    const recurring = await recurringExpenseRepository.findById(id);
    if (!recurring) {
      throw new AppError(404, 'Recurring expense not found');
    }
    return recurring;
  },

  async getAll(page: number, limit: number, isActive?: boolean) {
    return recurringExpenseRepository.findMany(page, limit, isActive);
  },

  async update(id: string, data: {
    title?: string;
    amount?: string;
    categoryId?: string;
    frequency?: RecurrenceFrequency;
    startDate?: string;
    endDate?: string;
    description?: string;
    paymentMethod?: PaymentMethod;
    isActive?: boolean;
  }) {
    const recurring = await this.getById(id);

    if (data.categoryId) {
      const category = await categoryRepository.findById(data.categoryId);
      if (!category) {
        throw new AppError(404, 'Category not found');
      }
    }

    const updateData: Prisma.RecurringExpenseUncheckedUpdateInput = { ...data };
    if (data.amount) {
      const amount = new Decimal(data.amount);
      if (amount.lte(0)) {
        throw new AppError(400, 'Amount must be positive');
      }
      updateData.amount = amount.toFixed(2);
    }
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }

    // Recalculate next execution if frequency or start date changed
    if (data.frequency || data.startDate) {
      const frequency = data.frequency || recurring.frequency;
      const startDate = data.startDate ? new Date(data.startDate) : recurring.startDate;
      updateData.nextExecutionAt = recurringExpenseRepository.calculateNextExecution(frequency, startDate);
    }

    return recurringExpenseRepository.update(id, updateData);
  },

  async delete(id: string) {
    await this.getById(id);
    return recurringExpenseRepository.delete(id);
  },

  async executeDue() {
    const now = new Date();
    const dueExpenses = await recurringExpenseRepository.findDueExecutions(now);
    const results = [];

    for (const expense of dueExpenses) {
      try {
        // Check if already executed for this period (idempotency)
        const existingExecution = await recurringExpenseRepository.findExecutionByTransactionId(
          `${expense.id}-${expense.nextExecutionAt.toISOString()}`
        );
        if (existingExecution) {
          results.push({ id: expense.id, status: 'SKIPPED', reason: 'Already executed' });
          continue;
        }

        // Create transaction
        const transaction = await transactionService.create({
          title: expense.title,
          amount: expense.amount.toString(),
          type: 'EXPENSE',
          categoryId: expense.categoryId,
          date: expense.nextExecutionAt.toISOString(),
          description: expense.description || undefined,
          paymentMethod: expense.paymentMethod || undefined,
        });

        // Record execution
        await recurringExpenseRepository.createExecution(
          expense.id,
          transaction.id,
          ExecutionStatus.SUCCESS
        );

        // Calculate next execution
        const nextExecutionAt = recurringExpenseRepository.calculateNextExecution(
          expense.frequency,
          expense.nextExecutionAt
        );

        // Check if next execution is past end date
        const shouldDeactivate = expense.endDate && nextExecutionAt > expense.endDate;

        const updateData: Prisma.RecurringExpenseUncheckedUpdateInput = {
          isActive: !shouldDeactivate,
        };
        if (!shouldDeactivate) {
          updateData.nextExecutionAt = nextExecutionAt;
        }

        await recurringExpenseRepository.update(expense.id, updateData);

        results.push({ id: expense.id, status: 'SUCCESS', transactionId: transaction.id });
      } catch (error) {
        await recurringExpenseRepository.createExecution(
          expense.id,
          null,
          ExecutionStatus.FAILED,
          error instanceof Error ? error.message : 'Unknown error'
        );
        results.push({ id: expense.id, status: 'FAILED', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return results;
  },

  async getExecutionHistory(id: string, page: number, limit: number) {
    await this.getById(id);
    return recurringExpenseRepository.getExecutionHistory(id, page, limit);
  },
};