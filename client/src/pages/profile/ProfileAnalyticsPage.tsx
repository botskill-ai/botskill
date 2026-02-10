import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Package, Calendar, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { skillAPI } from '@/lib/api';

const ProfileAnalyticsPage = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [analyticsSkills, setAnalyticsSkills] = useState<any[]>([]);
  const [userData, setUserData] = useState({ joinDate: '' });

  useEffect(() => {
    if (user) {
      const joinDate = user.joinDate
        ? new Date(user.joinDate).toISOString().split('T')[0]
        : user.createdAt
          ? new Date(user.createdAt).toISOString().split('T')[0]
          : '';
      setUserData({ joinDate });
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'publisher' || user?.role === 'admin')) {
      skillAPI.getMySkills({ page: 1, limit: 50 }).then((res) => {
        const list = res.data?.skills || res.data?.data?.skills || [];
        setAnalyticsSkills(list);
      }).catch(() => setAnalyticsSkills([]));
    }
  }, [isAuthenticated, user?.role]);

  const chartSkills = analyticsSkills;
  const chartTotalDownloads = chartSkills.reduce((sum, s) => sum + (s.downloads || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold font-heading mb-6">{t('profile.analytics')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('profile.totalDownloads')}</p>
              <p className="text-2xl font-bold">{chartTotalDownloads.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('profile.skillCount')}</p>
              <p className="text-2xl font-bold">{chartSkills.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('profile.joinDate')}</p>
              <p className="text-2xl font-bold">{userData.joinDate || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-xl font-bold font-heading mb-4">{t('profile.trend')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t('profile.trendDesc', '各技能下载量分布（按下载量排序）')}</p>
        {(() => {
          const sortedForChart = [...chartSkills]
            .filter((s) => (s.downloads || 0) > 0)
            .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
            .slice(0, 12);
          const maxDownloads = Math.max(...sortedForChart.map((s) => s.downloads || 0), 1);
          if (sortedForChart.length === 0) {
            return (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mb-3 opacity-40" />
                <p>{t('profile.noDownloadData', '暂无下载数据')}</p>
                <p className="text-xs mt-1">{t('profile.publishToSeeData', '发布技能并获得下载后即可查看')}</p>
              </div>
            );
          }
          return (
            <div className="space-y-3 min-h-[280px]">
              {sortedForChart.map((skill) => {
                const dls = skill.downloads || 0;
                const pct = maxDownloads > 0 ? (dls / maxDownloads) * 100 : 0;
                return (
                  <div key={skill._id} className="flex items-center gap-3">
                    <Link
                      to={`/skills/${skill._id}`}
                      className="w-32 sm:w-40 shrink-0 truncate text-sm font-medium hover:text-primary hover:underline"
                      title={skill.name}
                    >
                      {skill.name}
                    </Link>
                    <div className="flex-1 min-w-0 h-8 bg-muted rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-primary/80 rounded-lg transition-all duration-500 min-w-[4px]"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <div className="w-16 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                      {dls.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ProfileAnalyticsPage;
