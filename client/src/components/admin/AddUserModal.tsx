import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: { username: string; email: string; password: string; fullName: string; role: string };
  onFormChange: (data: AddUserModalProps['formData']) => void;
  onCreateUser: (userData: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    role?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const INITIAL_FORM = { username: '', email: '', password: '', fullName: '', role: 'user' };

export const AddUserModal = ({ isOpen, onClose, formData, onFormChange, onCreateUser }: AddUserModalProps) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    onFormChange(INITIAL_FORM);
    onClose();
  };

  const handleSave = async () => {
    // 验证必填字段
    if (!formData.username || !formData.email || !formData.password) {
      toast.error(t('admin.userRequiredFields') || 'Username, email, and password are required');
      return;
    }

    // 验证密码长度
    if (formData.password.length < 8) {
      toast.error(t('auth.register.passwordMinLength') || 'Password must be at least 8 characters long');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(t('auth.register.invalidEmail') || 'Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const result = await onCreateUser({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim() || undefined,
        role: formData.role || 'user'
      });

      if (result.success) {
        handleClose();
      }
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-4">{t('admin.addUser')}</h2>
        <div className="space-y-4">
          {[
            { key: 'username', type: 'text', labelKey: 'admin.user.username' },
            { key: 'email', type: 'email', labelKey: 'profile.email' },
            { key: 'password', type: 'password', labelKey: 'auth.register.password' },
            { key: 'fullName', type: 'text', labelKey: 'profile.fullName' },
          ].map(({ key, type, labelKey }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{t(labelKey)}</label>
              <Input
                type={type}
                value={formData[key as keyof typeof formData]}
                onChange={e => onFormChange({ ...formData, [key]: e.target.value })}
                placeholder={t(labelKey)}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.user.role')}</label>
            <select
              value={formData.role}
              onChange={e => onFormChange({ ...formData, role: e.target.value })}
              className="w-full border rounded-md px-3 py-2 bg-background text-sm"
            >
              <option value="user">{t('admin.role.user')}</option>
              <option value="publisher">{t('admin.role.publisher')}</option>
              <option value="admin">{t('admin.role.admin')}</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.saving', '保存中...')}
              </>
            ) : (
              t('common.save')
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;

