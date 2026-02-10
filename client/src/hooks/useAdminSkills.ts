import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { skillAdminAPI, skillAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AdminSkillVersion {
  version: string;
  description: string;
  content?: string;
  tags?: string[];
  createdAt?: string;
}

export interface AdminSkill {
  _id: string;
  name: string;
  description: string;
  version?: string;
  category: string;
  tags?: string[];
  downloads?: number;
  status: string;
  author?: { _id: string; username: string; fullName?: string; email?: string };
  createdAt?: string;
  lastUpdated?: string;
  versions?: AdminSkillVersion[];
  repositoryUrl?: string;
  documentationUrl?: string;
  demoUrl?: string;
}

export interface AdminSkillsPagination {
  currentPage: number;
  totalPages: number;
  totalSkills: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const useAdminSkills = (
  fetchWhenActive: boolean,
  params?: { page?: number; limit?: number; status?: string; category?: string; q?: string }
) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [skills, setSkills] = useState<AdminSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<AdminSkillsPagination>({
    currentPage: 1,
    totalPages: 0,
    totalSkills: 0,
    hasNext: false,
    hasPrev: false,
  });

  // 使用 useMemo 稳定 params 的值，避免不必要的重新创建
  const stableParams = useMemo(() => ({
    page: params?.page ?? undefined,
    limit: params?.limit ?? undefined,
    status: params?.status ?? undefined,
    category: params?.category ?? undefined,
    q: params?.q ?? undefined,
  }), [params?.page, params?.limit, params?.status, params?.category, params?.q]);

  // 使用 useRef 存储 t 函数，避免依赖变化
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  // 使用 useRef 防止重复请求
  const fetchingRef = useRef(false);

  const fetchSkills = useCallback(async (fetchParams?: typeof params) => {
    // 防止重复请求
    if (fetchingRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      const p = fetchParams || stableParams;
      if (isAdmin) {
        const res = await skillAdminAPI.getAll(p);
        const data = res.data;
        setSkills(data.skills || []);
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 0,
          totalSkills: 0,
          hasNext: false,
          hasPrev: false,
        });
      } else {
        const res = await skillAPI.getMySkills({
          page: p?.page,
          limit: p?.limit,
          status: p?.status,
          category: p?.category,
          q: p?.q,
        });
        const data = res.data;
        const list = data.skills || data.data?.skills || [];
        setSkills(list);
        const pag = data.pagination || data.data?.pagination || {};
        setPagination({
          currentPage: pag.currentPage || 1,
          totalPages: pag.totalPages || 0,
          totalSkills: pag.totalSkills || list.length,
          hasNext: pag.hasNext ?? false,
          hasPrev: pag.hasPrev ?? false,
        });
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast.error(tRef.current('admin.fetchSkillsError') || 'Error fetching skills');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [isAdmin, stableParams]);

  useEffect(() => {
    if (fetchWhenActive) {
      fetchSkills();
    }
  }, [fetchWhenActive, fetchSkills]);

  const updateSkillStatus = useCallback(async (skillId: string, status: string) => {
    try {
      if (status === 'published' || status === 'archived') {
        if (!isAdmin) {
          toast.error(tRef.current('admin.adminOnly', '仅管理员可审核发布'));
          return false;
        }
        await skillAdminAPI.update(skillId, { status });
      } else {
        await skillAdminAPI.update(skillId, { status });
      }
      setSkills(prev => prev.map(s => (s._id === skillId ? { ...s, status } : s)));
      toast.success(tRef.current('admin.updateSuccess'));
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error');
      return false;
    }
  }, [isAdmin]);

  const createSkill = useCallback(async (data: {
    name: string;
    description: string;
    version?: string;
    category: string;
    tags?: string[];
    license?: string;
    repositoryUrl?: string;
    documentationUrl?: string;
    demoUrl?: string;
    status?: string;
    content?: string;
    overwrite?: boolean;
  }) => {
    try {
      const res = await skillAdminAPI.create(data);
      await fetchSkills();
      const msg = res.data?.message || tRef.current('admin.createSuccess');
      toast.success(msg);
      return { ok: true as const };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const apiError = err?.response?.data?.error;
      if (apiError === 'VERSION_EXISTS') {
        return { ok: false as const, error: 'VERSION_EXISTS' };
      }
      toast.error(apiError || (err?.response?.data as { message?: string })?.message || 'Error creating skill');
      return { ok: false as const, error: apiError };
    }
  }, [fetchSkills]);

  const updateSkill = useCallback(async (skillId: string, data: Record<string, unknown>) => {
    try {
      const res = await skillAdminAPI.update(skillId, data);
      const updated = res.data?.skill;
      if (updated) {
        setSkills(prev => prev.map(s => (s._id === skillId ? { ...s, ...updated } : s)));
      } else {
        await fetchSkills();
      }
      toast.success(tRef.current('admin.updateSuccess'));
      return true;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || 'Error updating skill');
      return false;
    }
  }, [fetchSkills]);

  const deleteSkill = useCallback(async (skillId: string) => {
    try {
      const api = isAdmin ? skillAdminAPI : skillAPI;
      await api.delete(skillId);
      setSkills(prev => prev.filter(s => s._id !== skillId));
      toast.success(tRef.current('admin.deleteSuccess'));
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error');
      return false;
    }
  }, [isAdmin]);

  const approveSkill = useCallback((skillId: string) => updateSkillStatus(skillId, 'published'), [updateSkillStatus]);
  const rejectSkill = useCallback((skillId: string) => updateSkillStatus(skillId, 'archived'), [updateSkillStatus]);

  return {
    skills,
    loading,
    pagination,
    fetchSkills,
    createSkill,
    updateSkill,
    updateSkillStatus,
    deleteSkill,
    approveSkill,
    rejectSkill,
  };
};
