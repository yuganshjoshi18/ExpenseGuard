import { Prisma, RecurringExpense, RecurrenceFrequency, ExecutionStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';

export const recurringExpenseRepository = {
  async create(data: Prisma.RecurringExpenseCreateInput): Promise<RecurringExpense> {
    return prisma.recurringExpense.create({ data });
  },

  async findById(id: string): Promise<RecurringExpense | null> {
    return prisma.recurringExpense.findUnique({
      where: { id },
      include: { category: true },
    });
  },

  async findMany(
    page: number,
    limit: number,
    isActive?: boolean
  ): Promise<{
    data: RecurringExpense[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: Prisma.RecurringExpenseWhereInput = {};
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      prisma.recurringExpense.findMany({
        where,
        include: { category: true },
        orderBy: { nextExecutionAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recurringExpense.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findDueExecutions(now: Date): Promise<RecurringExpense[]> {
    return prisma.recurringExpense.findMany({
      where: {
        isActive: true,
        nextExecutionAt: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      include: { category: true },
    });
  },

  async update(id: string, data: Prisma.RecurringExpenseUncheckedUpdateInput): Promise<RecurringExpense> {
    return prisma.recurringExpense.update({ where: { id }, data });
  },

  async updateNextExecution(id: string, nextExecutionAt: Date): Promise<RecurringExpense> {
    return prisma.recurringExpense.update({
      where: { id },
      data: { nextExecutionAt },
    });
  },

  async delete(id: string): Promise<RecurringExpense> {
    return prisma.recurringExpense.delete({ where: { id } });
  },

  async createExecution(
    recurringExpenseId: string,
    transactionId: string | null,
    status: ExecutionStatus,
    errorMessage?: string
  ) {
    return prisma.recurringExecution.create({
      data: {
        recurringExpenseId,
        transactionId,
        status,
        errorMessage,
      },
    });
  },

  async findExecutionByTransactionId(transactionId: string) {
    return prisma.recurringExecution.findUnique({
      where: { transactionId },
    });
  },

  async getExecutionHistory(
    recurringExpenseId: string,
    page: number,
    limit: number
  ) {
    const [executions, total] = await Promise.all([
      prisma.recurringExecution.findMany({
        where: { recurringExpenseId },
        orderBy: { executedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recurringExecution.count({ where: { recurringExpenseId } }),
    ]);

    // Fetch related transactions separately since there's no Prisma relation defined
    const transactionIds = executions
      .filter(e => e.transactionId)
      .map(e => e.transactionId!);

    const transactions = transactionIds.length > 0
      ? await prisma.transaction.findMany({
          where: { id: { in: transactionIds } },
        })
      : [];

    const transactionMap = new Map(transactions.map(t => [t.id, t]));

    const data = executions.map(execution => ({
      ...execution,
      transaction: execution.transactionId ? transactionMap.get(execution.transactionId) || null : null,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  calculateNextExecution(frequency: RecurrenceFrequency, fromDate: Date): Date {
    const next = new Date(fromDate);
    switch (frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  },
};