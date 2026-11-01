import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/utils/prisma';

describe('Category API', () => {
  afterAll(async () => {
    await prisma.category.deleteMany({ where: { isDefault: false } });
  });

  beforeEach(async () => {
    await prisma.category.deleteMany({ where: { isDefault: false } });
  });

  describe('POST /api/categories', () => {
    it('should create a category', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({
          name: 'Test Category',
          description: 'Test description',
          color: '#ff0000',
          icon: 'test-icon',
        })
        .expect(201);

      expect(response.body.name).toBe('Test Category');
      expect(response.body.color).toBe('#ff0000');
      expect(response.body.isDefault).toBe(false);
    });

    it('should reject duplicate category name', async () => {
      await request(app)
        .post('/api/categories')
        .send({ name: 'Duplicate', color: '#ff0000' })
        .expect(201);

      await request(app)
        .post('/api/categories')
        .send({ name: 'Duplicate', color: '#00ff00' })
        .expect(409);
    });

    it('should reject invalid color format', async () => {
      await request(app)
        .post('/api/categories')
        .send({ name: 'Test', color: 'invalid-color' })
        .expect(400);
    });
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      await request(app)
        .post('/api/categories')
        .send({ name: 'Category 1', color: '#ff0000' })
        .expect(201);

      await request(app)
        .post('/api/categories')
        .send({ name: 'Category 2', color: '#00ff00' })
        .expect(201);

      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/categories/default', () => {
    it('should return default categories', async () => {
      const response = await request(app)
        .get('/api/categories/default')
        .expect(200);

      expect(response.body.length).toBe(10);
      expect(response.body.every((c: any) => c.isDefault === true)).toBe(true);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update a category', async () => {
      const createResponse = await request(app)
        .post('/api/categories')
        .send({ name: 'Original', color: '#ff0000' })
        .expect(201);

      const response = await request(app)
        .put(`/api/categories/${createResponse.body.id}`)
        .send({ name: 'Updated', color: '#00ff00' })
        .expect(200);

      expect(response.body.name).toBe('Updated');
      expect(response.body.color).toBe('#00ff00');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete a custom category', async () => {
      const createResponse = await request(app)
        .post('/api/categories')
        .send({ name: 'To Delete', color: '#ff0000' })
        .expect(201);

      await request(app)
        .delete(`/api/categories/${createResponse.body.id}`)
        .expect(204);

      const found = await prisma.category.findUnique({ where: { id: createResponse.body.id } });
      expect(found).toBeNull();
    });

    it('should reject deleting default category', async () => {
      const defaultCategory = await prisma.category.findFirst({ where: { isDefault: true } });

      await request(app)
        .delete(`/api/categories/${defaultCategory!.id}`)
        .expect(400);
    });
  });
});