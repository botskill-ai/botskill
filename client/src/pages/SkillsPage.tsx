import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Download, Star, Filter, Grid, List, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useSkills } from '@/hooks/useSkills';
import { useCategories } from '@/hooks/useCategories';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

const SkillsPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { categories, loading: categoriesLoading } = useCategories(true, false, true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating' | 'downloads'>('recent');

  // 当从其他页面跳转过来时，滚动到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const {
    skills: currentSkills,
    loading,
    error,
    pagination,
    refetch,
  } = useSkills(searchTerm, selectedCategory, currentPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const getAuthorName = (author?: { fullName?: string; username?: string }) => {
    if (!author) return '未知';
    return author.fullName || author.username || '未知';
  };

  const getRating = (skill: { rating?: { average?: number } }) => {
    return skill.rating?.average ?? 0;
  };

  // 限制描述长度
  const truncateDescription = (description: string | undefined, maxLength: number = 120) => {
    if (!description) return '—';
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength).trim() + '...';
  };

  // 排序技能列表
  const sortedSkills = useMemo(() => {
    const skills = [...currentSkills];
    switch (sortBy) {
      case 'popular':
        return skills.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
      case 'rating':
        return skills.sort((a, b) => {
          const ratingA = a.rating?.average || 0;
          const ratingB = b.rating?.average || 0;
          return ratingB - ratingA;
        });
      case 'downloads':
        return skills.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
      case 'recent':
      default:
        return skills.sort((a, b) => {
          const dateA = new Date(a.lastUpdated || a.createdAt || 0).getTime();
          const dateB = new Date(b.lastUpdated || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
    }
  }, [currentSkills, sortBy]);

  // 获取排序选项的显示文本
  const getSortLabel = (value: string) => {
    switch (value) {
      case 'recent':
        return t('skills.sort.recent', '最新');
      case 'popular':
        return t('skills.sort.popular', '最热');
      case 'rating':
        return t('skills.sort.rating', '评分最高');
      case 'downloads':
        return t('skills.sort.downloads', '下载最多');
      default:
        return value;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-7xl py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading mb-2">{t('skills.title')}</h1>
          <p className="text-muted-foreground">
            {t('skills.discover', { count: pagination.totalSkills })}
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('skills.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="border rounded-md px-3 py-2 bg-background text-sm min-w-[160px] sm:w-[180px] flex-shrink-0 truncate"
              disabled={categoriesLoading}
              style={{ 
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              <option value="all">{t('skills.category.all', '全部')}</option>
              {categories.map((category) => (
                <option key={category._id} value={category.name} title={category.displayName}>
                  {category.displayName.length > 20 ? `${category.displayName.slice(0, 20)}...` : category.displayName}
                </option>
              ))}
            </select>

            <Drawer open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="flex-shrink-0">
                  <Filter className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">{t('skills.filter', '筛选')}</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="sm:max-w-md">
                <DrawerHeader className="border-b border-border/40 pb-6 pt-8 px-6">
                  <DrawerTitle className="text-2xl font-bold tracking-tight">
                    {t('skills.filter', '筛选')}
                  </DrawerTitle>
                  <DrawerDescription className="text-sm text-muted-foreground/80">
                    {t('skills.filterDesc', '设置筛选条件和排序方式')}
                  </DrawerDescription>
                </DrawerHeader>
                <div className="px-6 pb-6 overflow-y-auto max-h-[calc(100vh-180px)]">
                  <div className="space-y-6 pt-6">
                    {/* 排序方式 */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-foreground/90">
                        {t('skills.sortBy', '排序方式')}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['recent', 'popular', 'rating', 'downloads'] as const).map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setSortBy(option)}
                            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                              sortBy === option
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-background border-border/50 hover:border-primary/50 hover:bg-muted/50'
                            }`}
                          >
                            {getSortLabel(option)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 当前筛选条件 */}
                    <div className="space-y-3 border-t border-border/40 pt-6">
                      <label className="block text-sm font-semibold text-foreground/90">
                        {t('skills.currentFilters', '当前筛选条件')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedCategory !== 'all' && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-sm">
                            <span className="text-muted-foreground">
                              {t('skills.category', '分类')}:
                            </span>
                            <span className="font-medium">
                              {categories.find(c => c.name === selectedCategory)?.displayName || selectedCategory}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory('all');
                                setCurrentPage(1);
                              }}
                              className="ml-1 hover:text-destructive transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        {searchTerm && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-sm">
                            <span className="text-muted-foreground">
                              {t('skills.search', '搜索')}:
                            </span>
                            <span className="font-medium">{searchTerm}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSearchTerm('');
                                setCurrentPage(1);
                              }}
                              className="ml-1 hover:text-destructive transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        {selectedCategory === 'all' && !searchTerm && (
                          <p className="text-sm text-muted-foreground">
                            {t('skills.noFilters', '暂无筛选条件')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2 pt-4 border-t border-border/40">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCategory('all');
                          setSearchTerm('');
                          setSortBy('recent');
                          setCurrentPage(1);
                        }}
                      >
                        {t('skills.resetFilters', '重置')}
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setFilterDrawerOpen(false)}
                      >
                        {t('common.confirm', '确定')}
                      </Button>
                    </div>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>

            <div className="flex border rounded-md overflow-hidden flex-shrink-0">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3"
              >
                <Grid className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t('skills.grid')}</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3"
              >
                <List className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t('skills.list')}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={refetch}>
              {t('common.retry', '重试')}
            </Button>
          </div>
        )}

        {/* Skills Grid/List */}
        {!loading && !error && (
          <>
            {/* Skills Count */}
            <div className="mb-6 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {t('skills.foundSkills', { count: pagination.totalSkills })}
              </p>
              <div className="text-sm text-muted-foreground">
                {t('pagination.pageInfo', {
                  currentPage: pagination.currentPage,
                  totalPages: pagination.totalPages || 1,
                })}
              </div>
            </div>

            {/* Empty State */}
            {sortedSkills.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p>{t('skills.empty', '暂无技能')}</p>
              </div>
            )}

            {/* Skills Display */}
            {sortedSkills.length > 0 &&
              (viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                  {sortedSkills.map((skill) => (
                    <div
                      key={skill._id}
                      className="bg-card rounded-xl border overflow-hidden flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200"
                    >
                      <div className="p-4 md:p-5 flex flex-col flex-1 min-h-0">
                        <div className="mb-3">
                          <Link to={`/skills/${skill._id}`} className="group block mb-2">
                            <span className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">
                              {skill.name}
                            </span>
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-foreground/70">
                            <span>{getAuthorName(skill.author)}</span>
                            <span className="text-foreground/40">·</span>
                            <span className="inline-flex items-center gap-1.5">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                              {getRating(skill).toFixed(1)}
                            </span>
                            <span className="text-foreground/40">·</span>
                            <span className="inline-flex items-center gap-1.5">
                              <Download className="h-3 w-3 shrink-0 text-foreground/60" />
                              {(skill.downloads ?? 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-shrink-0" title={skill.description || ''}>
                          {truncateDescription(skill.description, 100)}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-4 flex-shrink-0">
                          {(skill.tags || []).slice(0, 3).map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <Link to={`/skills/${skill._id}`} className="mt-auto block">
                          <Button className="w-full" size="sm">
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            {t('common.download')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedSkills.map((skill) => (
                    <div
                      key={skill._id}
                      className="bg-card rounded-lg border p-6 flex flex-col sm:flex-row gap-4"
                    >
                      <div className="flex-1">
                        <div className="mb-2">
                          <Link to={`/skills/${skill._id}`} className="hover:underline block mb-1.5">
                            <span className="font-semibold text-lg">{skill.name}</span>
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-foreground/70">
                            <span>{getAuthorName(skill.author)}</span>
                            <span className="text-foreground/40">·</span>
                            <span className="inline-flex items-center gap-1.5">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                              {getRating(skill).toFixed(1)}
                            </span>
                            <span className="text-foreground/40">·</span>
                            <span className="inline-flex items-center gap-1.5">
                              <Download className="h-3 w-3 shrink-0 text-foreground/60" />
                              {(skill.downloads ?? 0).toLocaleString()} {t('skills.downloads')}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2" title={skill.description || ''}>
                          {truncateDescription(skill.description, 150)}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {(skill.tags || []).map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col justify-end items-end shrink-0">
                        <Link to={`/skills/${skill._id}`}>
                          <Button size="sm">
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            {t('common.download')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    {t('pagination.prev')}
                  </Button>

                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={i}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return (
                        <span key={i} className="px-2">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                  >
                    {t('pagination.next')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SkillsPage;
