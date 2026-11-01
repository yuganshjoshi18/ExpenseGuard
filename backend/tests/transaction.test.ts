import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/utils/prisma';
import { Decimal } from 'decimal.js';

describe('Transaction API', () => {
  let categoryId: string;

  beforeAll(async () => {
    const category = await prisma.category.create({
      data: { name: 'Test Category', color: '#ff0000', isDefault: false },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { categoryId } });
    await prisma.category.delete({ where: { id: categoryId } });
  });

  beforeEach(async () => {
    await prisma.transaction.deleteMany({ where: { categoryId } });
  });

  describe('POST /api/transactions', () => {
    it('should create a transaction', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          title: 'Test Transaction',
          amount: '100.50',
          type: 'EXPENSE',
          categoryId,
          date: '2024-01-15T10:00:00.000Z',
          description: 'Test description',
          paymentMethod: 'CARD',
        })
        .expect(201);

      expect(response.body.title).toBe('Test Transaction');
      expect(response.body.amount).toBe('100.50');
      expect(response.body.type).toBe('EXPENSE');
      expect(response.body.categoryId).toBe(categoryId);
    });

    it('should reject invalid amount', async () => {
      await request(app)
        .post('/api/transactions')
        .send({
          title: 'Test',
          amount: '-50',
          type: 'EXPENSE',
          categoryId,
          date: '2024-01-15T10:00:00.000Z',
        })
        .expect(400);
    });

    it('should reject a category that does not exist', async () => {
      await request(app)
        .post('/api/transactions')
        .send({
          title: 'Test',
          amount: '100',
          type: 'EXPENSE',
          categoryId: 'clh3am9qg0000qzrmn831i7rn',
          date: '2024-01-15T10:00:00.000Z',
        })
        .expect(404);
    });
  });

  describe('GET /api/transactions', () => {
    beforeEach(async () => {
      await prisma.transaction.createMany({
        data: [
          { title: 'Transaction 1', amount: new Decimal('100'), type: 'EXPENSE', categoryId, date: new Date('2024-01-15') },
          { title: 'Transaction 2', amount: new Decimal('200'), type: 'INCOME', categoryId, date: new Date('2024-01-16') },
          { title: 'Transaction 3', amount: new Decimal('50'), type: 'EXPENSE', categoryId, date: new Date('2024-01-17') },
        ],
      });
    });

    it('should return paginated transactions', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.total).toBe(3);
      expect(response.body.page).toBe(1);
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ type: 'EXPENSE' })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((t: any) => t.type === 'EXPENSE')).toBe(true);
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ startDate: '2024-01-16T00:00:00.000Z', endDate: '2024-01-16T23:59:59.999Z' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Transaction 2');
    });

    it('should search transactions', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ search: 'Transaction 1' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Transaction 1');
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should return a transaction by id', async () => {
      const transaction = await prisma.transaction.create({
        data: { title: 'Test', amount: new Decimal('100'), type: 'EXPENSE', categoryId, date: new Date('2024-01-15') },
      });

      const response = await request(app)
        .get(`/api/transactions/${transaction.id}`)
        .expect(200);

      expect(response.body.id).toBe(transaction.id);
    });

    it('should return 404 for non-existent transaction', async () => {
      await request(app)
        .get('/api/transactions/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    it('should update a transaction', async () => {
      const transaction = await prisma.transaction.create({
        data: { title: 'Original', amount: new Decimal('100'), type: 'EXPENSE', categoryId, date: new Date('2024-01-15') },
      });

      const response = await request(app)
        .put(`/api/transactions/${transaction.id}`)
        .send({ title: 'Updated', amount: '150.00' })
        .expect(200);

      expect(response.body.title).toBe('Updated');
      expect(response.body.amount).toBe('150.00');
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete a transaction', async () => {
      const transaction = await prisma.transaction.create({
        data: { title: 'To Delete', amount: new Decimal('100'), type: 'EXPENSE', categoryId, date: new Date('2024-01-15') },
      });

      await request(app)
        .delete(`/api/transactions/${transaction.id}`)
        .expect(204);

      const found = await prisma.transaction.findUnique({ where: { id: transaction.id } });
      expect(found).toBeNull();
    });
  });

  describe('Monthly Summary', () => {
    beforeEach(async () => {
      await prisma.transaction.createMany({
        data: [
          { title: 'Income 1', amount: new Decimal('5000'), type: 'INCOME', categoryId, date: new Date('2024-01-01') },
          { title: 'Expense 1', amount: new Decimal('100'), type: 'EXPENSE', categoryId, date: new Date('2024-01-15') },
          { title: 'Expense 2', amount: new Decimal('200'), type: 'EXPENSE', categoryId, date: new Date('2024-01-20') },
        ],
      });
    });

    it('should return correct monthly summary', async () => {
      const response = await request(app)
        .get('/api/transactions/monthly-summary')
        .query({ year: 2024, month: 1 })
        .expect(200);

      expect(response.body.income).toBe('5000.00');
      expect(response.body.expense).toBe('300.00');
      expect(response.body.balance).toBe('4700.00');
    });
  });
});