import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/utils/prisma';
import { Decimal } from 'decimal.js';

describe('Budget API', () => {
  let categoryId: string;

  beforeAll(async () => {
    const category = await prisma.category.create({
      data: { name: 'Budget Test Category', color: '#ff0000', isDefault: false },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await prisma.budget.deleteMany({ where: { categoryId } });
    await prisma.transaction.deleteMany({ where: { categoryId } });
    await prisma.category.delete({ where: { id: categoryId } });
  });

  beforeEach(async () => {
    await prisma.budget.deleteMany({ where: { categoryId } });
    await prisma.transaction.deleteMany({ where: { categoryId } });
  });

  describe('POST /api/budgets', () => {
    it('should create a budget', async () => {
      const response = await request(app)
        .post('/api/budgets')
        .send({
          categoryId,
          amount: '500.00',
          month: 1,
          year: 2024,
        })
        .expect(201);

      expect(response.body.categoryId).toBe(categoryId);
      expect(response.body.amount).toBe('500.00');
      expect(response.body.month).toBe(1);
      expect(response.body.year).toBe(2024);
    });

    it('should reject duplicate budget for same category/month/year', async () => {
      await request(app)
        .post('/api/budgets')
        .send({ categoryId, amount: '500', month: 1, year: 2024 })
        .expect(201);

      await request(app)
        .post('/api/budgets')
        .send({ categoryId, amount: '600', month: 1, year: 2024 })
        .expect(409);
    });
  });

  describe('GET /api/budgets/status', () => {
    beforeEach(async () => {
      await prisma.budget.create({
        data: { categoryId, amount: new Decimal('500'), month: 1, year: 2024 },
      });
      await prisma.transaction.createMany({
        data: [
          { title: 'Expense 1', amount: new Decimal('200'), type: 'EXPENSE', categoryId, date: new Date('2024-01-15') },
          { title: 'Expense 2', amount: new Decimal('150'), type: 'EXPENSE', categoryId, date: new Date('2024-01-20') },
        ],
      });
    });

    it('should return budget status with spending', async () => {
      const response = await request(app)
        .get('/api/budgets/status')
        .query({ month: 1, year: 2024 })
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].spent).toBe('350.00');
      expect(response.body[0].remaining).toBe('150.00');
      expect(response.body[0].percentage).toBe(70);
      expect(response.body[0].isWarning).toBe(false);
    });
  });

  describe('GET /api/budgets/overall-status', () => {
    beforeEach(async () => {
      await prisma.budget.create({
        data: { categoryId, amount: new Decimal('1000'), month: 1, year: 2024 },
      });
      await prisma.transaction.createMany({
        data: [
          { title: 'Income', amount: new Decimal('5000'), type: 'INCOME', categoryId, date: new Date('2024-01-01') },
          { title: 'Expense', amount: new Decimal('800'), type: 'EXPENSE', categoryId, date: new Date('2024-01-15') },
        ],
      });
    });

    it('should return overall budget status', async () => {
      const response = await request(app)
        .get('/api/budgets/overall-status')
        .query({ month: 1, year: 2024 })
        .expect(200);

      expect(response.body.totalBudget).toBe('1000.00');
      expect(response.body.totalSpent).toBe('800.00');
      expect(response.body.overallPercentage).toBe(80);
      expect(response.body.isWarning).toBe(true);
    });
  });

  describe('PUT /api/budgets/upsert', () => {
    it('should create or update budget', async () => {
      const response = await request(app)
        .put('/api/budgets/upsert')
        .send({ categoryId, amount: '500', month: 1, year: 2024 })
        .expect(200);

      expect(response.body.amount).toBe('500.00');

      const response2 = await request(app)
        .put('/api/budgets/upsert')
        .send({ categoryId, amount: '600', month: 1, year: 2024 })
        .expect(200);

      expect(response2.body.amount).toBe('600.00');
    });
  });
});