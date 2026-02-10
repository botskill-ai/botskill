import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  AdminSidebar,
  AdminDashboard,
  AdminUsers,
  AdminSkills,
  AdminBlogs,
  AdminCategories,
  AdminRoles,
  AdminPermissions,
  AdminSettings,
  AddUserModal,
} from '@/components/admin';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAdminSkills } from '@/hooks/useAdminSkills';
import { useDashboardStats } from '@/hooks/useDashboardStats';

const AdminPage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  
  // 从路径中获取当前 tab，例如 /admin/blogs -> blogs
  const getActiveTabFromPath = (path: string) => {
    if (path === '/admin' || path === '/admin/') {
      return isAdmin ? 'dashboard' : 'skills';
    }
    const match = path.match(/^\/admin\/([^/]+)$/);
    if (match) {
      const tab = match[1];
      if (['dashboard', 'users', 'skills', 'blogs', 'categories', 'roles', 'permissions', 'settings'].includes(tab)) {
        return tab;
      }
    }
    return isAdmin ? 'dashboard' : 'skills';
  };
  
  const [activeTab, setActiveTab] = useState(() => getActiveTabFromPath(location.pathname));

  // 权限检查：只有管理员可以访问
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        toast.error('请先登录');
        navigate('/login');
        return;
      }
      if (user.role !== 'admin') {
        toast.error('权限不足，只有管理员可以访问此页面');
        navigate('/profile');
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, navigate]);

  // 当路径变化时更新 activeTab
  useEffect(() => {
    const tab = getActiveTabFromPath(location.pathname);
    setActiveTab(tab);
  }, [location.pathname, isAdmin]);
  
  // 如果访问 /admin，重定向到默认页面
  useEffect(() => {
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      const defaultPath = isAdmin ? '/admin/dashboard' : '/admin/skills';
      navigate(defaultPath, { replace: true });
    }
  }, [location.pathname, isAdmin, navigate]);

  // 如果正在加载或没有权限，不渲染内容
  if (isLoading || !isAuthenticated || !user || user.role !== 'admin') {
    return null;
  }
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', fullName: '', role: 'user' });

  const { users, loading, pagination: usersPagination, page: usersPage, setPage: setUsersPage, fetchUsers: refetchUsers, toggleUserStatus, updateUserRole, deleteUser, createUser } = useAdminUsers(activeTab === 'users');
  const { skills: dashboardSkills, approveSkill, rejectSkill } = useAdminSkills(
    activeTab === 'dashboard',
    { status: 'pending_review', limit: 5 }
  );
  const { stats, loading: statsLoading, refetch: refetchStats } = useDashboardStats(activeTab === 'dashboard');

  const handleApproveSkill = async (id: string) => {
    await approveSkill(id);
    refetchStats();
  };
  const handleRejectSkill = async (id: string) => {
    await rejectSkill(id);
    refetchStats();
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-8">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
          <div className="flex-1 min-w-0">
            {activeTab === 'dashboard' && (
              <AdminDashboard
                users={users}
                skills={dashboardSkills}
                stats={stats}
                statsLoading={statsLoading}
                onRefetchStats={refetchStats}
                onApproveSkill={id => handleApproveSkill(String(id))}
                onRejectSkill={id => handleRejectSkill(String(id))}
              />
            )}
            {activeTab === 'users' && (
              <AdminUsers
                users={users}
                loading={loading}
                pagination={usersPagination}
                page={usersPage}
                onPageChange={setUsersPage}
                onToggleStatus={toggleUserStatus}
                onUpdateRole={updateUserRole}
                onAddUser={() => setShowAddUserModal(true)}
                onDeleteUser={deleteUser}
                onUserUpdated={() => refetchUsers(usersPage)}
              />
            )}
            {activeTab === 'roles' && <AdminRoles />}
            {activeTab === 'permissions' && <AdminPermissions />}
            {activeTab === 'categories' && <AdminCategories />}
            {activeTab === 'skills' && <AdminSkills />}
            {activeTab === 'blogs' && <AdminBlogs />}
            {activeTab === 'settings' && <AdminSettings />}
          </div>
        </div>
      </main>
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        formData={newUser}
        onFormChange={setNewUser}
        onCreateUser={async (userData) => {
          const result = await createUser(userData);
          if (result.success) {
            refetchUsers(usersPage); // 刷新用户列表
          }
          return result;
        }}
      />
    </div>
  );
};

export default AdminPage;
