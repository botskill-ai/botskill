import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { roleAPI, permissionAPI } from '@/lib/api';
import { toast } from 'sonner';

interface Permission {
  _id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isActive: boolean;
}

export const AdminRoles = () => {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: '', description: '', permissionIds: [] as string[] });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        roleAPI.getAll({ limit: 50 }),
        permissionAPI.getAll({ limit: 100 })
      ]);
      setRoles(rolesRes.data.data?.roles || []);
      setPermissions(permsRes.data.data?.permissions || []);
    } catch (error) {
      toast.error(t('admin.fetchUsersError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', permissionIds: [] });
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await roleAPI.update(editing.name, { description: form.description, permissionIds: form.permissionIds });
        toast.success(t('admin.updateSuccess'));
      } else {
        await roleAPI.create({ name: form.name, description: form.description, permissionIds: form.permissionIds });
        toast.success(t('admin.createSuccess'));
      }
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (roleName: string) => {
    if (!confirm(t('admin.delete') + '?')) return;
    try {
      await roleAPI.delete(roleName);
      toast.success(t('admin.deleteSuccess'));
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error');
    }
  };

  const togglePermission = (permId: string) => {
    setForm(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter(id => id !== permId)
        : [...prev.permissionIds, permId]
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-heading">{t('admin.roles')}</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.addRole')}
        </Button>
      </div>

      {(showForm || editing) && (
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? t('admin.edit') : t('admin.addRole')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.roleName')}</label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. moderator"
                required
                disabled={!!editing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.roleDesc')}</label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.assignPermissions')}</label>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                {permissions.map(p => (
                  <label key={p._id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.permissionIds.includes(p._id)}
                      onChange={() => togglePermission(p._id)}
                      className="rounded"
                    />
                    <span className="text-sm">{p.name} ({p.resource}.{p.action})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">{t('admin.save')}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>{t('common.cancel')}</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="divide-y">
            {roles.map(role => (
              <div key={role._id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{role.name}</p>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {role.permissions?.length || 0} {t('admin.assignPermissions')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(role); setForm({ name: role.name, description: role.description || '', permissionIds: role.permissions?.map((p: any) => p._id) || [] }); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!['user', 'publisher', 'admin'].includes(role.name) && (
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(role.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
