import { Transaction } from '../services/api';
import { formatDate } from '../utils/format';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onRefresh: () => void;
}

export function RecentTransactions({ transactions, onRefresh }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-dark-400">No transactions yet</p>
            <button onClick={onRefresh} className="btn-primary mt-4">Add Transaction</button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <button onClick={onRefresh} className="btn-ghost btn-sm">View All</button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-dark-700">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-dark-700/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  transaction.type === 'INCOME' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {transaction.type === 'INCOME' ? (
                    <ArrowUpRight className="w-5 h-5 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">{transaction.title}</p>
                  <p className="text-sm text-dark-400">
                    {transaction.category?.name || 'Unknown'} • {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${transaction.type === 'INCOME' ? 'text-green-400' : 'text-red-400'}`}>
                  {transaction.type === 'INCOME' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                </p>
                <p className="text-xs text-dark-500">{transaction.paymentMethod || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}