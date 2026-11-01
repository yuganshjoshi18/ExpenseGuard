import { Request, Response } from 'express';
import { transactionService } from '../services/transactionService';
import { asyncHandler } from '../middleware/errorHandler';
import { transactionQuerySchema } from '../validators/transaction';

export const transactionController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const transaction = await transactionService.create(req.body);
    res.status(201).json(transaction);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const transaction = await transactionService.getById(req.params.id);
    res.json(transaction);
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const query = transactionQuerySchema.parse(req.query);
    const result = await transactionService.getAll(query);
    res.json(result);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const transaction = await transactionService.update(req.params.id, req.body);
    res.json(transaction);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await transactionService.delete(req.params.id);
    res.status(204).send();
  }),

  getMonthlySummary: asyncHandler(async (req: Request, res: Response) => {
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }
    const summary = await transactionService.getMonthlySummary(
      parseInt(year as string),
      parseInt(month as string),
      'Asia/Kolkata'
    );
    res.json(summary);
  }),

  getCategoryTotals: asyncHandler(async (req: Request, res: Response) => {
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }
    const totals = await transactionService.getCategoryTotals(
      parseInt(year as string),
      parseInt(month as string),
      'Asia/Kolkata'
    );
    res.json(totals);
  }),

  getYearlyComparison: asyncHandler(async (req: Request, res: Response) => {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }
    const comparison = await transactionService.getYearlyComparison(
      parseInt(year as string),
      'Asia/Kolkata'
    );
    res.json(comparison);
  }),

  checkDuplicate: asyncHandler(async (req: Request, res: Response) => {
    const { title, amount, date, categoryId } = req.query;
    if (!title || !amount || !date || !categoryId) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const duplicate = await transactionService.checkDuplicate(
      title as string,
      amount as string,
      date as string,
      categoryId as string
    );
    res.json({ duplicate });
  }),
};