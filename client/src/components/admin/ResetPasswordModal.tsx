import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { userAPI } from '@/lib/api';
import { toast } from 'sonner';
import type { AdminUser } from '@/hooks/useAdminUsers';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
}

export const ResetPasswordModal = ({ isOpen, onClose, user }: ResetPasswordModalProps) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const id = user._id ?? user.id;
    if (!id) return;
    if (password.length < 8) {
      toast.error(t('auth.register.passwordRequirement'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('auth.register.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await userAPI.resetUserPassword(String(id), password);
      toast.success(t('admin.passwordResetSuccess'));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('admin.passwordResetError'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-lg border p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">{t('admin.resetPassword')}</h2>
        {user && (
          <p className="text-sm text-muted-foreground mb-4">
            {t('admin.resetPasswordFor')}: <strong>{user.username}</strong>
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.newPassword')}</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder={t('auth.register.passwordRequirement')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.register.confirmPassword')}</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={loading}>{loading ? t('common.loading') : t('admin.resetPassword')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
