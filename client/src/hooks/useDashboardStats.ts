import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '@/lib/api';
import { toast } from 'sonner';

export interface DashboardStats {
  totalUsers: number;
  totalSkills: number;
  publishedSkills: number;
  pendingSkills: number;
  totalDownloads: number;
  activeToday: number;
}

export const useDashboardStats = (fetchWhenActive: boolean) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getDashboardStats(forceRefresh);
      const data = res.data?.data || res.data;
      setStats(data?.stats || null);
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      const msg = err.response?.data?.error || t('admin.fetchStatsError', '获取统计失败');
      setError(msg);
      toast.error(msg);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (fetchWhenActive) fetchStats();
  }, [fetchWhenActive, fetchStats]);

  return { stats, loading, error, refetch: () => fetchStats(true) };
};
