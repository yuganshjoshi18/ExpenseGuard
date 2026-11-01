import { useEffect, useState, useCallback } from 'react';
import {
  transactionApi,
  categoryApi,
  type Transaction,
  type Category
} from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { Card, CardContent } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowDownUp } from 'lucide-react';

interface TransactionFilters {
  page: number;
  limit: number;
  sortBy: 'date' | 'amount' | 'title' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  type?: 'INCOME' | 'EXPENSE';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await transactionApi.getAll(filters);
      setTransactions(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError('Failed to load transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await categoryApi.getAll();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [fetchTransactions, fetchCategories]);

  const handleSort = (sortBy: TransactionFilters['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const handleFilterChange = (key: keyof TransactionFilters, value: TransactionFilters[keyof TransactionFilters]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleCreate = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
  };

  const handleFormSubmit = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'category'>) => {
    try {
      if (editingTransaction) {
        await transactionApi.update(editingTransaction.id, data);
      } else {
        await transactionApi.create(data);
      }
      setShowForm(false);
      setEditingTransaction(null);
      fetchTransactions();
    } catch (err) {
      console.error('Failed to save transaction', err);
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingTransaction) {
      try {
        await transactionApi.delete(deletingTransaction.id);
        setDeletingTransaction(null);
        fetchTransactions();
      } catch (err) {
        console.error('Failed to delete transaction', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-dark-400">Manage your income and expenses</p>
        </div>
        <Button onClick={handleCreate} icon={<Plus className="w-4 h-4" />}>
          Add Transaction
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-900/50 text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 max-w-xs">
              <Input
                placeholder="Search transactions..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'INCOME', label: 'Income' },
                  { value: 'EXPENSE', label: 'Expense' },
                ]}
                className="w-40"
              />
              <Select
                value={filters.categoryId || ''}
                onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
                options={[
                  { value: '', label: 'All Categories' },
                  ...categories.map(c => ({ value: c.id, label: c.name })),
                ]}
                className="w-48"
              />
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                className="w-40"
              />
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-800/50">
                    <tr className="text-left text-sm font-medium text-dark-400">
                      <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('date')}>
                        <div className="flex items-center gap-1">
                          Date
                          {filters.sortBy === 'date' && (
                            filters.sortOrder === 'asc' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('title')}>
                        <div className="flex items-center gap-1">
                          Title
                          {filters.sortBy === 'title' && (
                            filters.sortOrder === 'asc' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('amount')}>
                        <div className="flex items-center gap-1">
                          Amount
                          {filters.sortBy === 'amount' && (
                            filters.sortOrder === 'asc' ? <ArrowUpDown className="w-4 h-4" /> : <ArrowDownUp className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-dark-400">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-dark-700/50 transition-colors">
                          <td className="p-4 text-sm text-white">{formatDate(transaction.date)}</td>
                          <td className="p-4 text-sm font-medium text-white">{transaction.title}</td>
                          <td className="p-4 text-sm font-semibold">
                            <span className={transaction.type === 'INCOME' ? 'text-green-400' : 'text-red-400'}>
                              {transaction.type === 'INCOME' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-dark-300">
                            {transaction.category?.name || 'Unknown'}
                          </td>
                          <td className="p-4">
                            <span className={`badge ${
                              transaction.type === 'INCOME' ? 'badge-success' : 'badge-danger'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-dark-400">
                            {transaction.paymentMethod || '—'}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(transaction)}>
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-900/20" onClick={() => handleDelete(transaction)}>
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-dark-700">
                  <p className="text-sm text-dark-400">
                    Showing {(filters.page - 1) * filters.limit + 1} to {Math.min(filters.page * filters.limit, total)} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={filters.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-white px-4">
                      Page {filters.page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={filters.page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingTransaction(null); }}>
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          onSubmit={handleFormSubmit}
          onClose={() => { setShowForm(false); setEditingTransaction(null); }}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deletingTransaction?.title || 'transaction'}
      />
    </div>
  );
}