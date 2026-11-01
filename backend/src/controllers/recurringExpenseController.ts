import { Request, Response } from 'express';
import { recurringExpenseService } from '../services/recurringExpenseService';
import { asyncHandler } from '../middleware/errorHandler';

export const recurringExpenseController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const recurring = await recurringExpenseService.create(req.body);
    res.status(201).json(recurring);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const recurring = await recurringExpenseService.getById(req.params.id);
    res.json(recurring);
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, isActive } = req.query;
    const isActiveFilter =
      isActive === undefined
        ? undefined
        : (isActive as unknown) === true || isActive === 'true';
    const result = await recurringExpenseService.getAll(
      parseInt(page as string),
      parseInt(limit as string),
      isActiveFilter
    );
    res.json(result);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const recurring = await recurringExpenseService.update(req.params.id, req.body);
    res.json(recurring);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await recurringExpenseService.delete(req.params.id);
    res.status(204).send();
  }),

  executeDue: asyncHandler(async (req: Request, res: Response) => {
    const results = await recurringExpenseService.executeDue();
    res.json(results);
  }),

  getExecutionHistory: asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20 } = req.query;
    const result = await recurringExpenseService.getExecutionHistory(
      req.params.id,
      parseInt(page as string),
      parseInt(limit as string)
    );
    res.json(result);
  }),
};