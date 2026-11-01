import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/utils/prisma';
import { Decimal } from 'decimal.js';

describe('CSV Import/Export API', () => {
  let categoryId: string;

  beforeAll(async () => {
    const category = await prisma.category.create({
      data: { name: 'CSV Test Category', color: '#ff0000', isDefault: false },
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

  describe('POST /api/csv/import', () => {
    it('should import valid CSV transactions', async () => {
      const csvContent = `title,amount,type,category,date,description,paymentMethod
Groceries,100.00,EXPENSE,CSV Test Category,2024-01-15,Weekly groceries,CARD
Salary,5000.00,INCOME,CSV Test Category,2024-01-01,Monthly salary,BANK_TRANSFER`;

      const response = await request(app)
        .post('/api/csv/import')
        .attach('file', Buffer.from(csvContent), 'test.csv')
        .expect(200);

      expect(response.body.imported).toBe(2);
      expect(response.body.total).toBe(2);
      expect(response.body.errors).toHaveLength(0);
    });

    it('should detect and skip duplicates', async () => {
      const csvContent = `title,amount,type,category,date,description,paymentMethod
Groceries,100.00,EXPENSE,CSV Test Category,2024-01-15,Weekly groceries,CARD`;

      await request(app)
        .post('/api/csv/import')
        .attach('file', Buffer.from(csvContent), 'test.csv')
        .expect(200);

      const response = await request(app)
        .post('/api/csv/import')
        .attach('file', Buffer.from(csvContent), 'test.csv')
        .query({ skipDuplicates: 'true' })
        .expect(200);

      expect(response.body.duplicates).toBe(1);
      expect(response.body.imported).toBe(0);
    });

    it('should report invalid rows', async () => {
      const csvContent = `title,amount,type,category,date,description,paymentMethod
,100.00,EXPENSE,CSV Test Category,2024-01-15,,CARD
Valid,50.00,EXPENSE,CSV Test Category,2024-01-16,,CARD`;

      const response = await request(app)
        .post('/api/csv/import')
        .attach('file', Buffer.from(csvContent), 'test.csv')
        .expect(200);

      expect(response.body.invalid).toBe(1);
      expect(response.body.imported).toBe(1);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should support multiple date formats', async () => {
      const csvContent = `title,amount,type,category,date,description,paymentMethod
Format1,100.00,EXPENSE,CSV Test Category,2024-01-15,,CARD
Format2,200.00,EXPENSE,CSV Test Category,15/01/2024,,CARD
Format3,300.00,EXPENSE,CSV Test Category,01/15/2024,,CARD`;

      const response = await request(app)
        .post('/api/csv/import')
        .attach('file', Buffer.from(csvContent), 'test.csv')
        .expect(200);

      expect(response.body.imported).toBe(3);
    });
  });

  describe('GET /api/csv/export', () => {
    beforeEach(async () => {
      await prisma.transaction.createMany({
        data: [
          { title: 'Export 1', amount: new Decimal('100'), type: 'EXPENSE', categoryId, date: new Date('2024-01-15') },
          { title: 'Export 2', amount: new Decimal('200'), type: 'INCOME', categoryId, date: new Date('2024-01-16') },
        ],
      });
    });

    it('should export transactions as CSV', async () => {
      const response = await request(app)
        .get('/api/csv/export')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('Export 1');
      expect(response.text).toContain('Export 2');
    });
  });

  describe('CSV Round-trip', () => {
    it('should preserve data through import/export cycle', async () => {
      const originalCsv = `title,amount,type,category,date,description,paymentMethod
Round Trip Test,123.45,EXPENSE,CSV Test Category,2024-06-15,Test description,CARD`;

      await request(app)
        .post('/api/csv/import')
        .attach('file', Buffer.from(originalCsv), 'test.csv')
        .expect(200);

      const exportResponse = await request(app)
        .get('/api/csv/export')
        .expect(200);

      // Parse exported CSV and verify data
      const lines = exportResponse.text.trim().split('\n');
      expect(lines.length).toBeGreaterThan(1);

      const headers = lines[0].split(',');
      const dataLine = lines.find(l => l.includes('Round Trip Test'));
      expect(dataLine).toBeDefined();

      const data = dataLine!.split(',');
      expect(data[headers.indexOf('title')]).toBe('Round Trip Test');
      expect(data[headers.indexOf('amount')]).toBe('123.45');
      expect(data[headers.indexOf('type')]).toBe('EXPENSE');
    });
  });
});