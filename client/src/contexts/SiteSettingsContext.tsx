import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { siteSettingsAPI } from '@/lib/api';

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  maintenanceMode: boolean;
}

const DEFAULT: SiteSettings = {
  siteTitle: 'BotSkill - AI 技能市场',
  siteDescription: '连接开发者与智能技能的桥梁，让技术更易用',
  maintenanceMode: false,
};

const SiteSettingsContext = createContext<SiteSettings>(DEFAULT);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT);

  useEffect(() => {
    siteSettingsAPI.get()
      .then(res => {
        const data = res.data?.data || res.data;
        if (data) {
          setSettings({
            siteTitle: data.siteTitle ?? DEFAULT.siteTitle,
            siteDescription: data.siteDescription ?? DEFAULT.siteDescription,
            maintenanceMode: data.maintenanceMode ?? DEFAULT.maintenanceMode,
          });
        }
      })
      .catch(() => { /* 使用默认值 */ });
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
