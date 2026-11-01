import { useEffect, useState, useCallback } from 'react';
import {
  categoryApi,
  type Category
} from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { CategoryForm } from '../components/forms/CategoryForm';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cats = await categoryApi.getAll();
      setCategories(cats);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = (category: Category) => {
    if (category.isDefault) return;
    setDeletingCategory(category);
  };

  const handleFormSubmit = async (data: { name: string; description: string; color: string; icon: string }) => {
    try {
      if (editingCategory) {
        await categoryApi.update(editingCategory.id, data);
      } else {
        await categoryApi.create(data);
      }
      setShowForm(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      console.error('Failed to save category', err);
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingCategory) {
      try {
        await categoryApi.delete(deletingCategory.id);
        setDeletingCategory(null);
        fetchCategories();
      } catch (err) {
        console.error('Failed to delete category', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-dark-400">Manage your transaction categories</p>
        </div>
        <Button onClick={handleCreate} icon={<Plus className="w-4 h-4" />}>
          Add Category
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-900/50 text-red-400">
          {error}
        </div>
      )}

      {/* Categories Grid */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 rounded-lg bg-dark-800/50 border border-dark-700 hover:border-primary-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{category.name}</h3>
                        {category.isDefault && (
                          <span className="badge badge-info">Default</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!category.isDefault && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {!category.isDefault && (
                        <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-900/20" onClick={() => handleDelete(category)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {category.isDefault && (
                        <span title="Default category cannot be deleted">
                          <Shield className="w-5 h-5 text-dark-500" aria-label="Default category cannot be deleted" />
                        </span>
                      )}
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-sm text-dark-400 mb-3">{category.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-dark-500">
                    <span>Color: </span>
                    <span className="font-mono">{category.color}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingCategory(null); }}>
        <CategoryForm
          category={editingCategory}
          onSubmit={handleFormSubmit}
          onClose={() => { setShowForm(false); setEditingCategory(null); }}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deletingCategory?.name || 'category'}
      />
    </div>
  );
}