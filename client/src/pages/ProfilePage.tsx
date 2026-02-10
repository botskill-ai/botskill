import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { User, Calendar, Download, Upload, Package, Heart, BarChart3, Loader2, Star, Search, Pencil, ChevronDown, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI, skillAPI, skillAdminAPI } from '@/lib/api';
import { AddSkillModal } from '@/components/admin';

const ProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, fetchCurrentUser } = useAuth();
  
  // 从 URL 参数获取 tab，如果没有则默认为 'profile'
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'profile');
  
  // 当 URL 参数变化时更新 activeTab
  useEffect(() => {
    if (tabFromUrl && ['profile', 'skills', 'analytics', 'favorites'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    fullName: '',
    bio: '',
    avatar: '',
    joinDate: '',
  });
  const [skills, setSkills] = useState<any[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsPagination, setSkillsPagination] = useState({ currentPage: 1, totalPages: 0, totalSkills: 0 });
  const [skillsSearch, setSkillsSearch] = useState('');
  const [skillsCategory, setSkillsCategory] = useState('');
  const [skillsStatus, setSkillsStatus] = useState('');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [analyticsSkills, setAnalyticsSkills] = useState<any[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishMode, setPublishMode] = useState<'upload' | 'url'>('upload');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    if (user) {
      const joinDate = user.joinDate
        ? new Date(user.joinDate).toISOString().split('T')[0]
        : user.createdAt
          ? new Date(user.createdAt).toISOString().split('T')[0]
          : '';
      setUserData({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        joinDate,
      });
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (activeTab === 'favorites' && isAuthenticated) {
      setFavoritesLoading(true);
      userAPI
        .getFavorites()
        .then((res) => {
          const list = res.data?.data?.skills || res.data?.skills || [];
          setFavorites(list);
        })
        .catch(() => {
          setFavorites([]);
          toast.error(t('skills.fetchError', '获取收藏失败'));
        })
        .finally(() => setFavoritesLoading(false));
    }
  }, [activeTab, isAuthenticated, t]);

  const [skillsPage, setSkillsPage] = useState(1);

  const fetchMySkills = useCallback(
    (page = 1) => {
      if (!isAuthenticated || (user?.role !== 'publisher' && user?.role !== 'admin')) return;
      setSkillsLoading(true);
      const params: Record<string, string | number> = { page, limit: 12 };
      if (skillsSearch.trim()) params.q = skillsSearch.trim();
      if (skillsCategory) params.category = skillsCategory;
      if (skillsStatus) params.status = skillsStatus;
      skillAPI
        .getMySkills(params)
        .then((res) => {
          const data = res.data;
          const list = data.skills || data.data?.skills || [];
          setSkills(list);
          const pag = data.pagination || data.data?.pagination || {};
          setSkillsPagination({
            currentPage: pag.currentPage || 1,
            totalPages: pag.totalPages || 0,
            totalSkills: pag.totalSkills || list.length,
          });
        })
        .catch(() => {
          setSkills([]);
          toast.error(t('skills.fetchError', '获取技能失败'));
        })
        .finally(() => setSkillsLoading(false));
    },
    [isAuthenticated, user?.role, skillsSearch, skillsCategory, skillsStatus, t]
  );

  useEffect(() => {
    if ((activeTab === 'skills' || activeTab === 'analytics') && isAuthenticated && (user?.role === 'publisher' || user?.role === 'admin')) {
      fetchMySkills(skillsPage);
    }
  }, [activeTab, isAuthenticated, user?.role, skillsPage, fetchMySkills]);

  useEffect(() => {
    if (activeTab === 'analytics' && isAuthenticated && (user?.role === 'publisher' || user?.role === 'admin')) {
      skillAPI.getMySkills({ page: 1, limit: 50 }).then((res) => {
        const list = res.data?.skills || res.data?.data?.skills || [];
        setAnalyticsSkills(list);
      }).catch(() => setAnalyticsSkills([]));
    } else {
      setAnalyticsSkills([]);
    }
  }, [activeTab, isAuthenticated, user?.role]);

  const handleSaveProfile = async () => {
    const userId = user?.id || (user as any)?._id;
    if (!userId) return;
    setSaving(true);
    try {
      await userAPI.updateUser(userId, {
        fullName: userData.fullName,
        bio: userData.bio,
        avatar: userData.avatar || undefined,
      });
      toast.success(t('profile.saveSuccess', '保存成功'));
      await fetchCurrentUser();
    } catch (err: any) {
      const msg = err.response?.data?.error || t('profile.saveFailed', '保存失败');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (userData.fullName) {
      return userData.fullName.slice(0, 2).toUpperCase();
    }
    if (userData.username) {
      return userData.username.slice(0, 2).toUpperCase();
    }
    return '?';
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8 px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-card rounded-xl border p-4 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                {userData.avatar ? (
                  <img
                    src={userData.avatar}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-primary w-12 h-12 rounded-full flex items-center justify-center text-primary-foreground font-medium text-lg">
                    {getInitials()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{userData.username}</h3>
                  <p className="text-xs text-muted-foreground truncate">@{userData.username}</p>
                </div>
              </div>

              <nav className="space-y-1">
                <button
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm ${
                    activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => {
                    setActiveTab('profile');
                    setSearchParams({}, { replace: true });
                  }}
                >
                  <User className="h-4 w-4" />
                  {t('profile.title')}
                </button>
                <button
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm ${
                    activeTab === 'skills' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => {
                    setActiveTab('skills');
                    setSearchParams({ tab: 'skills' }, { replace: true });
                  }}
                >
                  <Package className="h-4 w-4" />
                  {t('profile.mySkills')}
                </button>
                <button
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm ${
                    activeTab === 'favorites' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => {
                    setActiveTab('favorites');
                    setSearchParams({ tab: 'favorites' }, { replace: true });
                  }}
                >
                  <Heart className="h-4 w-4" />
                  {t('profile.favorites')}
                </button>
                <button
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm ${
                    activeTab === 'analytics' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => {
                    setActiveTab('analytics');
                    setSearchParams({ tab: 'analytics' }, { replace: true });
                  }}
                >
                  <BarChart3 className="h-4 w-4" />
                  {t('profile.analytics')}
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div>
                <h1 className="text-2xl font-bold font-heading mb-6">{t('profile.title')}</h1>

                <div className="bg-card rounded-xl border p-6">
                  <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="flex flex-col items-center">
                      {userData.avatar ? (
                        <img
                          src={userData.avatar}
                          alt=""
                          className="w-24 h-24 rounded-full object-cover mb-4"
                        />
                      ) : (
                        <div className="bg-primary w-24 h-24 rounded-full flex items-center justify-center text-primary-foreground font-medium text-2xl mb-4">
                          {getInitials()}
                        </div>
                      )}
                      <Input
                        placeholder={t('profile.avatarUrl', '头像 URL')}
                        value={userData.avatar}
                        onChange={(e) => setUserData({ ...userData, avatar: e.target.value })}
                        className="w-full max-w-[200px] text-sm"
                      />
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('profile.username')}</label>
                        <Input value={userData.username} disabled className="bg-muted" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('profile.email')}</label>
                        <Input type="email" value={userData.email} disabled className="bg-muted" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('profile.fullName')}</label>
                        <Input
                          value={userData.fullName}
                          onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('profile.joinDate')}</label>
                        <Input value={userData.joinDate} disabled className="bg-muted" />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">{t('profile.bio')}</label>
                    <textarea
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={userData.bio}
                      onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                      maxLength={200}
                      placeholder={t('profile.bioPlaceholder', '介绍一下自己...')}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{userData.bio.length}/200</p>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('common.saving', '保存中...')}
                      </>
                    ) : (
                      t('profile.saveChanges')
                    )}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h1 className="text-2xl font-bold font-heading">{t('profile.mySkills')}</h1>
                  {(user?.role === 'publisher' || user?.role === 'admin') && (
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <Button>
                          <Upload className="h-4 w-4 mr-2" />
                          {t('home.publishSkill')}
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content className="min-w-[200px] bg-card border rounded-md shadow-lg p-1 z-50">
                        <DropdownMenu.Item
                          className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer outline-none hover:bg-muted"
                          onSelect={() => { setPublishMode('upload'); setShowPublishModal(true); }}
                        >
                          <Upload className="h-4 w-4" />
                          {t('admin.addByUpload', '上传文件')}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer outline-none hover:bg-muted"
                          onSelect={() => { setPublishMode('url'); setShowPublishModal(true); }}
                        >
                          <Link2 className="h-4 w-4" />
                          {t('admin.addByUrl', '从URL导入')}
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  )}
                </div>

                {user?.role !== 'publisher' && user?.role !== 'admin' ? (
                  <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('profile.needPublisherRole', '发布技能需要发布者权限，请联系管理员升级账户。')}</p>
                  </div>
                ) : skillsLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t('skills.searchPlaceholder')}
                          value={skillsSearch}
                          onChange={(e) => setSkillsSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (setSkillsPage(1), fetchMySkills(1))}
                          className="pl-9"
                        />
                      </div>
                      <select
                        value={skillsCategory}
                        onChange={(e) => { setSkillsCategory(e.target.value); setSkillsPage(1); }}
                        className="border rounded-md px-3 py-2 bg-background text-sm min-w-[120px]"
                      >
                        <option value="">{t('skills.category.all')}</option>
                        {['ai', 'data', 'web', 'devops', 'security', 'tools'].map((c) => (
                          <option key={c} value={c}>{t(`skills.category.${c}`)}</option>
                        ))}
                      </select>
                      <select
                        value={skillsStatus}
                        onChange={(e) => { setSkillsStatus(e.target.value); setSkillsPage(1); }}
                        className="border rounded-md px-3 py-2 bg-background text-sm min-w-[120px]"
                      >
                        <option value="">{t('admin.allStatus', '全部状态')}</option>
                        <option value="draft">{t('admin.skillStatus.draft', '草稿')}</option>
                        <option value="published">{t('admin.published', '已发布')}</option>
                        <option value="pending_review">{t('admin.pending', '待审核')}</option>
                        <option value="archived">{t('admin.skillStatus.archived', '已归档')}</option>
                      </select>
                      <Button variant="outline" size="sm" onClick={() => { setSkillsPage(1); fetchMySkills(1); }}>
                        {t('skills.filter', '筛选')}
                      </Button>
                    </div>

                    {skills.length === 0 ? (
                      <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{t('profile.noSkillsMatch', '暂无匹配的技能')}</p>
                        <Button variant="outline" className="mt-4" onClick={() => { setPublishMode('upload'); setShowPublishModal(true); }}>
                            {t('home.publishSkill')}
                          </Button>
                      </div>
                    ) : (
                  <div className="bg-card rounded-xl border overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left py-3 px-4">{t('profile.skillName')}</th>
                          <th className="text-left py-3 px-4">{t('profile.version')}</th>
                          <th className="text-left py-3 px-4">{t('profile.downloads')}</th>
                          <th className="text-left py-3 px-4">{t('profile.status')}</th>
                          <th className="text-left py-3 px-4">{t('profile.lastUpdated')}</th>
                          <th className="text-right py-3 px-4">{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {skills.map((skill) => (
                          <tr key={skill._id} className="border-t">
                            <td className="py-3 px-4 font-medium">
                              <Link to={`/skills/${skill._id}`} className="hover:text-primary">
                                {skill.name}
                              </Link>
                            </td>
                            <td className="py-3 px-4">{skill.version || skill.versions?.[0]?.version || '-'}</td>
                            <td className="py-3 px-4">{(skill.downloads ?? 0).toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  skill.status === 'published'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : skill.status === 'draft'
                                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                      : skill.status === 'archived'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}
                              >
                                {t(`admin.skillStatus.${skill.status === 'pending_review' ? 'pending' : skill.status || 'draft'}`)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {skill.lastUpdated
                                ? new Date(skill.lastUpdated).toLocaleDateString()
                                : skill.updatedAt
                                  ? new Date(skill.updatedAt).toLocaleDateString()
                                  : '-'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Link to={`/skills/${skill._id}`}>
                                  <Button variant="outline" size="sm">
                                    {t('profile.viewDetails')}
                                  </Button>
                                </Link>
                                <Link to="/admin/skills">
                                  <Button variant="outline" size="sm" title={t('profile.manageSkill', '管理')}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                    )}

                    {skills.length > 0 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          {t('skills.foundSkills', { count: skillsPagination.totalSkills })}
                        </p>
                        {skillsPagination.totalPages > 1 ? (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={skillsPage <= 1}
                              onClick={() => { setSkillsPage((p) => p - 1); fetchMySkills(skillsPage - 1); }}
                            >
                              {t('common.pagination.prev')}
                            </Button>
                            <span className="flex items-center px-3 text-sm text-muted-foreground">
                              {skillsPage} / {skillsPagination.totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={skillsPage >= skillsPagination.totalPages}
                              onClick={() => { setSkillsPage((p) => p + 1); fetchMySkills(skillsPage + 1); }}
                            >
                              {t('common.pagination.next')}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h1 className="text-2xl font-bold font-heading mb-6">{t('profile.analytics')}</h1>

                {(() => {
                  const chartSkills = analyticsSkills.length > 0 ? analyticsSkills : skills;
                  const chartTotalDownloads = chartSkills.reduce((sum, s) => sum + (s.downloads || 0), 0);
                  return (
                <>
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
                    const chartSkillsInner = analyticsSkills.length > 0 ? analyticsSkills : skills;
                    const sortedForChart = [...chartSkillsInner]
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
                </>
                  );
                })()}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div>
                <h1 className="text-2xl font-bold font-heading mb-6">{t('profile.favorites')}</h1>
                {favoritesLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('profile.favoritesEmpty', '暂无收藏')}</p>
                    <Link to="/skills" className="mt-4 inline-block">
                      <Button variant="outline">{t('skills.title')}</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map((skill) => (
                      <div
                        key={skill._id}
                        className="bg-card rounded-xl border p-4 flex flex-col hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Link to={`/skills/${skill._id}`} className="font-semibold hover:text-primary line-clamp-2 flex-1">
                            {skill.name}
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={async () => {
                              try {
                                await userAPI.removeFavorite(skill._id);
                                setFavorites((prev) => prev.filter((s) => s._id !== skill._id));
                                toast.success(t('profile.removedFromFavorites', '已取消收藏'));
                              } catch {
                                toast.error(t('profile.removeFailed', '取消收藏失败'));
                              }
                            }}
                            title={t('profile.removeFavorite', '取消收藏')}
                          >
                            <Heart className="h-4 w-4 fill-current" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2 flex-1">
                          {skill.description || '—'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <span className="inline-flex items-center gap-1.5">
                            <Download className="h-3 w-3 shrink-0" />
                            {(skill.downloads ?? 0).toLocaleString()} {t('skills.downloads')}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                            {(skill.rating?.average ?? 0).toFixed(1)}
                          </span>
                          <Link to={`/skills/${skill._id}`} className="ml-auto">
                            <Button size="sm" variant="outline">
                              {t('common.download')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <AddSkillModal
          isOpen={showPublishModal}
          mode={publishMode}
          onClose={() => setShowPublishModal(false)}
          onSuccess={async (data) => {
            try {
              const res = await skillAdminAPI.create({
                name: data.name,
                description: data.description,
                version: data.version,
                category: data.category,
                tags: data.tags,
                license: data.license,
                repositoryUrl: data.repositoryUrl,
                documentationUrl: data.documentationUrl,
                demoUrl: data.demoUrl,
                status: user?.role === 'admin' ? data.status : 'pending_review',
                content: data.content,
                overwrite: data.overwrite,
              });
              setShowPublishModal(false);
              fetchMySkills(skillsPage);
              toast.success(res.data?.message || t('admin.createSuccess', '发布成功'));
              return { ok: true };
            } catch (err: unknown) {
              const e = err as { response?: { data?: { error?: string } } };
              const apiError = e?.response?.data?.error;
              if (apiError === 'VERSION_EXISTS') {
                return { ok: false, error: 'VERSION_EXISTS' };
              }
              toast.error(apiError || '发布失败');
              return { ok: false, error: apiError };
            }
          }}
        />
      </main>
    </div>
  );
};

export default ProfilePage;
