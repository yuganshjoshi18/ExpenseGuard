import { Router, Request, Response, NextFunction } from 'express';
import { transactionController } from '../controllers/transactionController';
import { categoryController } from '../controllers/categoryController';
import { budgetController } from '../controllers/budgetController';
import { recurringExpenseController } from '../controllers/recurringExpenseController';
import { csvController } from '../controllers/csvController';
import { createTransactionSchema, updateTransactionSchema, transactionQuerySchema } from '../validators/transaction';
import { createCategorySchema, updateCategorySchema } from '../validators/category';
import { createBudgetSchema, updateBudgetSchema, budgetQuerySchema } from '../validators/budget';
import { createRecurringExpenseSchema, updateRecurringExpenseSchema, recurringExpenseQuerySchema } from '../validators/recurringExpense';
import { csvImportOptionsSchema } from '../validators/csvImport';
import { asyncHandler } from '../middleware/errorHandler';
import { z } from 'zod';

const router = Router();

// Validation middleware
const validate = (schema: z.ZodSchema) => asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  req.body = schema.parse(req.body);
  next();
});

const validateQuery = (schema: z.ZodSchema) => asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  req.query = schema.parse(req.query) as Request['query'];
  next();
});

// Transaction routes
router.post('/transactions', validate(createTransactionSchema), transactionController.create);
router.get('/transactions', validateQuery(transactionQuerySchema), transactionController.getAll);
router.get('/transactions/monthly-summary', transactionController.getMonthlySummary);
router.get('/transactions/category-totals', transactionController.getCategoryTotals);
router.get('/transactions/yearly-comparison', transactionController.getYearlyComparison);
router.get('/transactions/check-duplicate', transactionController.checkDuplicate);
router.get('/transactions/:id', transactionController.getById);
router.put('/transactions/:id', validate(updateTransactionSchema), transactionController.update);
router.delete('/transactions/:id', transactionController.delete);

// Category routes
router.post('/categories', validate(createCategorySchema), categoryController.create);
router.get('/categories', categoryController.getAll);
router.get('/categories/default', categoryController.getDefaultCategories);
router.get('/categories/with-count', categoryController.getWithTransactionCount);
router.get('/categories/:id', categoryController.getById);
router.put('/categories/:id', validate(updateCategorySchema), categoryController.update);
router.delete('/categories/:id', categoryController.delete);

// Budget routes
router.post('/budgets', validate(createBudgetSchema), budgetController.create);
router.get('/budgets', validateQuery(budgetQuerySchema), budgetController.getAll);
router.get('/budgets/status', budgetController.getBudgetStatus);
router.get('/budgets/overall-status', budgetController.getOverallBudgetStatus);
router.get('/budgets/:id', budgetController.getById);
router.put('/budgets/upsert', validate(createBudgetSchema), budgetController.upsert);
router.put('/budgets/:id', validate(updateBudgetSchema), budgetController.update);
router.delete('/budgets/:id', budgetController.delete);

// Recurring expense routes
router.post('/recurring-expenses', validate(createRecurringExpenseSchema), recurringExpenseController.create);
router.get('/recurring-expenses', validateQuery(recurringExpenseQuerySchema), recurringExpenseController.getAll);
router.get('/recurring-expenses/:id', recurringExpenseController.getById);
router.put('/recurring-expenses/:id', validate(updateRecurringExpenseSchema), recurringExpenseController.update);
router.delete('/recurring-expenses/:id', recurringExpenseController.delete);
router.post('/recurring-expenses/execute-due', recurringExpenseController.executeDue);
router.get('/recurring-expenses/:id/executions', recurringExpenseController.getExecutionHistory);

// CSV routes
router.post('/csv/import', csvController.uploadMiddleware, asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const options = csvImportOptionsSchema.parse(req.query);
    req.query = options as unknown as Request['query'];
    next();
  } catch (error) {
    next(error);
  }
}), csvController.import);
router.get('/csv/export', csvController.export);
router.get('/csv/template', csvController.downloadTemplate);

export const routes = router;