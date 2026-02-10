import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'publisher' | 'user';
  allowedRoles?: ('admin' | 'publisher' | 'user')[];
  redirectTo?: string;
}

/**
 * 路由保护组件
 * @param requiredRole - 必需的角色（单一角色）
 * @param allowedRoles - 允许的角色列表（多个角色）
 * @param redirectTo - 无权限时重定向的路径
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  allowedRoles,
  redirectTo = '/profile'
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // 加载中，显示加载状态或返回 null
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

  // 检查角色权限
  let hasPermission = false;
  
  if (allowedRoles && allowedRoles.length > 0) {
    // 使用允许的角色列表
    hasPermission = allowedRoles.includes(user.role as 'admin' | 'publisher' | 'user');
  } else if (requiredRole) {
    // 使用必需的角色
    hasPermission = user.role === requiredRole;
  } else {
    // 没有指定角色要求，只要登录即可
    hasPermission = true;
  }

  if (!hasPermission) {
    // 无权限，重定向
    return <Navigate to={redirectTo} replace />;
  }

  // 如果有 children，渲染 children；否则渲染 Outlet（用于嵌套路由）
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
