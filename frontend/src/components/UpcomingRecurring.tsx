import { RecurringExpense } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { formatCurrency, formatDate } from '../utils/format';
import { Calendar, Repeat } from 'lucide-react';

interface UpcomingRecurringProps {
  recurringExpenses: RecurringExpense[];
}

export function UpcomingRecurring({ recurringExpenses }: UpcomingRecurringProps) {
  const upcoming = recurringExpenses
    .filter(r => r.nextExecutionAt)
    .sort((a, b) => new Date(a.nextExecutionAt!).getTime() - new Date(b.nextExecutionAt!).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Recurring Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-dark-400">No upcoming recurring expenses</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Repeat className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{expense.title}</p>
                    <p className="text-sm text-dark-400 capitalize">{expense.frequency.toLowerCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-400">{formatCurrency(expense.amount)}</p>
                  <div className="flex items-center gap-1 text-xs text-dark-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(expense.nextExecutionAt!)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}