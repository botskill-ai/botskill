import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api';

const ProfileInfoPage = () => {
  const { t } = useTranslation();
  const { user, fetchCurrentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    fullName: '',
    bio: '',
    avatar: '',
    joinDate: '',
  });

  useEffect(() => {
    if (user) {
      const joinDate = user.joinDate
        ? new Date(user.joinDate).toISOString().split('T')[0]
        : user.createdAt
          ? new Date(user.createdAt).toISOString().split('T')[0]
          : '';
      setUserData({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        joinDate,
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    const userId = user?.id || (user as any)?._id;
    if (!userId) return;
    setSaving(true);
    try {
      await userAPI.updateUser(userId, {
        fullName: userData.fullName,
        bio: userData.bio,
        avatar: userData.avatar || undefined,
      });
      toast.success(t('profile.saveSuccess', '保存成功'));
      await fetchCurrentUser();
    } catch (err: any) {
      const msg = err.response?.data?.error || t('profile.saveFailed', '保存失败');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (userData.fullName) {
      return userData.fullName.slice(0, 2).toUpperCase();
    }
    if (userData.username) {
      return userData.username.slice(0, 2).toUpperCase();
    }
    return '?';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold font-heading mb-6">{t('profile.title')}</h1>

      <div className="bg-card rounded-xl border p-6">
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex flex-col items-center">
            {userData.avatar ? (
              <img
                src={userData.avatar}
                alt=""
                className="w-24 h-24 rounded-full object-cover mb-4"
              />
            ) : (
              <div className="bg-primary w-24 h-24 rounded-full flex items-center justify-center text-primary-foreground font-medium text-2xl mb-4">
                {getInitials()}
              </div>
            )}
            <Input
              placeholder={t('profile.avatarUrl', '头像 URL')}
              value={userData.avatar}
              onChange={(e) => setUserData({ ...userData, avatar: e.target.value })}
              className="w-full max-w-[200px] text-sm"
            />
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('profile.username')}</label>
              <Input value={userData.username} disabled className="bg-muted" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('profile.email')}</label>
              <Input type="email" value={userData.email} disabled className="bg-muted" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('profile.fullName')}</label>
              <Input
                value={userData.fullName}
                onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('profile.joinDate')}</label>
              <Input value={userData.joinDate} disabled className="bg-muted" />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">{t('profile.bio')}</label>
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={userData.bio}
            onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
            maxLength={200}
            placeholder={t('profile.bioPlaceholder', '介绍一下自己...')}
          />
          <p className="text-xs text-muted-foreground mt-1">{userData.bio.length}/200</p>
        </div>

        <Button onClick={handleSaveProfile} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('common.saving', '保存中...')}
            </>
          ) : (
            t('profile.saveChanges')
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProfileInfoPage;
