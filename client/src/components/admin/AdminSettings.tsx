import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';
import { settingsAPI } from '@/lib/api';
import { toast } from 'sonner';

export interface SystemSettings {
  siteTitle: string;
  siteDescription: string;
  require2FA: boolean;
  enableEmailVerification: boolean;
  maxFileSize: number;
  allowedFileTypes: string;
  maintenanceMode: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  siteTitle: 'BotSkill - AI 技能市场',
  siteDescription: '连接开发者与智能技能的桥梁，让技术更易用',
  require2FA: false,
  enableEmailVerification: false,
  maxFileSize: 50,
  allowedFileTypes: '.zip,.tar.gz,.js,.ts,.json',
  maintenanceMode: false,
};

export const AdminSettings = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsAPI.get();
      const data = res.data?.data || res.data;
      if (data) {
        setSettings({
          siteTitle: data.siteTitle ?? DEFAULT_SETTINGS.siteTitle,
          siteDescription: data.siteDescription ?? DEFAULT_SETTINGS.siteDescription,
          require2FA: data.require2FA ?? DEFAULT_SETTINGS.require2FA,
          enableEmailVerification: data.enableEmailVerification ?? DEFAULT_SETTINGS.enableEmailVerification,
          maxFileSize: data.maxFileSize ?? DEFAULT_SETTINGS.maxFileSize,
          allowedFileTypes: data.allowedFileTypes ?? DEFAULT_SETTINGS.allowedFileTypes,
          maintenanceMode: data.maintenanceMode ?? DEFAULT_SETTINGS.maintenanceMode,
        });
      }
    } catch (error: unknown) {
      toast.error(t('admin.fetchSettingsError') || 'Failed to load settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsAPI.update(settings);
      toast.success(t('admin.updateSuccess') || 'Settings saved successfully');
    } catch (error: unknown) {
      toast.error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-heading mb-6">{t('admin.settings')}</h1>
        <div className="bg-card rounded-lg border p-8 flex justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-heading">{t('admin.settings')}</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (t('common.loading') || 'Saving...') : (t('admin.save') || 'Save')}
        </Button>
      </div>
      <div className="bg-card rounded-lg border p-6 space-y-8">
        {/* 站点设置 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('admin.siteSettings')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.siteTitle')}</label>
              <Input
                value={settings.siteTitle}
                onChange={e => updateField('siteTitle', e.target.value)}
                placeholder="BotSkill - AI 技能市场"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.siteDescription')}</label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={settings.siteDescription}
                onChange={e => updateField('siteDescription', e.target.value)}
                placeholder="连接开发者与智能技能的桥梁，让技术更易用"
              />
            </div>
          </div>
        </div>

        {/* 安全设置 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('admin.securitySettings')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">{t('admin.require2FA')}</p>
                <p className="text-sm text-muted-foreground">{t('admin.require2FADesc')}</p>
              </div>
              <Switch
                checked={settings.require2FA}
                onCheckedChange={checked => updateField('require2FA', checked)}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">{t('admin.enableEmailVerification')}</p>
                <p className="text-sm text-muted-foreground">{t('admin.enableEmailVerificationDesc')}</p>
              </div>
              <Switch
                checked={settings.enableEmailVerification}
                onCheckedChange={checked => updateField('enableEmailVerification', checked)}
              />
            </div>
          </div>
        </div>

        {/* 上传设置 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('admin.uploadSettings')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.maxFileSize')}</label>
              <Input
                type="number"
                value={settings.maxFileSize}
                onChange={e => {
                  const v = parseInt(e.target.value, 10);
                  updateField('maxFileSize', isNaN(v) ? 50 : Math.max(1, Math.min(500, v)));
                }}
                min={1}
                max={500}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.allowedFileTypes')}</label>
              <Input
                value={settings.allowedFileTypes}
                onChange={e => updateField('allowedFileTypes', e.target.value)}
                placeholder=".zip,.tar.gz,.js,.ts,.json"
              />
            </div>
          </div>
        </div>

        {/* 维护模式 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('admin.maintenanceMode')}</h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium">{t('admin.siteMaintenance')}</p>
              <p className="text-sm text-muted-foreground">{t('admin.siteMaintenanceDesc')}</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={checked => updateField('maintenanceMode', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
