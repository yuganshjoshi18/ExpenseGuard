import { useEffect, useState, useCallback } from 'react';
import {
  recurringExpenseApi,
  categoryApi,
  type RecurringExpense,
  type Category
} from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { Card, CardContent } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { RecurringExpenseForm } from '../components/forms/RecurringExpenseForm';
import { Plus, Edit, Trash2, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

export function RecurringExpenses() {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<RecurringExpense | null>(null);
  const [executing, setExecuting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [expensesRes, categoriesRes] = await Promise.allSettled([
        recurringExpenseApi.getAll({ page, limit, isActive: isActiveFilter }),
        categoryApi.getAll(),
      ]);

      if (expensesRes.status === 'fulfilled') {
        setRecurringExpenses(expensesRes.value.data);
        setTotal(expensesRes.value.total);
        setTotalPages(expensesRes.value.totalPages);
      }
      if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value);
    } catch (err) {
      setError('Failed to load recurring expenses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, isActiveFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setEditingExpense(null);
    setShowForm(true);
  };

  const handleEdit = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = (expense: RecurringExpense) => {
    setDeletingExpense(expense);
  };

  const handleFormSubmit = async (data: {
    title: string;
    amount: string;
    categoryId: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    startDate: string;
    endDate: string;
    description: string;
    paymentMethod: string;
    isActive: boolean;
  }) => {
    try {
      if (editingExpense) {
        await recurringExpenseApi.update(editingExpense.id, data);
      } else {
        await recurringExpenseApi.create(data);
      }
      setShowForm(false);
      setEditingExpense(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save recurring expense', err);
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingExpense) {
      try {
        await recurringExpenseApi.delete(deletingExpense.id);
        setDeletingExpense(null);
        fetchData();
      } catch (err) {
        console.error('Failed to delete recurring expense', err);
      }
    }
  };

  const handleExecuteDue = async () => {
    setExecuting(true);
    try {
      await recurringExpenseApi.executeDue();
      fetchData();
    } catch (err) {
      console.error('Failed to execute due expenses', err);
    } finally {
      setExecuting(false);
    }
  };

  const handleToggleActive = async (expense: RecurringExpense) => {
    try {
      await recurringExpenseApi.update(expense.id, { isActive: !expense.isActive });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Recurring Expenses</h1>
          <p className="text-dark-400">Manage automated recurring expenses</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExecuteDue} icon={<Play className="w-4 h-4" />} loading={executing}>
            Execute Due
          </Button>
          <Button onClick={handleCreate} icon={<Plus className="w-4 h-4" />}>
            Add Recurring Expense
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-900/50 text-red-400">
          {error}
        </div>
      )}

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Select
              value={isActiveFilter !== undefined ? isActiveFilter.toString() : ''}
              onChange={(e) => {
                const val = e.target.value;
                setIsActiveFilter(val === '' ? undefined : val === 'true');
                setPage(1);
              }}
              options={[
                { value: '', label: 'All' },
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
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
                      <th className="p-4">Title</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Frequency</th>
                      <th className="p-4">Next Execution</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {recurringExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-dark-400">
                          No recurring expenses found
                        </td>
                      </tr>
                    ) : (
                      recurringExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-dark-700/50 transition-colors">
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-white">{expense.title}</p>
                              {expense.description && <p className="text-sm text-dark-400">{expense.description}</p>}
                            </div>
                          </td>
                          <td className="p-4 text-sm font-semibold text-red-400">{formatCurrency(expense.amount)}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${expense.category?.color}20` }}>
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: expense.category?.color }} />
                              </div>
                              <span className="text-sm text-white">{expense.category?.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="badge badge-info capitalize">{expense.frequency.toLowerCase()}</span>
                          </td>
                          <td className="p-4 text-sm text-white">
                            {expense.nextExecutionAt ? formatDate(expense.nextExecutionAt) : '—'}
                          </td>
                          <td className="p-4">
                            <Button
                              variant={expense.isActive ? 'secondary' : 'outline'}
                              size="sm"
                              onClick={() => handleToggleActive(expense)}
                            >
                              {expense.isActive ? (
                                <>
                                  <Pause className="w-4 h-4" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4" />
                                  Inactive
                                </>
                              )}
                            </Button>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-900/20" onClick={() => handleDelete(expense)}>
                                <Trash2 className="w-4 h-4" />
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
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-white px-4">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingExpense(null); }} size="lg">
        <RecurringExpenseForm
          expense={editingExpense}
          categories={categories}
          onSubmit={handleFormSubmit}
          onClose={() => { setShowForm(false); setEditingExpense(null); }}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deletingExpense?.title || 'recurring expense'}
      />
    </div>
  );
}