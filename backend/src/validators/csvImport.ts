import { z } from 'zod';

export const csvImportOptionsSchema = z.object({
  skipDuplicates: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform(value => value === true || value === 'true')
    .default(true),
  dateFormat: z.string().optional(),
});

export type CsvImportOptionsInput = z.infer<typeof csvImportOptionsSchema>;

export const csvTransactionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'OTHER']).optional(),
});

export type CsvTransactionInput = z.infer<typeof csvTransactionSchema>;

export const csvImportResultSchema = z.object({
  total: z.number(),
  valid: z.number(),
  invalid: z.number(),
  duplicates: z.number(),
  imported: z.number(),
  errors: z.array(z.object({
    row: z.number(),
    field: z.string(),
    message: z.string(),
    value: z.string().optional(),
  })),
  transactions: z.array(z.object({
    id: z.string(),
    title: z.string(),
    amount: z.string(),
    type: z.enum(['INCOME', 'EXPENSE']),
    categoryId: z.string(),
    date: z.string(),
    description: z.string().nullable(),
    paymentMethod: z.string().nullable(),
  })),
});

export type CsvImportResult = z.infer<typeof csvImportResultSchema>;