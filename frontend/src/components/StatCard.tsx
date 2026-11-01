import { ReactNode } from 'react';

interface Trend {
  value: string;
  label: string;
  positive: boolean;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: Trend;
}

export function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-dark-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-sm font-medium ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-dark-500">{trend.label}</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-white/5">{icon}</div>
      </div>
    </div>
  );
}