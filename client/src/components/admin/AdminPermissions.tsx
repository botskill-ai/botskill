import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { permissionAPI } from '@/lib/api';
import { TruncateWithTooltip } from '@/components/ui/truncate-with-tooltip';
import { PermissionModal } from './PermissionModal';
import { toast } from 'sonner';

interface Permission {
  _id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export const AdminPermissions = () => {
  const { t } = useTranslation();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalPermissions?: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  const fetchPermissions = async (pageNum: number = page) => {
    try {
      setLoading(true);
      const res = await permissionAPI.getAll({ page: pageNum, limit: 10 });
      setPermissions(res.data.data?.permissions || []);
      setPagination(res.data.data?.pagination || null);
    } catch (error) {
      toast.error(t('admin.fetchUsersError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions(page);
  }, [page]);

  const handleOpenModal = (permission?: Permission) => {
    setEditingPermission(permission || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPermission(null);
  };

  const handleSave = async (data: { name: string; description: string; resource: string; action: string }) => {
    try {
      if (editingPermission) {
        await permissionAPI.update(editingPermission._id, {
          description: data.description,
          resource: data.resource,
          action: data.action
        });
        toast.success(t('admin.updateSuccess'));
      } else {
        await permissionAPI.create(data);
        toast.success(t('admin.createSuccess'));
      }
      fetchPermissions(page);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error');
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.delete') + '?')) return;
    try {
      await permissionAPI.delete(id);
      toast.success(t('admin.deleteSuccess'));
      fetchPermissions(page);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-heading">{t('admin.permissions')}</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.addPermission')}
        </Button>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <colgroup>
                <col style={{ width: 160 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 240 }} />
                <col style={{ width: 130 }} />
              </colgroup>
              <thead className="bg-muted">
                <tr>
                  <th className="text-left py-3 px-4">{t('admin.permissionName')}</th>
                  <th className="text-left py-3 px-4">{t('admin.resource')}</th>
                  <th className="text-left py-3 px-4">{t('admin.action')}</th>
                  <th className="text-left py-3 px-4">{t('admin.permissionDesc')}</th>
                  <th className="text-center py-3 px-4">{t('common.actions')}</th>
                </tr>
              </thead>
            <tbody>
              {permissions.map(p => (
                <tr key={p._id} className="border-t">
                  <td className="py-3 px-4 font-medium overflow-hidden min-w-0">
                    <TruncateWithTooltip content={p.name}>{p.name}</TruncateWithTooltip>
                  </td>
                  <td className="py-3 px-4">{p.resource}</td>
                  <td className="py-3 px-4">{p.action}</td>
                  <td className="py-3 px-4 overflow-hidden min-w-0">
                    <TruncateWithTooltip content={p.description}>{p.description}</TruncateWithTooltip>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(p._id)}>
                        <Trash2 className="h-4 w-4" />
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

      <PermissionModal
        isOpen={showModal}
        onClose={handleCloseModal}
        permission={editingPermission}
        onSave={handleSave}
      />
    </div>
  );
};
