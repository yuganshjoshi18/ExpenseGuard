import { useEffect, useState, useCallback } from 'react';
import {
  transactionApi,
  budgetApi,
  type CategoryTotal,
  type MonthlySummary,
  type BudgetStatus,
  type OverallBudgetStatus
} from '../services/api';
import { formatCurrency } from '../utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Select } from '../components/ui/Select';
import { MonthlyChart } from '../components/charts/MonthlyChart';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';
import { CategoryChart } from '../components/charts/CategoryChart';
import { Calendar, Download, FileText } from 'lucide-react';

export function Reports() {
  const [yearlyComparison, setYearlyComparison] = useState<{ month: number; income: string; expense: string }[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([]);
  const [overallBudget, setOverallBudget] = useState<OverallBudgetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [compareYear, setCompareYear] = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        yearlyRes,
        categoryRes,
        summaryRes,
        budgetRes,
        overallRes
      ] = await Promise.allSettled([
        transactionApi.getYearlyComparison(compareYear),
        transactionApi.getCategoryTotals(selectedYear, selectedMonth),
        transactionApi.getMonthlySummary(selectedYear, selectedMonth),
        budgetApi.getStatus(selectedMonth, selectedYear),
        budgetApi.getOverallStatus(selectedMonth, selectedYear),
      ]);

      if (yearlyRes.status === 'fulfilled') setYearlyComparison(yearlyRes.value);
      if (categoryRes.status === 'fulfilled') setCategoryTotals(categoryRes.value);
      if (summaryRes.status === 'fulfilled') setMonthlySummary(summaryRes.value);
      if (budgetRes.status === 'fulfilled') setBudgetStatus(budgetRes.value);
      if (overallRes.status === 'fulfilled') setOverallBudget(overallRes.value);
    } catch (err) {
      setError('Failed to load reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, compareYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const income = monthlySummary?.income || '0';
  const expense = monthlySummary?.expense || '0';
  const balance = monthlySummary?.balance || '0';
  const savingsRate = income !== '0' ? ((parseFloat(income) - parseFloat(expense)) / parseFloat(income) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-dark-400">Analyze your financial data and trends</p>
        </div>
        {loading && <LoadingSpinner size="sm" />}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-900/50 text-red-400">
          {error}
        </div>
      )}

      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-dark-400">Month:</label>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                options={months.map(m => ({ value: m.value.toString(), label: m.label }))}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-dark-400">Year:</label>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                options={years.map(y => ({ value: y.toString(), label: y.toString() }))}
                className="w-32"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-dark-400">Compare Year:</label>
              <Select
                value={compareYear}
                onChange={(e) => setCompareYear(parseInt(e.target.value))}
                options={years.map(y => ({ value: y.toString(), label: y.toString() }))}
                className="w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">Total Income</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(income)}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">Total Expenses</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(expense)}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/20">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">Net Balance</p>
                <p className={`text-2xl font-bold ${parseFloat(balance) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${parseFloat(balance) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <Calendar className={`w-6 h-6 ${parseFloat(balance) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">Savings Rate</p>
                <p className={`text-2xl font-bold ${parseFloat(savingsRate) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {savingsRate}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Download className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyChart data={yearlyComparison} />
        <IncomeExpenseChart data={yearlyComparison} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CategoryChart data={categoryTotals} />
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {overallBudget && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-dark-800/50">
                    <div>
                      <p className="text-sm text-dark-400">Overall Budget Usage</p>
                      <p className="text-xl font-bold text-white">{overallBudget.overallPercentage.toFixed(1)}%</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      overallBudget.isCritical ? 'bg-red-900/30 text-red-400' :
                      overallBudget.isWarning ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-green-900/30 text-green-400'
                    }`}>
                      {overallBudget.isCritical ? 'Over Budget' : overallBudget.isWarning ? 'Warning' : 'On Track'}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
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
              )}

              {budgetStatus.length > 0 ? (
                <div className="space-y-3">
                  {budgetStatus.map((status) => (
                    <div key={status.budget.id} className="p-4 rounded-lg bg-dark-800/50 border border-dark-700">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${status.budget.category?.color}20` }}>
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: status.budget.category?.color }} />
                          </div>
                          <span className="font-medium text-white">{status.budget.category?.name}</span>
                        </div>
                        <span className={`font-bold ${
                          status.isCritical ? 'text-red-400' :
                          status.isWarning ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>{status.percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            status.isCritical ? 'bg-red-500' :
                            status.isWarning ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(status.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-dark-400 mt-1">
                        <span>Spent: {formatCurrency(status.spent)}</span>
                        <span>Budget: {formatCurrency(status.budget.amount)}</span>
                        <span>Remaining: {formatCurrency(status.remaining)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-center py-4">No budgets set for this period</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}