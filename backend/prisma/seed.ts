import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Food', description: 'Food and dining expenses', color: '#ef4444', icon: 'utensils', isDefault: true },
  { name: 'Transportation', description: 'Transport and travel costs', color: '#3b82f6', icon: 'car', isDefault: true },
  { name: 'Shopping', description: 'Shopping and retail purchases', color: '#8b5cf6', icon: 'shopping-bag', isDefault: true },
  { name: 'Entertainment', description: 'Entertainment and leisure', color: '#ec4899', icon: 'film', isDefault: true },
  { name: 'Healthcare', description: 'Medical and healthcare expenses', color: '#10b981', icon: 'heart-pulse', isDefault: true },
  { name: 'Education', description: 'Education and learning', color: '#f59e0b', icon: 'graduation-cap', isDefault: true },
  { name: 'Bills', description: 'Utility bills and subscriptions', color: '#6366f1', icon: 'file-text', isDefault: true },
  { name: 'Rent', description: 'Rent and housing costs', color: '#14b8a6', icon: 'home', isDefault: true },
  { name: 'Travel', description: 'Travel and vacation expenses', color: '#f97316', icon: 'plane', isDefault: true },
  { name: 'Other', description: 'Other miscellaneous expenses', color: '#64748b', icon: 'more-horizontal', isDefault: true },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default categories
  console.log('Creating default categories...');
  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Default categories created');

  // Create some sample transactions for testing
  console.log('Creating sample transactions...');
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map(c => [c.name, c.id]));

  const sampleTransactions = [
    { title: 'Grocery Shopping', amount: new Decimal('120.50'), type: 'EXPENSE', category: 'Food', date: '2024-01-15', description: 'Weekly groceries', paymentMethod: 'CARD' },
    { title: 'Salary', amount: new Decimal('5000.00'), type: 'INCOME', category: 'Other', date: '2024-01-01', description: 'January salary', paymentMethod: 'BANK_TRANSFER' },
    { title: 'Gas Station', amount: new Decimal('45.00'), type: 'EXPENSE', category: 'Transportation', date: '2024-01-10', description: 'Fuel', paymentMethod: 'CARD' },
    { title: 'Netflix Subscription', amount: new Decimal('15.99'), type: 'EXPENSE', category: 'Entertainment', date: '2024-01-05', description: 'Monthly subscription', paymentMethod: 'CARD' },
    { title: 'Doctor Visit', amount: new Decimal('80.00'), type: 'EXPENSE', category: 'Healthcare', date: '2024-01-20', description: 'Checkup', paymentMethod: 'CASH' },
    { title: 'Online Course', amount: new Decimal('99.00'), type: 'EXPENSE', category: 'Education', date: '2024-01-12', description: 'React course', paymentMethod: 'CARD' },
    { title: 'Electricity Bill', amount: new Decimal('150.00'), type: 'EXPENSE', category: 'Bills', date: '2024-01-08', description: 'January bill', paymentMethod: 'BANK_TRANSFER' },
    { title: 'Rent Payment', amount: new Decimal('1200.00'), type: 'EXPENSE', category: 'Rent', date: '2024-01-01', description: 'January rent', paymentMethod: 'BANK_TRANSFER' },
    { title: 'Flight Tickets', amount: new Decimal('350.00'), type: 'EXPENSE', category: 'Travel', date: '2024-01-25', description: 'Vacation flights', paymentMethod: 'CARD' },
    { title: 'Freelance Income', amount: new Decimal('800.00'), type: 'INCOME', category: 'Other', date: '2024-01-18', description: 'Project payment', paymentMethod: 'BANK_TRANSFER' },
  ];

  for (const t of sampleTransactions) {
    await prisma.transaction.create({
      data: {
        title: t.title,
        amount: t.amount.toFixed(2),
        type: t.type as any,
        categoryId: categoryMap.get(t.category)!,
        date: new Date(t.date),
        description: t.description,
        paymentMethod: t.paymentMethod as any,
      },
    });
  }
  console.log('✅ Sample transactions created');

  // Create sample budgets
  console.log('Creating sample budgets...');
  const foodCategory = categoryMap.get('Food')!;
  const transportCategory = categoryMap.get('Transportation')!;

  await prisma.budget.upsert({
    where: { categoryId_month_year: { categoryId: foodCategory, month: 1, year: 2024 } },
    update: {},
    create: { categoryId: foodCategory, amount: new Decimal('500.00').toFixed(2), month: 1, year: 2024 },
  });

  await prisma.budget.upsert({
    where: { categoryId_month_year: { categoryId: transportCategory, month: 1, year: 2024 } },
    update: {},
    create: { categoryId: transportCategory, amount: new Decimal('200.00').toFixed(2), month: 1, year: 2024 },
  });
  console.log('✅ Sample budgets created');

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });