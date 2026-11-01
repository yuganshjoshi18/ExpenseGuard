import { useState, useEffect } from 'react';
import { RecurringExpense, Category } from '../../services/api';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface RecurringExpenseFormProps {
  expense: RecurringExpense | null;
  categories: Category[];
  onSubmit: (data: {
    title: string;
    amount: string;
    categoryId: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    startDate: string;
    endDate: string;
    description: string;
    paymentMethod: string;
    isActive: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

export function RecurringExpenseForm({ expense, categories, onSubmit, onClose }: RecurringExpenseFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    categoryId: '',
    frequency: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: '',
    paymentMethod: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (expense) {
      setFormData({
        title: expense.title,
        amount: expense.amount,
        categoryId: expense.categoryId,
        frequency: expense.frequency,
        startDate: expense.startDate.split('T')[0],
        endDate: expense.endDate ? expense.endDate.split('T')[0] : '',
        description: expense.description || '',
        paymentMethod: expense.paymentMethod || '',
        isActive: expense.isActive,
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        categoryId: '',
        frequency: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        description: '',
        paymentMethod: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [expense]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be positive';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (formData.endDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date must be after start date';
    }
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

  const handleChange = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const frequencies = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'YEARLY', label: 'Yearly' },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {expense ? 'Edit Recurring Expense' : 'Create Recurring Expense'}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => handleChange('title', e.target.value)}
        error={errors.title}
        placeholder="Enter title"
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
          label="Category"
          value={formData.categoryId}
          onChange={(e) => handleChange('categoryId', e.target.value)}
          options={categories.map(c => ({ value: c.id, label: c.name }))}
          placeholder="Select category"
          error={errors.categoryId}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Frequency"
          value={formData.frequency}
          onChange={(e) => handleChange('frequency', e.target.value as typeof formData.frequency)}
          options={frequencies}
          required
        />
        <Input
          label="Start Date"
          type="date"
          value={formData.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          error={errors.startDate}
          required
        />
      </div>

      <Input
        label="End Date (optional)"
        type="date"
        value={formData.endDate}
        onChange={(e) => handleChange('endDate', e.target.value)}
        error={errors.endDate}
      />

      <Select
        label="Payment Method (optional)"
        value={formData.paymentMethod}
        onChange={(e) => handleChange('paymentMethod', e.target.value)}
        options={[
          { value: '', label: 'Select payment method' },
          { value: 'CASH', label: 'Cash' },
          { value: 'CARD', label: 'Card' },
          { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
          { value: 'UPI', label: 'UPI' },
          { value: 'OTHER', label: 'Other' },
        ]}
        placeholder="Select payment method"
      />

      <Input
        label="Description (optional)"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Add a description"
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => handleChange('isActive', e.target.checked)}
          className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="isActive" className="text-sm text-dark-300">Active</label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {expense ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}