import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/utils/prisma';
import { Decimal } from 'decimal.js';

describe('Recurring Expense API', () => {
  let categoryId: string;

  beforeAll(async () => {
    const category = await prisma.category.create({
      data: { name: 'Recurring Test Category', color: '#ff0000', isDefault: false },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await prisma.recurringExecution.deleteMany({ where: { recurringExpense: { categoryId } } });
    await prisma.recurringExpense.deleteMany({ where: { categoryId } });
    await prisma.transaction.deleteMany({ where: { categoryId } });
    await prisma.category.delete({ where: { id: categoryId } });
  });

  beforeEach(async () => {
    await prisma.recurringExecution.deleteMany({ where: { recurringExpense: { categoryId } } });
    await prisma.recurringExpense.deleteMany({ where: { categoryId } });
  });

  describe('POST /api/recurring-expenses', () => {
    it('should create a recurring expense', async () => {
      const response = await request(app)
        .post('/api/recurring-expenses')
        .send({
          title: 'Monthly Rent',
          amount: '1200.00',
          categoryId,
          frequency: 'MONTHLY',
          startDate: '2024-01-01T00:00:00.000Z',
          description: 'Monthly rent payment',
          paymentMethod: 'BANK_TRANSFER',
        })
        .expect(201);

      expect(response.body.title).toBe('Monthly Rent');
      expect(response.body.amount).toBe('1200.00');
      expect(response.body.frequency).toBe('MONTHLY');
      expect(response.body.isActive).toBe(true);
    });
  });

  describe('GET /api/recurring-expenses', () => {
    it('should return paginated recurring expenses', async () => {
      await request(app)
        .post('/api/recurring-expenses')
        .send({ title: 'Expense 1', amount: '100', categoryId, frequency: 'MONTHLY', startDate: '2024-01-01T00:00:00.000Z' })
        .expect(201);

      await request(app)
        .post('/api/recurring-expenses')
        .send({ title: 'Expense 2', amount: '200', categoryId, frequency: 'WEEKLY', startDate: '2024-01-01T00:00:00.000Z' })
        .expect(201);

      const response = await request(app)
        .get('/api/recurring-expenses')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data.length).toBe(2);
      expect(response.body.total).toBe(2);
    });

    it('should filter by isActive', async () => {
      await request(app)
        .post('/api/recurring-expenses')
        .send({ title: 'Active', amount: '100', categoryId, frequency: 'MONTHLY', startDate: '2024-01-01T00:00:00.000Z', isActive: true })
        .expect(201);

      await request(app)
        .post('/api/recurring-expenses')
        .send({ title: 'Inactive', amount: '100', categoryId, frequency: 'MONTHLY', startDate: '2024-01-01T00:00:00.000Z', isActive: false })
        .expect(201);

      const response = await request(app)
        .get('/api/recurring-expenses')
        .query({ isActive: true })
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].isActive).toBe(true);
    });
  });

  describe('POST /api/recurring-expenses/execute-due', () => {
    it('should execute due recurring expenses', async () => {
      const createResponse = await request(app)
        .post('/api/recurring-expenses')
        .send({
          title: 'Due Expense',
          amount: '100.00',
          categoryId,
          frequency: 'DAILY',
          startDate: '2024-01-01T00:00:00.000Z',
        })
        .expect(201);

      // Manually set nextExecutionAt to past
      await prisma.recurringExpense.update({
        where: { id: createResponse.body.id },
        data: { nextExecutionAt: new Date('2024-01-01T00:00:00.000Z') },
      });

      const response = await request(app)
        .post('/api/recurring-expenses/execute-due')
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('SUCCESS');
    });

    it('should not execute the same occurrence twice (idempotency)', async () => {
      const createResponse = await request(app)
        .post('/api/recurring-expenses')
        .send({
          title: 'Idempotent Test',
          amount: '50.00',
          categoryId,
          frequency: 'DAILY',
          startDate: '2024-01-01T00:00:00.000Z',
        })
        .expect(201);

      // Put the next execution slightly in the past; after one run it moves a day ahead.
      await prisma.recurringExpense.update({
        where: { id: createResponse.body.id },
        data: { nextExecutionAt: new Date(Date.now() - 1000) },
      });

      const first = await request(app)
        .post('/api/recurring-expenses/execute-due')
        .expect(200);

      expect(first.body).toHaveLength(1);
      expect(first.body[0].status).toBe('SUCCESS');

      // The occurrence just processed is no longer due, so the second run is a no-op.
      const response = await request(app)
        .post('/api/recurring-expenses/execute-due')
        .expect(200);

      expect(response.body).toHaveLength(0);

      const transactions = await prisma.transaction.count({
        where: { categoryId, title: 'Idempotent Test' },
      });
      expect(transactions).toBe(1);
    });
  });
});