import { categoryRepository } from '../repositories/categoryRepository';
import { AppError } from '../middleware/errorHandler';

export const categoryService = {
  async create(data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }) {
    const existing = await categoryRepository.findByName(data.name);
    if (existing) {
      throw new AppError(409, 'Category with this name already exists');
    }

    return categoryRepository.create({
      name: data.name,
      description: data.description,
      color: data.color || '#6366f1',
      icon: data.icon,
      isDefault: false,
    });
  },

  async getById(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new AppError(404, 'Category not found');
    }
    return category;
  },

  async getAll() {
    return categoryRepository.findMany();
  },

  async getDefaultCategories() {
    return categoryRepository.findDefaultCategories();
  },

  async getWithTransactionCount() {
    return categoryRepository.getWithTransactionCount();
  },

  async update(id: string, data: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
  }) {
    await this.getById(id);

    if (data.name) {
      const existing = await categoryRepository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new AppError(409, 'Category with this name already exists');
      }
    }

    return categoryRepository.update(id, data);
  },

  async delete(id: string) {
    const category = await this.getById(id);
    if (category.isDefault) {
      throw new AppError(400, 'Cannot delete default category');
    }
    return categoryRepository.delete(id);
  },
};