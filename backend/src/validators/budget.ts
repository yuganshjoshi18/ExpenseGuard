import { z } from 'zod';

export const createBudgetSchema = z.object({
  categoryId: z.string().cuid('Invalid category ID'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format').refine(
    val => parseFloat(val) > 0,
    'Amount must be positive'
  ),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export const budgetQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetQueryInput = z.infer<typeof budgetQuerySchema>;