import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE';
}

interface CategoryChartProps {
  data: CategoryTotal[];
}

const COLORS = [
  '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981',
  '#f59e0b', '#6366f1', '#14b8a6', '#f97316', '#64748b',
  '#84cc16', '#eab308', '#06b6d4', '#d946ef', '#fb923c'
];

export function CategoryChart({ data }: CategoryChartProps) {
  const expenseData = data
    .filter(d => d.type === 'EXPENSE')
    .map((d, i) => ({
      name: d.categoryName,
      value: parseFloat(d.amount),
      fill: COLORS[i % COLORS.length],
    }));

  const totalExpenses = expenseData.reduce((sum, d) => sum + d.value, 0);

  if (expenseData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-dark-400">No expense data for this period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconSize={10}
                wrapperStyle={{ paddingTop: 20 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 pt-4 border-t border-dark-700">
          <p className="text-sm text-dark-400">Total Expenses: <span className="text-white font-medium">${totalExpenses.toFixed(2)}</span></p>
        </div>
      </CardContent>
    </Card>
  );
}