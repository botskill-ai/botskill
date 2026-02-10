import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI } from '@/lib/api';
import { toast } from 'sonner';

export interface AdminUser {
  id?: number | string;
  _id?: string;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  role: string;
  isActive?: boolean;
  status?: string;
  skillsCount?: number;
  downloads?: number;
  createdAt?: string;
  joinDate?: string;
}

export const useAdminUsers = (fetchWhenActive: boolean) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalUsers?: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);

  const fetchUsers = useCallback(async (pageNum: number = page) => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers({ page: pageNum, limit: 10 });
      const usersData = response.data.success !== undefined
        ? response.data.data?.users || []
        : response.data.users || [];
      setUsers(usersData);
      setPagination(response.data.data?.pagination || response.data.pagination || null);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(t('admin.fetchUsersError') || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  }, [t, page]);

  useEffect(() => {
    if (fetchWhenActive) fetchUsers(page);
  }, [fetchWhenActive, fetchUsers, page]);

  const updateUserRole = useCallback(async (userId: string | number, role: string) => {
    try {
      await userAPI.updateUserRole(String(userId), role);
      setUsers(prev => prev.map(u =>
        (u.id || u._id) === userId ? { ...u, role } : u
      ));
      toast.success(t('admin.userStatusUpdated') || 'Role updated successfully');
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error(error.response?.data?.error || 'Error updating role');
    }
  }, [t]);

  const toggleUserStatus = useCallback(async (userId: string | number) => {
    const user = users.find(u => (u.id || u._id) === userId);
    if (!user) return;
    const isActive = user.isActive ?? user.status === 'active';
    const newActive = !isActive;
    try {
      await userAPI.updateUserStatus(String(userId), newActive);
      setUsers(prev => prev.map(u =>
        (u.id || u._id) === userId ? { ...u, isActive: newActive, status: newActive ? 'active' : 'inactive' } : u
      ));
      toast.success(t('admin.userStatusUpdated') || 'User status updated successfully!');
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(t('admin.userStatusUpdateError') || 'Error updating user status');
    }
  }, [users, t]);

  const deleteUser = useCallback(async (userId: string | number) => {
    try {
      await userAPI.deleteUser(String(userId));
      setUsers(prev => prev.filter(u => (u.id || u._id) !== userId));
      toast.success(t('admin.userDeleteSuccess'));
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('admin.userDeleteError'));
      return false;
    }
  }, [t]);

  const createUser = useCallback(async (userData: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    role?: string;
  }) => {
    try {
      const response = await userAPI.createUser(userData);
      const newUser = response.data.success !== undefined
        ? response.data.data?.user
        : response.data.user;
      
      if (newUser) {
        // 刷新当前页面的用户列表
        fetchUsers(page);
        toast.success(t('admin.userCreateSuccess') || 'User created successfully');
        return { success: true, user: newUser };
      }
      return { success: false };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.details?.[0] || t('admin.userCreateError') || 'Error creating user';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [t]);

  return { users, loading, pagination, page, setPage, fetchUsers, toggleUserStatus, updateUserRole, deleteUser, createUser };
};
