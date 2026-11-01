import { useState, useEffect } from 'react';
import { Category } from '../../services/api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface CategoryFormProps {
  category: Category | null;
  onSubmit: (data: { name: string; description: string; color: string; icon: string }) => Promise<void>;
  onClose: () => void;
}

export function CategoryForm({ category, onSubmit, onClose }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        color: category.color,
        icon: category.icon || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#6366f1',
        icon: '',
      });
    }
    setErrors({});
  }, [category]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.color && !/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      newErrors.color = 'Invalid color format (use #RRGGBB)';
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {category ? 'Edit Category' : 'Add Category'}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <Input
        label="Name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        placeholder="Enter category name"
        required
      />

      <Input
        label="Color"
        type="color"
        value={formData.color}
        onChange={(e) => handleChange('color', e.target.value)}
        error={errors.color}
        className="h-10 p-1"
      />

      <Input
        label="Icon (optional)"
        value={formData.icon}
        onChange={(e) => handleChange('icon', e.target.value)}
        placeholder="Lucide icon name (e.g., utensils, car)"
      />

      <Input
        label="Description (optional)"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Enter description"
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {category ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}