import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';

/**
 * 受保护的 Admin 布局组件
 * 结合权限检查和布局
 */
const ProtectedAdminLayout = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // 加载中，显示加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  // 未登录，重定向到登录页
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 检查是否为管理员
  if (user.role !== 'admin') {
    return <Navigate to="/profile" replace />;
  }

  // 有权限，渲染布局和子路由
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedAdminLayout;
