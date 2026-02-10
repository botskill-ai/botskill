import { useState, useMemo } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Search, Eye, Trash2, Plus, Pencil, Upload, Link, ChevronDown, Tag, BookOpen, User, FolderOpen, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { useAdminSkills } from '@/hooks/useAdminSkills';
import { useCategories } from '@/hooks/useCategories';
import { TruncateWithTooltip } from '@/components/ui/truncate-with-tooltip';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { AddSkillModal, type AddSkillMode } from './AddSkillModal';
import { EditSkillModal } from './EditSkillModal';

const STATUS_OPTIONS = [
  { value: '', labelKey: 'admin.allStatus' },
  { value: 'pending_review', labelKey: 'admin.pending' },
  { value: 'published', labelKey: 'admin.published' },
  { value: 'archived', labelKey: 'admin.rejected' },
  { value: 'draft', labelKey: 'admin.skillStatus.draft' },
];

// CATEGORY_OPTIONS will be populated dynamically from API

const getStatusBadgeClass = (status: string) => {
  if (status === 'published') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'pending_review') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (status === 'draft') return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
};

const getDisplayStatus = (status: string) => {
  if (status === 'pending_review') return 'pending';
  if (status === 'archived') return 'rejected';
  return status;
};

interface SkillViewModalProps {
  skill: any;
  authorName: string;
  getDisplayStatus: (s: string) => string;
  onClose: () => void;
  categories: Array<{ name: string; displayName: string }>;
}

interface SkillVersionItem {
  version: string;
  description: string;
  content?: string;
  tags?: string[];
  createdAt?: string;
}

const SkillViewModal = ({ skill, authorName, getDisplayStatus, onClose, categories }: SkillViewModalProps) => {
  const { t } = useTranslation();
  const versions: SkillVersionItem[] = skill.versions || [];
  const hasVersions = versions.length > 0;
  const fallbackVersion: SkillVersionItem[] = !hasVersions && skill.version
    ? [{ version: skill.version, description: skill.description || '', content: '', tags: skill.tags || [] }]
    : [];
  const versionList = hasVersions ? versions : fallbackVersion;
  const [selectedVer, setSelectedVer] = useState<SkillVersionItem | null>(versionList[0] || null);

  const displayDesc = selectedVer?.description || skill.description || '—';
  const displayTags = (selectedVer?.tags && selectedVer.tags.length > 0) ? selectedVer.tags : (skill.tags || []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="px-6 py-5 border-b bg-muted/30 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold font-heading truncate">{skill.name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {authorName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5" />
                  {skill.category ? (categories.find(c => c.name === skill.category)?.displayName || skill.category) : '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  {(skill.downloads ?? 0).toLocaleString()} {t('admin.downloads')}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(skill.status)}`}>
                  {t(`admin.skillStatus.${getDisplayStatus(skill.status)}`)}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          </div>
        </div>

        {/* 版本选择器 */}
        <div className="px-6 py-4 border-b shrink-0">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
            {t('skills.selectVersion', '选择版本')}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {versionList.map((v) => (
              <button
                key={v.version}
                type="button"
                onClick={() => setSelectedVer(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedVer?.version === v.version
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {v.version === 'latest' ? 'latest' : `v${v.version}`}
              </button>
            ))}
          </div>
        </div>

        {/* 可滚动内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {t('admin.permissionDesc')}
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{displayDesc}</ReactMarkdown>
            </div>
          </div>

          {displayTags.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {displayTags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {t('skills.documentation', '文档')}
              {selectedVer && <span className="text-muted-foreground font-normal">{selectedVer.version === 'latest' ? 'latest' : `v${selectedVer.version}`}</span>}
            </h3>
            <div className="rounded-lg border bg-muted/20 p-4 min-h-[120px]">
              <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:my-2 prose-pre:text-sm">
                {selectedVer?.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{selectedVer.content}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground text-sm">{t('skills.noDocumentation', '暂无文档内容')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminSkills = () => {
  const { t } = useTranslation();
  const { categories, loading: categoriesLoading } = useCategories();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewingSkill, setViewingSkill] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<AddSkillMode>('upload');
  const [editingSkill, setEditingSkill] = useState<any>(null);

  const params = useMemo(() => ({
    page,
    limit: 10,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    q: appliedSearch || undefined,
  }), [page, statusFilter, categoryFilter, appliedSearch]);

  const {
    skills,
    loading,
    pagination,
    createSkill,
    updateSkill,
    approveSkill,
    rejectSkill,
    deleteSkill,
  } = useAdminSkills(true, params);

  const handleSearch = () => {
    setAppliedSearch(search);
    setPage(1);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  };

  const authorName = (skill: any) => {
    const a = skill.author;
    if (!a) return '—';
    return a.username || a.fullName || a.email || '—';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold font-heading">{t('admin.skills')}</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.searchSkills')}
              className="pl-10 w-full sm:w-64"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <select
            className="border rounded-md px-3 py-2 bg-background text-sm"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value || 'all'} value={opt.value}>{t(opt.labelKey)}</option>
            ))}
          </select>
          <select
            className="border rounded-md px-3 py-2 bg-background text-sm min-w-[140px] sm:w-[160px] truncate"
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            disabled={categoriesLoading}
            style={{ 
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}
          >
            <option value="">{t('skills.category.all', '全部')}</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat.name} title={cat.displayName}>
                {cat.displayName.length > 18 ? `${cat.displayName.slice(0, 18)}...` : cat.displayName}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={handleSearch}>{t('admin.searchSkills')}</Button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.addSkill')}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="min-w-[200px] bg-card border rounded-md shadow-lg p-1 z-50">
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer outline-none hover:bg-muted"
                onSelect={() => { setAddMode('upload'); setShowAddModal(true); }}
              >
                <Upload className="h-4 w-4" />
                {t('admin.addByUpload', '上传文件')}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer outline-none hover:bg-muted"
                onSelect={() => { setAddMode('url'); setShowAddModal(true); }}
              >
                <Link className="h-4 w-4" />
                {t('admin.addByUrl', '从URL导入')}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <colgroup>
                  <col style={{ width: 200 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 230 }} />
                </colgroup>
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left py-3 px-4">{t('profile.skillName')}</th>
                    <th className="text-left py-3 px-4">{t('skills.author')}</th>
                    <th className="text-left py-3 px-4">{t('admin.categoryLabel', '分类')}</th>
                    <th className="text-right py-3 px-4">{t('admin.downloads')}</th>
                    <th className="text-left py-3 px-4">{t('profile.status')}</th>
                    <th className="text-left py-3 px-4">{t('admin.createdAt')}</th>
                    <th className="text-center py-3 px-4">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 px-4 text-center text-muted-foreground">
                        {t('admin.noSkillsFound')}
                      </td>
                    </tr>
                  ) : skills.map(skill => (
                    <tr key={skill._id} className="border-t">
                      <td className="py-3 px-4 font-medium overflow-hidden min-w-0">
                        <TruncateWithTooltip content={skill.name}>{skill.name}</TruncateWithTooltip>
                      </td>
                      <td className="py-3 px-4 overflow-hidden min-w-0">
                        <TruncateWithTooltip content={authorName(skill)}>{authorName(skill)}</TruncateWithTooltip>
                      </td>
                      <td className="py-3 px-4 overflow-hidden min-w-0">
                        {skill.category ? (
                          <TruncateWithTooltip content={categories.find(c => c.name === skill.category)?.displayName || skill.category}>
                            {categories.find(c => c.name === skill.category)?.displayName || skill.category}
                          </TruncateWithTooltip>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">{(skill.downloads ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(skill.status)}`}>
                          {t(`admin.skillStatus.${getDisplayStatus(skill.status)}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4">{formatDate(skill.createdAt)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex justify-center gap-1 flex-nowrap">
                          <Button variant="outline" size="sm" onClick={() => setViewingSkill(skill)} title={t('admin.view')}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingSkill(skill)} title={t('admin.edit')}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {skill.status === 'pending_review' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => approveSkill(skill._id)}>
                                {t('admin.approve')}
                              </Button>
                              <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => rejectSkill(skill._id)}>
                                {t('admin.reject')}
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm(t('common.deleteConfirm'))) deleteSkill(skill._id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center px-4 py-3 border-t">
                <span className="text-sm text-muted-foreground">
                  {t('pagination.pageInfo', { currentPage: pagination.currentPage, totalPages: pagination.totalPages })}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={!pagination.hasPrev} onClick={() => setPage(p => Math.max(1, p - 1))}>
                    {t('pagination.prev')}
                  </Button>
                  <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)}>
                    {t('pagination.next')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AddSkillModal
        isOpen={showAddModal}
        mode={addMode}
        onClose={() => setShowAddModal(false)}
        onSuccess={async (data) => {
          return createSkill({
            name: data.name,
            description: data.description,
            version: data.version,
            category: data.category,
            tags: data.tags,
            license: data.license,
            repositoryUrl: data.repositoryUrl,
            documentationUrl: data.documentationUrl,
            demoUrl: data.demoUrl,
            status: data.status,
            content: data.content,
            overwrite: data.overwrite,
          });
        }}
      />
      <EditSkillModal
        isOpen={!!editingSkill}
        onClose={() => setEditingSkill(null)}
        skill={editingSkill}
        onSuccess={updateSkill}
      />
      {viewingSkill && (
        <SkillViewModal
          categories={categories}
          skill={viewingSkill}
          authorName={authorName(viewingSkill)}
          getDisplayStatus={getDisplayStatus}
          onClose={() => setViewingSkill(null)}
        />
      )}
    </div>
  );
};
