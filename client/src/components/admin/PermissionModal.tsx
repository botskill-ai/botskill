import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { Loader2, X } from 'lucide-react';

interface Permission {
  _id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: Permission | null;
  onSave: (data: { name: string; description: string; resource: string; action: string }) => Promise<void>;
}

const ACTIONS = ['create', 'read', 'update', 'delete', 'manage'];

const INITIAL_FORM = { name: '', description: '', resource: '', action: 'read' };

export const PermissionModal = ({ isOpen, onClose, permission, onSave }: PermissionModalProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (permission) {
      setForm({
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [permission, isOpen]);

  const handleClose = () => {
    setForm(INITIAL_FORM);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.resource || !form.action) {
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      handleClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-card rounded-lg border shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {permission ? t('admin.editPermission') : t('admin.addPermission')}
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.permissionName')}</label>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. skill_create"
              required
              disabled={!!permission}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('admin.permissionNameHint', '权限名称，通常格式为：资源_操作，如 skill_create')}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.permissionDesc')}</label>
            <Input
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder={t('admin.permissionDescPlaceholder', '权限描述，说明该权限的用途')}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.resource')}</label>
              <Input
                value={form.resource}
                onChange={e => setForm({ ...form, resource: e.target.value })}
                placeholder="e.g. skill, user, category"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.resourceHint', '资源类型，如：skill（技能）、user（用户）、category（分类）')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.action')}</label>
              <select
                value={form.action}
                onChange={e => setForm({ ...form, action: e.target.value })}
                className="w-full border rounded-md px-3 py-2 bg-background text-sm"
                required
              >
                {ACTIONS.map(a => (
                  <option key={a} value={a}>{t(`admin.actionLabels.${a}`, a)}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.actionHint', '操作类型：create（创建）、read（读取）、update（更新）、delete（删除）、manage（管理）')}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.saving', '保存中...')}
                </>
              ) : (
                permission ? t('common.update') : t('common.create')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
