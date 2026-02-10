import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { categoryAPI } from '@/lib/api';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const AdminCategories = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalCategories?: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({
    name: '',
    displayName: '',
    description: '',
    icon: '',
    order: 0
  });

  const fetchCategories = async (pageNum: number = page) => {
    try {
      setLoading(true);
      const res = await categoryAPI.getAll({ page: pageNum, limit: 10 });
      setCategories(res.data.data?.categories || []);
      setPagination(res.data.data?.pagination || null);
    } catch (error) {
      toast.error(t('admin.fetchUsersError') || 'Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(page);
  }, [page]);

  const resetForm = () => {
    setForm({ name: '', displayName: '', description: '', icon: '', order: 0 });
    setShowForm(false);
    setEditing(null);
  };

  const handleEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      displayName: category.displayName,
      description: category.description || '',
      icon: category.icon || '',
      order: category.order
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await categoryAPI.update(editing._id, {
          displayName: form.displayName,
          description: form.description,
          icon: form.icon,
          order: form.order
        });
        toast.success(t('admin.updateSuccess') || 'Category updated successfully');
      } else {
        await categoryAPI.create({
          name: form.name,
          displayName: form.displayName,
          description: form.description,
          icon: form.icon,
          order: form.order
        });
        toast.success(t('admin.createSuccess') || 'Category created successfully');
      }
      resetForm();
      fetchCategories(page);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.delete') + '?')) return;
    try {
      await categoryAPI.delete(id);
      toast.success(t('admin.deleteSuccess') || 'Category deleted successfully');
      fetchCategories(page);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error');
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await categoryAPI.update(category._id, { isActive: !category.isActive });
      toast.success(t('admin.updateSuccess') || 'Category updated successfully');
      fetchCategories(page);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold font-heading">{t('admin.categories') || 'Categories'}</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.addCategory') || 'Add Category'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editing ? (t('admin.editCategory') || 'Edit Category') : (t('admin.addCategory') || 'Add Category')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editing && (
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.category.name') || 'Name'}</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="ai, data, web..."
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Lowercase letters, numbers, and hyphens only</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.category.displayName') || 'Display Name'}</label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="AI/ML, Data Processing..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.category.description') || 'Description'}</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Category description..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.category.icon') || 'Icon'}</label>
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="Icon name or URL..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.category.order') || 'Order'}</label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editing ? t('common.update') : t('common.create')}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>{t('common.cancel')}</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2">{t('common.loading') || 'Loading...'}</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>{t('admin.noCategories') || 'No categories found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left py-3 px-4">{t('admin.category.name') || 'Name'}</th>
                  <th className="text-left py-3 px-4">{t('admin.category.displayName') || 'Display Name'}</th>
                  <th className="text-left py-3 px-4">{t('admin.category.description') || 'Description'}</th>
                  <th className="text-left py-3 px-4">{t('admin.category.order') || 'Order'}</th>
                  <th className="text-left py-3 px-4">{t('admin.category.status') || 'Status'}</th>
                  <th className="text-right py-3 px-4">{t('common.actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id} className="border-t">
                    <td className="py-3 px-4 font-mono text-sm">{category.name}</td>
                    <td className="py-3 px-4">{category.displayName}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{category.description || '—'}</td>
                    <td className="py-3 px-4">{category.order}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          category.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {category.isActive ? (t('admin.active') || 'Active') : (t('admin.inactive') || 'Inactive')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(category)}
                        >
                          {category.isActive ? (t('admin.disable') || 'Disable') : (t('admin.enable') || 'Enable')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 px-4 py-3 border-t">
          <span className="text-sm text-muted-foreground">
            {t('pagination.pageInfo', {
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages
            })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              {t('pagination.prev')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => setPage(p => p + 1)}
            >
              {t('pagination.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
