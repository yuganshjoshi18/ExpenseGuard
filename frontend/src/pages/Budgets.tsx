import { useEffect, useState, useCallback } from 'react';
import {
  budgetApi,
  categoryApi,
  type Budget,
  type Category,
  type BudgetStatus,
  type OverallBudgetStatus
} from '../services/api';
import { formatCurrency } from '../utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { BudgetForm } from '../components/forms/BudgetForm';
import { Plus, Edit, Trash2, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

export function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([]);
  const [overallBudget, setOverallBudget] = useState<OverallBudgetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [budgetsRes, categoriesRes, statusRes, overallRes] = await Promise.allSettled([
        budgetApi.getAll(selectedMonth, selectedYear),
        categoryApi.getAll(),
        budgetApi.getStatus(selectedMonth, selectedYear),
        budgetApi.getOverallStatus(selectedMonth, selectedYear),
      ]);

      if (budgetsRes.status === 'fulfilled') setBudgets(budgetsRes.value);
      if (categoriesRes.status === 'fulfilled') setCategories(categoriesRes.value);
      if (statusRes.status === 'fulfilled') setBudgetStatus(statusRes.value);
      if (overallRes.status === 'fulfilled') setOverallBudget(overallRes.value);
    } catch (err) {
      setError('Failed to load budget data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setEditingBudget(null);
    setShowForm(true);
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDelete = (budget: Budget) => {
    setDeletingBudget(budget);
  };

  const handleFormSubmit = async (data: { categoryId: string; amount: string; month: number; year: number }) => {
    try {
      if (editingBudget) {
        await budgetApi.update(editingBudget.id, data);
      } else {
        await budgetApi.create({ ...data, month: selectedMonth, year: selectedYear });
      }
      setShowForm(false);
      setEditingBudget(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save budget', err);
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingBudget) {
      try {
        await budgetApi.delete(deletingBudget.id);
        setDeletingBudget(null);
        fetchData();
      } catch (err) {
        console.error('Failed to delete budget', err);
      }
    }
  };

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Budgets</h1>
          <p className="text-dark-400">Set and track monthly budgets by category</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            options={months.map(m => ({ value: m.value.toString(), label: m.label }))}
            className="w-40"
          />
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            options={years.map(y => ({ value: y.toString(), label: y.toString() }))}
            className="w-32"
          />
          <Button onClick={handleCreate} icon={<Plus className="w-4 h-4" />}>
            Add Budget
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-900/50 text-red-400">
          {error}
        </div>
      )}

      {/* Overall Budget Status */}
      {overallBudget && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  overallBudget.isCritical ? 'bg-red-900/30' :
                  overallBudget.isWarning ? 'bg-yellow-900/30' :
                  'bg-green-900/30'
                }`}>
                  {overallBudget.isCritical && <AlertCircle className="w-6 h-6 text-red-400" />}
                  {overallBudget.isWarning && !overallBudget.isCritical && <AlertTriangle className="w-6 h-6 text-yellow-400" />}
                  {!overallBudget.isWarning && !overallBudget.isCritical && <CheckCircle className="w-6 h-6 text-green-400" />}
                </div>
                <div>
                  <p className="text-sm text-dark-400">Overall Budget Usage</p>
                  <p className="text-2xl font-bold text-white">{overallBudget.overallPercentage.toFixed(1)}%</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center sm:flex-1">
                <div>
                  <p className="text-sm text-dark-400">Total Budget</p>
                  <p className="font-semibold text-white">{formatCurrency(overallBudget.totalBudget)}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-400">Spent</p>
                  <p className="font-semibold text-red-400">{formatCurrency(overallBudget.totalSpent)}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-400">Remaining</p>
                  <p className="font-semibold text-green-400">{formatCurrency(overallBudget.totalRemaining)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Over Budget */}
        {budgetStatus.filter(b => b.isCritical).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Over Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetStatus.filter(b => b.isCritical).map((status) => (
                  <div key={status.budget.id} className="p-4 rounded-lg bg-red-900/20 border border-red-900/30">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white">{status.budget.category?.name}</span>
                      <span className="text-red-400 font-bold">{status.percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-dark-400 mt-1">
                      <span>Spent: {formatCurrency(status.spent)}</span>
                      <span>Budget: {formatCurrency(status.budget.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning */}
        {budgetStatus.filter(b => b.isWarning && !b.isCritical).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Warning (80%+)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetStatus.filter(b => b.isWarning && !b.isCritical).map((status) => (
                  <div key={status.budget.id} className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-900/30">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white">{status.budget.category?.name}</span>
                      <span className="text-yellow-400 font-bold">{status.percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 transition-all"
                        style={{ width: `${status.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-dark-400 mt-1">
                      <span>Spent: {formatCurrency(status.spent)}</span>
                      <span>Remaining: {formatCurrency(status.remaining)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* On Track */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              On Track
            </CardTitle>
          </CardHeader>
          <CardContent>
            {budgetStatus.filter(b => !b.isWarning && !b.isCritical).length === 0 ? (
              <p className="text-dark-400 text-center py-4">No budgets on track</p>
            ) : (
              <div className="space-y-3">
                {budgetStatus.filter(b => !b.isWarning && !b.isCritical).map((status) => (
                  <div key={status.budget.id} className="p-4 rounded-lg bg-green-900/10 border border-green-900/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white">{status.budget.category?.name}</span>
                      <span className="text-green-400 font-bold">{status.percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${status.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-dark-400 mt-1">
                      <span>Spent: {formatCurrency(status.spent)}</span>
                      <span>Budget: {formatCurrency(status.budget.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* No Budgets Set */}
        {budgetStatus.length === 0 && (
          <Card className="lg:col-span-2">
            <CardContent className="p-12 text-center">
              <p className="text-dark-400 mb-4">No budgets set for this month</p>
              <Button onClick={handleCreate} icon={<Plus className="w-4 h-4" />}>
                Create Your First Budget
              </Button>
            </CardContent>
          </Card>
        )}

        {/* All Budgets Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Budgets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <LoadingSpinner size="lg" />
              </div>
            ) : budgets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-dark-400">No budgets for this period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-800/50">
                    <tr className="text-left text-sm font-medium text-dark-400">
                      <th className="p-4">Category</th>
                      <th className="p-4">Budget</th>
                      <th className="p-4">Spent</th>
                      <th className="p-4">Remaining</th>
                      <th className="p-4">Usage</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {budgets.map((budget) => {
                      const status = budgetStatus.find(s => s.budget.id === budget.id);
                      return (
                        <tr key={budget.id} className="hover:bg-dark-700/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${budget.category?.color}20` }}>
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: budget.category?.color }} />
                              </div>
                              <span className="font-medium text-white">{budget.category?.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-white">{formatCurrency(budget.amount)}</td>
                          <td className="p-4 text-sm text-red-400">{status ? formatCurrency(status.spent) : formatCurrency('0')}</td>
                          <td className="p-4 text-sm text-green-400">{status ? formatCurrency(status.remaining) : formatCurrency(budget.amount)}</td>
                          <td className="p-4">
                            <div className="h-2 bg-dark-700 rounded-full w-32 overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  status?.isCritical ? 'bg-red-500' :
                                  status?.isWarning ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${status?.percentage || 0}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-4">
                            {status?.isCritical && <span className="badge badge-danger">Over Budget</span>}
                            {status?.isWarning && !status?.isCritical && <span className="badge badge-warning">Warning</span>}
                            {!status?.isWarning && !status?.isCritical && <span className="badge badge-success">On Track</span>}
                            {!status && <span className="badge badge-info">No Data</span>}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(budget)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-900/20" onClick={() => handleDelete(budget)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingBudget(null); }}>
        <BudgetForm
          budget={editingBudget}
          categories={categories}
          defaultMonth={selectedMonth}
          defaultYear={selectedYear}
          onSubmit={handleFormSubmit}
          onClose={() => { setShowForm(false); setEditingBudget(null); }}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingBudget}
        onClose={() => setDeletingBudget(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deletingBudget?.category?.name || 'budget'}
      />
    </div>
  );
}