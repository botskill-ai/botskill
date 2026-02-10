import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Package, Upload, ChevronDown, Search, Pencil, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { skillAPI, skillAdminAPI } from '@/lib/api';
import { AddSkillModal } from '@/components/admin';
import { useCategories } from '@/hooks/useCategories';

const ProfileSkillsPage = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();
  const [skills, setSkills] = useState<any[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsPagination, setSkillsPagination] = useState({ currentPage: 1, totalPages: 0, totalSkills: 0 });
  const [skillsSearch, setSkillsSearch] = useState('');
  const [skillsCategory, setSkillsCategory] = useState('');
  const [skillsStatus, setSkillsStatus] = useState('');
  const [skillsPage, setSkillsPage] = useState(1);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishMode, setPublishMode] = useState<'upload' | 'url'>('upload');

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
    if (isAuthenticated && (user?.role === 'publisher' || user?.role === 'admin')) {
      fetchMySkills(skillsPage);
    }
  }, [isAuthenticated, user?.role, skillsPage, fetchMySkills]);

  return (
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
              className="border rounded-md px-3 py-2 bg-background text-sm min-w-[140px] sm:w-[160px] truncate"
              disabled={categoriesLoading}
              style={{ 
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              <option value="">{t('skills.category.all', '全部')}</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name} title={cat.displayName}>
                  {cat.displayName.length > 18 ? `${cat.displayName.slice(0, 18)}...` : cat.displayName}
                </option>
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
    </div>
  );
};

export default ProfileSkillsPage;
