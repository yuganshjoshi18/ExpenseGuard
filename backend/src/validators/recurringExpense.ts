import { z } from 'zod';

// Accept both YYYY-MM-DD and full ISO datetime (YYYY-MM-DDTHH:mm:ss.sssZ)
const dateString = z.string().refine(
  (val) => {
    // Check for YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return true;
    // Check for full ISO datetime
    return !isNaN(Date.parse(val));
  },
  'Invalid date format (use YYYY-MM-DD or ISO datetime)'
);

export const createRecurringExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format').refine(
    val => parseFloat(val) > 0,
    'Amount must be positive'
  ),
  categoryId: z.string().cuid('Invalid category ID'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: dateString,
  endDate: dateString.optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'OTHER']).optional(),
  isActive: z.boolean().optional(),
});

export const updateRecurringExpenseSchema = createRecurringExpenseSchema.partial();

export const recurringExpenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isActive: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform(value => value === true || value === 'true')
    .optional(),
});

export type CreateRecurringExpenseInput = z.infer<typeof createRecurringExpenseSchema>;
export type UpdateRecurringExpenseInput = z.infer<typeof updateRecurringExpenseSchema>;
export type RecurringExpenseQueryInput = z.infer<typeof recurringExpenseQuerySchema>;