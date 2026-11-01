import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

// Types
export interface Transaction {
  id: string;
  title: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId: string;
  category?: Category;
  date: string;
  description?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  category?: Category;
  amount: string;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: string;
  categoryId: string;
  category?: Category;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
  nextExecutionAt: string;
  isActive: boolean;
  description?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MonthlySummary {
  income: string;
  expense: string;
  balance: string;
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE';
}

export interface BudgetStatus {
  budget: Budget;
  spent: string;
  remaining: string;
  percentage: number;
  isWarning: boolean;
  isCritical: boolean;
}

export interface OverallBudgetStatus {
  totalBudget: string;
  totalSpent: string;
  totalRemaining: string;
  overallPercentage: number;
  isWarning: boolean;
  isCritical: boolean;
}

// Transaction API
export const transactionApi = {
  create: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'category'>) =>
    api.post<Transaction>('/transactions', data).then(res => res.data),

  getAll: (params?: {
    page?: number;
    limit?: number;
    sortBy?: 'date' | 'amount' | 'title' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    type?: 'INCOME' | 'EXPENSE';
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => api.get<PaginatedResponse<Transaction>>('/transactions', { params }).then(res => res.data),

  getById: (id: string) => api.get<Transaction>(`/transactions/${id}`).then(res => res.data),

  update: (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'category'>>) =>
    api.put<Transaction>(`/transactions/${id}`, data).then(res => res.data),

  delete: (id: string) => api.delete(`/transactions/${id}`),

  getMonthlySummary: (year: number, month: number) =>
    api.get<MonthlySummary>('/transactions/monthly-summary', { params: { year, month } }).then(res => res.data),

  getCategoryTotals: (year: number, month: number) =>
    api.get<CategoryTotal[]>('/transactions/category-totals', { params: { year, month } }).then(res => res.data),

  getYearlyComparison: (year: number) =>
    api.get<{ month: number; income: string; expense: string }[]>('/transactions/yearly-comparison', { params: { year } }).then(res => res.data),

  checkDuplicate: (title: string, amount: string, date: string, categoryId: string) =>
    api.get<{ duplicate: Transaction | null }>('/transactions/check-duplicate', { params: { title, amount, date, categoryId } }).then(res => res.data),
};

// Category API
export const categoryApi = {
  create: (data: { name: string; description?: string; color?: string; icon?: string }) =>
    api.post<Category>('/categories', data).then(res => res.data),

  getAll: () => api.get<Category[]>('/categories').then(res => res.data),

  getDefault: () => api.get<Category[]>('/categories/default').then(res => res.data),

  getWithCount: () => api.get<(Category & { _count: { transactions: number } })[]>('/categories/with-count').then(res => res.data),

  getById: (id: string) => api.get<Category>(`/categories/${id}`).then(res => res.data),

  update: (id: string, data: { name?: string; description?: string; color?: string; icon?: string }) =>
    api.put<Category>(`/categories/${id}`, data).then(res => res.data),

  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Budget API
export const budgetApi = {
  create: (data: { categoryId: string; amount: string; month: number; year: number }) =>
    api.post<Budget>('/budgets', data).then(res => res.data),

  getAll: (month?: number, year?: number) =>
    api.get<Budget[]>('/budgets', { params: { month, year } }).then(res => res.data),

  getStatus: (month: number, year: number) =>
    api.get<BudgetStatus[]>('/budgets/status', { params: { month, year } }).then(res => res.data),

  getOverallStatus: (month: number, year: number) =>
    api.get<OverallBudgetStatus>('/budgets/overall-status', { params: { month, year } }).then(res => res.data),

  getById: (id: string) => api.get<Budget>(`/budgets/${id}`).then(res => res.data),

  update: (id: string, data: { amount?: string }) =>
    api.put<Budget>(`/budgets/${id}`, data).then(res => res.data),

  upsert: (data: { categoryId: string; amount: string; month: number; year: number }) =>
    api.put<Budget>('/budgets/upsert', data).then(res => res.data),

  delete: (id: string) => api.delete(`/budgets/${id}`),
};

// Recurring Expense API
export const recurringExpenseApi = {
  create: (data: {
    title: string;
    amount: string;
    categoryId: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    startDate: string;
    endDate?: string;
    description?: string;
    paymentMethod?: string;
  }) => api.post<RecurringExpense>('/recurring-expenses', data).then(res => res.data),

  getAll: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    api.get<PaginatedResponse<RecurringExpense>>('/recurring-expenses', { params }).then(res => res.data),

  getById: (id: string) => api.get<RecurringExpense>(`/recurring-expenses/${id}`).then(res => res.data),

  update: (id: string, data: {
    title?: string;
    amount?: string;
    categoryId?: string;
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    startDate?: string;
    endDate?: string;
    description?: string;
    paymentMethod?: string;
    isActive?: boolean;
  }) => api.put<RecurringExpense>(`/recurring-expenses/${id}`, data).then(res => res.data),

  delete: (id: string) => api.delete(`/recurring-expenses/${id}`),

  executeDue: () => api.post<{ id: string; status: string; transactionId?: string; error?: string }[]>('/recurring-expenses/execute-due').then(res => res.data),

  getExecutionHistory: (id: string, page = 1, limit = 20) =>
    api.get<PaginatedResponse<{ id: string; executedAt: string; transactionId?: string; status: string; errorMessage?: string }>>(`/recurring-expenses/${id}/executions`, { params: { page, limit } }).then(res => res.data),
};

// CSV API
export const csvApi = {
  import: (file: File, skipDuplicates = true) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{
      total: number;
      valid: number;
      invalid: number;
      duplicates: number;
      imported: number;
      errors: Array<{ row: number; field: string; message: string; value?: string }>;
      transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'category'>[];
    }>('/csv/import', formData, {
      params: { skipDuplicates },
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },

  export: () => api.get('/csv/export', { responseType: 'blob' }).then(res => res.data),

  downloadTemplate: () => api.get('/csv/template', { responseType: 'blob' }).then(res => res.data),
};

export default api;