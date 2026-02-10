import { Users, Package, Download, BarChart3, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { StatCard } from './StatCard';
import type { AdminUser } from '@/hooks/useAdminUsers';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface Skill {
  _id: string;
  name: string;
  author?: { username?: string; fullName?: string };
  status: string;
}

interface AdminDashboardProps {
  users: AdminUser[];
  skills: Skill[];
  stats: DashboardStats | null;
  statsLoading?: boolean;
  onRefetchStats?: () => void;
  onApproveSkill: (id: string) => void;
  onRejectSkill: (id: string) => void;
}

export const AdminDashboard = ({
  users,
  skills,
  stats,
  statsLoading = false,
  onRefetchStats,
  onApproveSkill,
  onRejectSkill,
}: AdminDashboardProps) => {
  const { t } = useTranslation();
  const pendingSkills = skills.filter(s => s.status === 'pending_review');

  const formatStat = (value: number | undefined) =>
    value !== undefined && value !== null ? value.toLocaleString() : '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading">{t('admin.dashboard')}</h1>
        {onRefetchStats && (
          <Button variant="outline" size="sm" onClick={onRefetchStats} disabled={statsLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${statsLoading ? 'animate-spin' : ''}`} />
            {t('admin.refreshStats', '刷新统计')}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {statsLoading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <StatCard icon={Users} label={t('admin.totalUsers')} value={formatStat(stats?.totalUsers)} />
            <StatCard icon={Package} label={t('admin.totalSkills')} value={formatStat(stats?.totalSkills)} />
            <StatCard icon={Download} label={t('admin.totalDownloads')} value={formatStat(stats?.totalDownloads)} />
            <StatCard icon={BarChart3} label={t('admin.activeToday')} value={formatStat(stats?.activeToday)} />
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">{t('admin.recentUsers')}</h2>
          <div className="space-y-4">
            {users.slice(0, 3).map(user => (
              <div key={user.id || user._id} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                  {user.joinDate || user.createdAt}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">{t('admin.pendingSkills')}</h2>
          <div className="space-y-4">
            {pendingSkills.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">—</p>
            ) : (
              pendingSkills.map(skill => (
                <div key={skill._id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{skill.name}</p>
                    <p className="text-sm text-muted-foreground">{t('skills.author')}: {skill.author?.username || skill.author?.fullName || '—'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onApproveSkill(skill._id)}>
                      {t('admin.approve')}
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => onRejectSkill(skill._id)}>
                      {t('admin.reject')}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
