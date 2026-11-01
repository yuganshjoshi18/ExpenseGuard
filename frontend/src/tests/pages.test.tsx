import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { Transactions } from '../pages/Transactions';
import { Categories } from '../pages/Categories';
import { Budgets } from '../pages/Budgets';
import { RecurringExpenses } from '../pages/RecurringExpenses';
import { Reports } from '../pages/Reports';
import { ImportExport } from '../pages/ImportExport';
import { Settings } from '../pages/Settings';

// Mock API
jest.mock('../services/api', () => ({
  transactionApi: {
    getAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    getMonthlySummary: jest.fn().mockResolvedValue({ income: '5000', expense: '1200', balance: '3800' }),
    getCategoryTotals: jest.fn().mockResolvedValue([]),
    getYearlyComparison: jest.fn().mockResolvedValue([]),
  },
  categoryApi: {
    getAll: jest.fn().mockResolvedValue([]),
    getDefault: jest.fn().mockResolvedValue([]),
    getWithCount: jest.fn().mockResolvedValue([]),
  },
  budgetApi: {
    getAll: jest.fn().mockResolvedValue([]),
    getStatus: jest.fn().mockResolvedValue([]),
    getOverallStatus: jest.fn().mockResolvedValue({
      totalBudget: '1000', totalSpent: '800', totalRemaining: '200',
      overallPercentage: 80, isWarning: true, isCritical: false
    }),
  },
  recurringExpenseApi: {
    getAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 }),
  },
  csvApi: {
    import: jest.fn().mockResolvedValue({ total: 0, valid: 0, invalid: 0, duplicates: 0, imported: 0, errors: [], transactions: [] }),
    export: jest.fn().mockResolvedValue(new Blob()),
    downloadTemplate: jest.fn().mockResolvedValue(new Blob()),
  },
}));

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Dashboard', () => {
  test('renders dashboard title', async () => {
    renderWithRouter(<Dashboard />);
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    renderWithRouter(<Dashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('Transactions', () => {
  test('renders transactions page', async () => {
    renderWithRouter(<Transactions />);
    expect(await screen.findByText('Transactions')).toBeInTheDocument();
  });

  test('shows add transaction button', async () => {
    renderWithRouter(<Transactions />);
    expect(await screen.findByRole('button', { name: /add transaction/i })).toBeInTheDocument();
  });

  test('renders filter inputs', async () => {
    renderWithRouter(<Transactions />);
    expect(await screen.findByPlaceholderText(/search transactions/i)).toBeInTheDocument();
  });
});

describe('Categories', () => {
  test('renders categories page', async () => {
    renderWithRouter(<Categories />);
    expect(await screen.findByText('Categories')).toBeInTheDocument();
  });

  test('shows add category button', async () => {
    renderWithRouter(<Categories />);
    expect(await screen.findByRole('button', { name: /add category/i })).toBeInTheDocument();
  });
});

describe('Budgets', () => {
  test('renders budgets page', async () => {
    renderWithRouter(<Budgets />);
    expect(await screen.findByText('Budgets')).toBeInTheDocument();
  });

  test('shows month/year selectors', async () => {
    renderWithRouter(<Budgets />);
    expect((await screen.findAllByRole('combobox')).length).toBeGreaterThan(0);
  });

  test('shows add budget button', async () => {
    renderWithRouter(<Budgets />);
    expect(await screen.findByRole('button', { name: /add budget/i })).toBeInTheDocument();
  });
});

describe('RecurringExpenses', () => {
  test('renders recurring expenses page', async () => {
    renderWithRouter(<RecurringExpenses />);
    expect(await screen.findByText('Recurring Expenses')).toBeInTheDocument();
  });

  test('shows execute due button', async () => {
    renderWithRouter(<RecurringExpenses />);
    expect(await screen.findByRole('button', { name: /execute due/i })).toBeInTheDocument();
  });
});

describe('Reports', () => {
  test('renders reports page', async () => {
    renderWithRouter(<Reports />);
    expect(await screen.findByText('Reports')).toBeInTheDocument();
  });

  test('shows period selectors', async () => {
    renderWithRouter(<Reports />);
    expect((await screen.findAllByRole('combobox')).length).toBeGreaterThan(0);
  });
});

describe('ImportExport', () => {
  test('renders import/export page', () => {
    renderWithRouter(<ImportExport />);
    expect(screen.getByText('Import / Export')).toBeInTheDocument();
  });

  test('shows file input for import', () => {
    renderWithRouter(<ImportExport />);
    expect(screen.getByLabelText(/select csv file/i)).toBeInTheDocument();
  });

  test('shows export button', () => {
    renderWithRouter(<ImportExport />);
    expect(screen.getByRole('button', { name: /export all transactions/i })).toBeInTheDocument();
  });

  test('shows download template button', () => {
    renderWithRouter(<ImportExport />);
    expect(screen.getByRole('button', { name: /download template/i })).toBeInTheDocument();
  });
});

describe('Settings', () => {
  test('renders settings page', () => {
    renderWithRouter(<Settings />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('shows tabs', () => {
    renderWithRouter(<Settings />);
    expect(screen.getByRole('tab', { name: /appearance/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /data & privacy/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /advanced/i })).toBeInTheDocument();
  });

  test('shows save button', () => {
    renderWithRouter(<Settings />);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });
});
