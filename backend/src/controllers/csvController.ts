import { Request, Response } from 'express';
import { csvService } from '../services/csvService';
import { asyncHandler } from '../middleware/errorHandler';
import multer from 'multer';

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

export const csvController = {
  uploadMiddleware: upload.single('file'),

  import: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { skipDuplicates } = req.query;
    const shouldSkipDuplicates =
      skipDuplicates === undefined
        ? true
        : (skipDuplicates as unknown) === true || skipDuplicates === 'true';
    const csvContent = req.file.buffer.toString('utf-8');

    const result = await csvService.import(csvContent, {
      skipDuplicates: shouldSkipDuplicates,
    });

    res.json(result);
  }),

  export: asyncHandler(async (req: Request, res: Response) => {
    const csvContent = await csvService.export();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions_export.csv"');
    res.send(csvContent);
  }),

  downloadTemplate: asyncHandler(async (_req: Request, res: Response) => {
    const template = 'title,amount,type,category,date,description,paymentMethod\n' +
      'Groceries,50.00,EXPENSE,Food,2024-01-15,Weekly groceries,CARD\n' +
      'Salary,5000.00,INCOME,Other,2024-01-01,Monthly salary,BANK_TRANSFER\n';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="import_template.csv"');
    res.send(template);
  }),
};