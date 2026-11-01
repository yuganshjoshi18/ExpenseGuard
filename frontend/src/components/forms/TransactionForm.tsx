import { useState, useEffect } from 'react';
import { Transaction, Category } from '../../services/api';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface TransactionFormProps {
  transaction: Transaction | null;
  categories: Category[];
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'category'>) => Promise<void>;
  onClose: () => void;
}

export function TransactionForm({ transaction, categories, onSubmit, onClose }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        categoryId: transaction.categoryId,
        date: transaction.date.split('T')[0],
        description: transaction.description || '',
        paymentMethod: transaction.paymentMethod || '',
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        type: 'EXPENSE',
        categoryId: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        paymentMethod: '',
      });
    }
    setErrors({});
  }, [transaction]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be positive';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (!formData.date) newErrors.date = 'Date is required';
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

  const expenseCategories = categories.filter(c => !c.isDefault || ['Food', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare', 'Education', 'Bills', 'Rent', 'Travel', 'Other'].includes(c.name));
  const incomeCategories = categories.filter(c => c.name === 'Other' || !['Food', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare', 'Education', 'Bills', 'Rent', 'Travel'].includes(c.name));

  const relevantCategories = formData.type === 'INCOME' ? incomeCategories : expenseCategories;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {transaction ? 'Edit Transaction' : 'Add Transaction'}
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
        placeholder="Enter transaction title"
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
          label="Type"
          value={formData.type}
          onChange={(e) => {
            handleChange('type', e.target.value as 'INCOME' | 'EXPENSE');
            handleChange('categoryId', '');
          }}
          options={[
            { value: 'EXPENSE', label: 'Expense' },
            { value: 'INCOME', label: 'Income' },
          ]}
          error={errors.type}
          required
        />
      </div>

      <Select
        label="Category"
        value={formData.categoryId}
        onChange={(e) => handleChange('categoryId', e.target.value)}
        options={relevantCategories.map(c => ({ value: c.id, label: c.name }))}
        placeholder="Select category"
        error={errors.categoryId}
        required
      />

      <Input
        label="Date"
        type="date"
        value={formData.date}
        onChange={(e) => handleChange('date', e.target.value)}
        error={errors.date}
        required
      />

      <Input
        label="Description (optional)"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Add a description"
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

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {transaction ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}