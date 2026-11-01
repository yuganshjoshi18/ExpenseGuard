import { Request, Response } from 'express';
import { budgetService } from '../services/budgetService';
import { asyncHandler } from '../middleware/errorHandler';

export const budgetController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const budget = await budgetService.create(req.body);
    res.status(201).json(budget);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const budget = await budgetService.getById(req.params.id);
    res.json(budget);
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { month, year } = req.query;
    const budgets = await budgetService.getAll(
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined
    );
    res.json(budgets);
  }),

  getBudgetStatus: asyncHandler(async (req: Request, res: Response) => {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }
    const status = await budgetService.getBudgetStatus(
      parseInt(month as string),
      parseInt(year as string),
      'Asia/Kolkata'
    );
    res.json(status);
  }),

  getOverallBudgetStatus: asyncHandler(async (req: Request, res: Response) => {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }
    const status = await budgetService.getOverallBudgetStatus(
      parseInt(month as string),
      parseInt(year as string),
      'Asia/Kolkata'
    );
    res.json(status);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const budget = await budgetService.update(req.params.id, req.body);
    res.json(budget);
  }),

  upsert: asyncHandler(async (req: Request, res: Response) => {
    const budget = await budgetService.upsert(req.body);
    res.json(budget);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await budgetService.delete(req.params.id);
    res.status(204).send();
  }),
};