import { useEffect, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import {
  transactionApi,
  budgetApi,
  recurringExpenseApi,
  type Transaction,
  type BudgetStatus,
  type OverallBudgetStatus,
  type CategoryTotal,
  type MonthlySummary,
  type RecurringExpense
} from '../services/api';
import { formatCurrency } from '../utils/format';
import { StatCard } from '../components/StatCard';
import { MonthlyChart } from '../components/charts/MonthlyChart';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';
import { CategoryChart } from '../components/charts/CategoryChart';
import { RecentTransactions } from '../components/RecentTransactions';
import { BudgetWarnings } from '../components/BudgetWarnings';
import { UpcomingRecurring } from '../components/UpcomingRecurring';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function Dashboard() {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [yearlyComparison, setYearlyComparison] = useState<{ month: number; income: string; expense: string }[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([]);
  const [overallBudget, setOverallBudget] = useState<OverallBudgetStatus | null>(null);
  const [upcomingRecurring, setUpcomingRecurring] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    fetchDashboardData();
  }, [currentMonth, currentYear]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        summaryRes,
        categoryTotalsRes,
        yearlyComparisonRes,
        transactionsRes,
        budgetStatusRes,
        overallBudgetRes,
        recurringRes
      ] = await Promise.allSettled([
        transactionApi.getMonthlySummary(currentYear, currentMonth),
        transactionApi.getCategoryTotals(currentYear, currentMonth),
        transactionApi.getYearlyComparison(currentYear),
        transactionApi.getAll({ page: 1, limit: 5, sortBy: 'date', sortOrder: 'desc' }),
        budgetApi.getStatus(currentMonth, currentYear),
        budgetApi.getOverallStatus(currentMonth, currentYear),
        recurringExpenseApi.getAll({ page: 1, limit: 5, isActive: true })
      ]);

      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      if (categoryTotalsRes.status === 'fulfilled') setCategoryTotals(categoryTotalsRes.value);
      if (yearlyComparisonRes.status === 'fulfilled') setYearlyComparison(yearlyComparisonRes.value);
      if (transactionsRes.status === 'fulfilled') setRecentTransactions(transactionsRes.value.data);
      if (budgetStatusRes.status === 'fulfilled') setBudgetStatus(budgetStatusRes.value);
      if (overallBudgetRes.status === 'fulfilled') setOverallBudget(overallBudgetRes.value);
      if (recurringRes.status === 'fulfilled') setUpcomingRecurring(recurringRes.value.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Failed to Load Dashboard</h2>
        <p className="text-dark-400 mb-4">{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary">Retry</button>
      </div>
    );
  }

  const income = summary?.income || '0';
  const expense = summary?.expense || '0';
  const balance = summary?.balance || '0';
  const savingsRate = income !== '0' ? ((parseFloat(income) - parseFloat(expense)) / parseFloat(income) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400">Welcome back! Here's your financial overview for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(income)}
          icon={<TrendingUp className="w-6 h-6 text-green-500" />}
          trend={{ value: '+12.5%', label: 'vs last month', positive: true }}
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(expense)}
          icon={<TrendingDown className="w-6 h-6 text-red-500" />}
          trend={{ value: '-8.2%', label: 'vs last month', positive: true }}
        />
        <StatCard
          title="Available Balance"
          value={formatCurrency(balance)}
          icon={<Wallet className="w-6 h-6 text-blue-500" />}
          trend={balance.startsWith('-') ? { value: 'Over budget', label: 'Take action', positive: false } : { value: `${savingsRate}%`, label: 'savings rate', positive: true }}
        />
        <StatCard
          title="Monthly Savings"
          value={formatCurrency((parseFloat(income) - parseFloat(expense)).toString())}
          icon={<CreditCard className="w-6 h-6 text-purple-500" />}
          trend={{ value: savingsRate !== '0' ? `${savingsRate}%` : '0%', label: 'of income', positive: parseFloat(savingsRate) >= 0 }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyChart data={yearlyComparison} />
        <IncomeExpenseChart data={yearlyComparison} />
      </div>

      {/* Category Distribution & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CategoryChart data={categoryTotals} />
        </div>
        <div className="lg:col-span-2">
          <RecentTransactions transactions={recentTransactions} onRefresh={fetchDashboardData} />
        </div>
      </div>

      {/* Budget Warnings & Upcoming Recurring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetWarnings
          budgetStatus={budgetStatus}
          overallBudget={overallBudget}
        />
        <UpcomingRecurring recurringExpenses={upcomingRecurring} />
      </div>
    </div>
  );
}