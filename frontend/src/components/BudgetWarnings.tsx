import { BudgetStatus, OverallBudgetStatus } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface BudgetWarningsProps {
  budgetStatus: BudgetStatus[];
  overallBudget: OverallBudgetStatus | null;
}

export function BudgetWarnings({ budgetStatus, overallBudget }: BudgetWarningsProps) {
  const warningBudgets = budgetStatus.filter(b => b.isWarning && !b.isCritical);
  const criticalBudgets = budgetStatus.filter(b => b.isCritical);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Budget Status</CardTitle>
        {overallBudget && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            overallBudget.isCritical ? 'bg-red-900/30 text-red-400' :
            overallBudget.isWarning ? 'bg-yellow-900/30 text-yellow-400' :
            'bg-green-900/30 text-green-400'
          }`}>
            {overallBudget.isCritical && <AlertCircle className="w-4 h-4" />}
            {overallBudget.isWarning && !overallBudget.isCritical && <AlertTriangle className="w-4 h-4" />}
            {!overallBudget.isWarning && !overallBudget.isCritical && <CheckCircle className="w-4 h-4" />}
            Overall: {overallBudget.overallPercentage.toFixed(0)}%
          </div>
        )}
      </CardHeader>
      <CardContent>
        {criticalBudgets.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Over Budget
            </h4>
            <div className="space-y-2">
              {criticalBudgets.map((budget) => (
                <div key={budget.budget.id} className="p-3 rounded-lg bg-red-900/20 border border-red-900/30">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">{budget.budget.category?.name}</span>
                    <span className="text-red-400 font-semibold">{budget.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm text-dark-400 mt-1">
                    <span>Spent: {formatCurrency(budget.spent)}</span>
                    <span>Budget: {formatCurrency(budget.budget.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {warningBudgets.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Warning (80%+)
            </h4>
            <div className="space-y-2">
              {warningBudgets.map((budget) => (
                <div key={budget.budget.id} className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-900/30">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">{budget.budget.category?.name}</span>
                    <span className="text-yellow-400 font-semibold">{budget.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm text-dark-400 mt-1">
                    <span>Spent: {formatCurrency(budget.spent)}</span>
                    <span>Remaining: {formatCurrency(budget.remaining)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {budgetStatus.filter(b => !b.isWarning && !b.isCritical).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              On Track
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {budgetStatus.filter(b => !b.isWarning && !b.isCritical).map((budget) => (
                <div key={budget.budget.id} className="p-3 rounded-lg bg-green-900/10 border border-green-900/20">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">{budget.budget.category?.name}</span>
                    <span className="text-green-400 font-semibold">{budget.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm text-dark-400 mt-1">
                    <span>Spent: {formatCurrency(budget.spent)}</span>
                    <span>Budget: {formatCurrency(budget.budget.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {budgetStatus.length === 0 && (
          <div className="text-center py-8">
            <p className="text-dark-400">No budgets set for this month</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}