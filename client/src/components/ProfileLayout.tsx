import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Package, Heart, BarChart3, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

const ProfileLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = () => {
    if (user.fullName) {
      return user.fullName.slice(0, 2).toUpperCase();
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return '?';
  };

  // 根据当前路径确定激活的标签
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/profile' || path === '/profile/') {
      return 'profile';
    }
    if (path === '/profile/skills') {
      return 'skills';
    }
    if (path === '/profile/favorites') {
      return 'favorites';
    }
    if (path === '/profile/analytics') {
      return 'analytics';
    }
    return 'profile';
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-card rounded-xl border p-4 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-primary w-12 h-12 rounded-full flex items-center justify-center text-primary-foreground font-medium text-lg">
                    {getInitials()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{user.username}</h3>
                  <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                </div>
              </div>

              <nav className="space-y-1">
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm ${
                    activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <User className="h-4 w-4" />
                  {t('profile.title')}
                </Link>
                <Link
                  to="/profile/skills"
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm ${
                    activeTab === 'skills' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  {t('profile.mySkills')}
                </Link>
                <Link
                  to="/profile/favorites"
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm ${
                    activeTab === 'favorites' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <Heart className="h-4 w-4" />
                  {t('profile.favorites')}
                </Link>
                {(user.role === 'publisher' || user.role === 'admin') && (
                  <Link
                    to="/profile/analytics"
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm ${
                      activeTab === 'analytics' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    {t('profile.analytics')}
                  </Link>
                )}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileLayout;
