import { prisma } from '../src/utils/prisma';

// Mock express-rate-limit to avoid Node.js built-in module issues in Jest
jest.mock('express-rate-limit', () => {
  const rateLimit = () => (_req: any, _res: any, next: any) => next();
  return { __esModule: true, rateLimit, default: rateLimit };
});

beforeAll(async () => {
  // Clean up test database before running tests
  await prisma.recurringExecution.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany({ where: { isDefault: false } });
});

afterAll(async () => {
  // Clean up after tests
  await prisma.recurringExecution.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany({ where: { isDefault: false } });
  await prisma.$disconnect();
});