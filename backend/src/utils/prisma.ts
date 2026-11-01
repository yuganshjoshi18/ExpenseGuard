import { Prisma, PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

// Serialize monetary Decimal values with a stable two-decimal representation.
// Prisma's Decimal and decimal.js expose different prototypes, so patch both.
for (const prototype of [Prisma.Decimal.prototype, Decimal.prototype]) {
  Object.defineProperty(prototype, 'toJSON', {
    value(this: { toFixed: (dp: number) => string }) {
      return this.toFixed(2);
    },
    configurable: true,
    writable: true,
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;