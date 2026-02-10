import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { userAPI } from '@/lib/api';
import { toast } from 'sonner';
import type { AdminUser } from '@/hooks/useAdminUsers';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onSuccess: () => void;
}

export const EditUserModal = ({ isOpen, onClose, user, onSuccess }: EditUserModalProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ username: '', email: '', fullName: '', bio: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        email: user.email || '',
        fullName: (user as any).fullName || '',
        bio: (user as any).bio || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const id = user._id ?? user.id;
    if (!id) return;
    setLoading(true);
    try {
      await userAPI.updateUserForAdmin(String(id), form);
      toast.success(t('admin.userUpdateSuccess'));
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('admin.userUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-lg border p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">{t('admin.editUser')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.user.username')}</label>
            <Input
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              minLength={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.email')}</label>
            <Input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.fullName')}</label>
            <Input
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.bio')}</label>
            <Input
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder={t('profile.bio')}
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={loading}>{loading ? t('common.loading') : t('admin.save')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
