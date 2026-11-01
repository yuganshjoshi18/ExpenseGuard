import { useState, useEffect } from 'react';
import { Budget, Category } from '../../services/api';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface BudgetFormProps {
  budget: Budget | null;
  categories: Category[];
  defaultMonth: number;
  defaultYear: number;
  onSubmit: (data: { categoryId: string; amount: string; month: number; year: number }) => Promise<void>;
  onClose: () => void;
}

export function BudgetForm({ budget, categories, defaultMonth, defaultYear, onSubmit, onClose }: BudgetFormProps) {
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    month: defaultMonth,
    year: defaultYear,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (budget) {
      setFormData({
        categoryId: budget.categoryId,
        amount: budget.amount,
        month: budget.month,
        year: budget.year,
      });
    } else {
      setFormData({
        categoryId: '',
        amount: '',
        month: defaultMonth,
        year: defaultYear,
      });
    }
    setErrors({});
  }, [budget, defaultMonth, defaultYear]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be positive';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {budget ? 'Edit Budget' : 'Create Budget'}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <Select
        label="Category"
        value={formData.categoryId}
        onChange={(e) => handleChange('categoryId', e.target.value)}
        options={categories.map(c => ({ value: c.id, label: c.name }))}
        placeholder="Select category"
        error={errors.categoryId}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0.01"
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          error={errors.amount}
          placeholder="0.00"
          required
        />
        <Select
          label="Month"
          value={formData.month.toString()}
          onChange={(e) => handleChange('month', e.target.value)}
          options={months.map(m => ({ value: m.value.toString(), label: m.label }))}
          required
        />
      </div>

      <Select
        label="Year"
        value={formData.year.toString()}
        onChange={(e) => handleChange('year', e.target.value)}
        options={Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => ({ value: y.toString(), label: y.toString() }))}
        required
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {budget ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}