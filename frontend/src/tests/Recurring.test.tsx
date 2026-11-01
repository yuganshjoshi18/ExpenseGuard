import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { RecurringExpenses } from '../pages/RecurringExpenses';
import { recurringExpenseApi, categoryApi, type Category, type RecurringExpense } from '../services/api';

jest.mock('../services/api', () => ({
  recurringExpenseApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    executeDue: jest.fn(),
  },
  categoryApi: {
    getAll: jest.fn(),
  },
}));

const mockedRecurringApi = recurringExpenseApi as jest.Mocked<typeof recurringExpenseApi>;
const mockedCategoryApi = categoryApi as jest.Mocked<typeof categoryApi>;

const baseCategory: Omit<Category, 'id' | 'name' | 'color'> = {
  isDefault: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const categories: Category[] = [
  { ...baseCategory, id: '1', name: 'Food', color: '#ef4444' },
  { ...baseCategory, id: '2', name: 'Rent', color: '#3b82f6' },
  { ...baseCategory, id: '3', name: 'Salary', color: '#22c55e' },
];

const rent: RecurringExpense = {
  id: '1',
  title: 'Monthly Rent',
  amount: '1200.00',
  categoryId: '2',
  category: categories[1],
  frequency: 'MONTHLY',
  startDate: '2024-01-01T00:00:00.000Z',
  nextExecutionAt: '2024-02-01T12:00:00.000Z',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const netflix: RecurringExpense = {
  id: '2',
  title: 'Netflix',
  amount: '15.99',
  categoryId: '1',
  category: categories[0],
  frequency: 'MONTHLY',
  startDate: '2024-01-05T00:00:00.000Z',
  endDate: '2024-12-31T00:00:00.000Z',
  nextExecutionAt: '2024-02-05T12:00:00.000Z',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const paginated = {
  data: [rent, netflix],
  total: 2,
  page: 1,
  limit: 10,
  totalPages: 1,
};

const openCreateForm = () => {
  fireEvent.click(screen.getByRole('button', { name: /add recurring expense/i }));
};

describe('Recurring Expenses Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCategoryApi.getAll.mockResolvedValue(categories);
    mockedRecurringApi.getAll.mockResolvedValue(paginated);
    mockedRecurringApi.delete.mockResolvedValue({} as never);
    mockedRecurringApi.executeDue.mockResolvedValue([]);
  });

  it('renders recurring expenses list', async () => {
    render(<RecurringExpenses />);

    expect(await screen.findByText('Monthly Rent')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('₹1,200.00')).toBeInTheDocument();
    expect(screen.getByText('₹15.99')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('shows the add recurring expense button', async () => {
    render(<RecurringExpenses />);

    expect(
      await screen.findByRole('button', { name: /add recurring expense/i })
    ).toBeInTheDocument();
  });

  it('opens the form on add click', async () => {
    render(<RecurringExpenses />);
    await screen.findByText('Monthly Rent');

    openCreateForm();

    expect(screen.getByText('Create Recurring Expense')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
  });

  it('creates a new recurring expense', async () => {
    mockedRecurringApi.create.mockResolvedValue({
      ...rent,
      id: '3',
      title: 'Gym Membership',
      amount: '2000.00',
    });

    render(<RecurringExpenses />);
    await screen.findByText('Monthly Rent');

    openCreateForm();

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Gym Membership' },
    });
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '2000' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText('Frequency'), {
      target: { value: 'MONTHLY' },
    });
    fireEvent.change(screen.getByLabelText('Start Date'), {
      target: { value: '2024-02-01' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(mockedRecurringApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Gym Membership',
          amount: '2000',
          categoryId: '1',
          frequency: 'MONTHLY',
          startDate: '2024-02-01',
          isActive: true,
        })
      );
    });
  });

  it('toggles the active status', async () => {
    mockedRecurringApi.update.mockResolvedValue({ ...rent, isActive: false });

    render(<RecurringExpenses />);
    const row = (await screen.findByText('Monthly Rent')).closest('tr') as HTMLElement;

    fireEvent.click(within(row).getByRole('button', { name: /active/i }));

    await waitFor(() => {
      expect(mockedRecurringApi.update).toHaveBeenCalledWith('1', { isActive: false });
    });
  });

  it('deletes a recurring expense after confirmation', async () => {
    render(<RecurringExpenses />);
    const row = (await screen.findByText('Netflix')).closest('tr') as HTMLElement;

    const actionButtons = within(row).getAllByRole('button');
    fireEvent.click(actionButtons[actionButtons.length - 1]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Delete Confirmation')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockedRecurringApi.delete).toHaveBeenCalledWith('2');
    });
  });

  it('executes due recurring expenses', async () => {
    render(<RecurringExpenses />);
    await screen.findByText('Monthly Rent');

    fireEvent.click(screen.getByRole('button', { name: /execute due/i }));

    await waitFor(() => {
      expect(mockedRecurringApi.executeDue).toHaveBeenCalledTimes(1);
    });
  });

  it('filters by active status', async () => {
    render(<RecurringExpenses />);
    await screen.findByText('Monthly Rent');

    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'true' },
    });

    await waitFor(() => {
      expect(mockedRecurringApi.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, limit: 10, isActive: true })
      );
    });
  });

  it('lists every frequency option in the form', async () => {
    render(<RecurringExpenses />);
    await screen.findByText('Monthly Rent');

    openCreateForm();

    expect(screen.getByRole('option', { name: 'Daily' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Weekly' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Monthly' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Yearly' })).toBeInTheDocument();
  });

  it('shows the next execution date', async () => {
    render(<RecurringExpenses />);

    expect(await screen.findByText('01 Feb 2024')).toBeInTheDocument();
    expect(screen.getByText('05 Feb 2024')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<RecurringExpenses />);
    await screen.findByText('Monthly Rent');

    openCreateForm();

    // Start date is pre-filled, so clear it to exercise every validation branch.
    fireEvent.change(screen.getByLabelText('Start Date'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Amount must be positive')).toBeInTheDocument();
      expect(screen.getByText('Category is required')).toBeInTheDocument();
      expect(screen.getByText('Start date is required')).toBeInTheDocument();
    });
    expect(mockedRecurringApi.create).not.toHaveBeenCalled();
  });

  it('rejects a negative amount', async () => {
    render(<RecurringExpenses />);
    await screen.findByText('Monthly Rent');

    openCreateForm();

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '-100' },
    });
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: '1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() => {
      expect(screen.getByText('Amount must be positive')).toBeInTheDocument();
    });
    expect(mockedRecurringApi.create).not.toHaveBeenCalled();
  });

  it('renders the empty state when there are no recurring expenses', async () => {
    mockedRecurringApi.getAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    render(<RecurringExpenses />);

    expect(await screen.findByText('No recurring expenses found')).toBeInTheDocument();
  });

  it('edits an existing recurring expense', async () => {
    mockedRecurringApi.update.mockResolvedValue({ ...rent, title: 'Updated Rent' });

    render(<RecurringExpenses />);
    const row = (await screen.findByText('Monthly Rent')).closest('tr') as HTMLElement;

    const actionButtons = within(row).getAllByRole('button');
    fireEvent.click(actionButtons[actionButtons.length - 2]);

    expect(await screen.findByText('Edit Recurring Expense')).toBeInTheDocument();

    const titleInput = screen.getByLabelText('Title') as HTMLInputElement;
    expect(titleInput.value).toBe('Monthly Rent');

    fireEvent.change(titleInput, { target: { value: 'Updated Rent' } });
    fireEvent.click(screen.getByRole('button', { name: /^update$/i }));

    await waitFor(() => {
      expect(mockedRecurringApi.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ title: 'Updated Rent' })
      );
    });
  });
});
