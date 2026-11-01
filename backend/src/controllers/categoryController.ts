import { Request, Response } from 'express';
import { categoryService } from '../services/categoryService';
import { asyncHandler } from '../middleware/errorHandler';

export const categoryController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.create(req.body);
    res.status(201).json(category);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.getById(req.params.id);
    res.json(category);
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const categories = await categoryService.getAll();
    res.json(categories);
  }),

  getDefaultCategories: asyncHandler(async (req: Request, res: Response) => {
    const categories = await categoryService.getDefaultCategories();
    res.json(categories);
  }),

  getWithTransactionCount: asyncHandler(async (req: Request, res: Response) => {
    const categories = await categoryService.getWithTransactionCount();
    res.json(categories);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.update(req.params.id, req.body);
    res.json(category);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await categoryService.delete(req.params.id);
    res.status(204).send();
  }),
};