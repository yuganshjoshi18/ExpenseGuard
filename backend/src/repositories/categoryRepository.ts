import { Prisma, Category } from '@prisma/client';
import { prisma } from '../utils/prisma';

export const categoryRepository = {
  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({ data });
  },

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
  },

  async findByName(name: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { name } });
  },

  async findMany(): Promise<Category[]> {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  },

  async findDefaultCategories(): Promise<Category[]> {
    return prisma.category.findMany({
      where: { isDefault: true },
      orderBy: { name: 'asc' },
    });
  },

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return prisma.category.update({ where: { id }, data });
  },

  async delete(id: string): Promise<Category> {
    return prisma.category.delete({ where: { id } });
  },

  async getWithTransactionCount(): Promise<Array<Category & { _count: { transactions: number } }>> {
    return prisma.category.findMany({
      include: { _count: { select: { transactions: true } } },
      orderBy: { name: 'asc' },
    });
  },
};