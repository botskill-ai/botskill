import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Save, Loader2, Settings, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { blogAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import TurndownService from 'turndown';
import { marked } from 'marked';
import { SimpleEditor } from '@/components/tiptap/SimpleEditor';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from '@/components/ui/drawer';

const BlogEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isEditMode = !!id;

  // 智能返回函数：优先使用 location.state，否则使用浏览器历史记录
  const handleGoBack = () => {
    const from = (location.state as any)?.from;
    if (from) {
      navigate(from);
    } else {
      // 使用浏览器历史记录返回，如果没有历史记录则返回到 admin
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/admin');
      }
    }
  };

  // 权限检查
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        toast.error(t('admin.loginRequired', '请先登录'));
        navigate('/login');
        return;
      }
      if (user.role !== 'admin' && user.role !== 'publisher') {
        toast.error(t('admin.permissionDenied', '权限不足，只有发布者或管理员可以创建博客'));
        navigate('/blog');
        return;
      }
    }
  }, [isAuthenticated, user, authLoading, navigate, t]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    tags: '',
    category: 'general',
    status: 'draft' as 'draft' | 'published' | 'archived',
    featured: false,
    seoTitle: '',
    seoDescription: '',
  });

  // 使用 ref 来标记是否正在加载内容，避免在 onUpdate 回调中的闭包问题
  const isLoadingContentRef = useRef(false);
  const [editorHtml, setEditorHtml] = useState('');

  // 处理编辑器内容更新
  const handleEditorUpdate = (html: string) => {
    if (isLoadingContentRef.current) return;
    
    // 将 HTML 转换为 Markdown 并保存到 form.content
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    const markdown = turndownService.turndown(html);
    setForm((prev) => ({ ...prev, content: markdown }));
    setEditorHtml(html);
  };

  // 权限检查
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user) {
        toast.error(t('admin.loginRequired', '请先登录'));
        navigate('/login');
        return;
      }
      if (user.role !== 'admin' && user.role !== 'publisher') {
        toast.error(t('admin.permissionDenied', '权限不足，只有发布者或管理员可以创建博客'));
        navigate('/blog');
        return;
      }
    }
  }, [isAuthenticated, user, authLoading, navigate, t]);

  useEffect(() => {
    if (isEditMode && id && isAuthenticated && user) {
      fetchBlog();
    } else if (!isEditMode) {
      // 新建模式，初始化编辑器 HTML 和默认标题
      setEditorHtml('');
      // 生成默认标题：未命名博客 + 时间戳
      const defaultTitle = `${t('admin.untitledBlog', '未命名博客')} ${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`;
      const defaultSlug = defaultTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setForm(prev => ({ ...prev, title: defaultTitle, slug: defaultSlug }));
    }
  }, [id, isEditMode, isAuthenticated, user, t]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await blogAPI.getById(id!);
      const data = response.data.success !== undefined ? response.data.data : response.data;
      
      // 检查权限：只有作者或管理员可以编辑
      if (data.author._id !== user?.id && user?.role !== 'admin') {
        toast.error(t('admin.permissionDenied', '权限不足'));
        navigate('/blog');
        return;
      }

      const content = data.content || '';
      
      isLoadingContentRef.current = true;
      setForm({
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        content: content,
        coverImage: data.coverImage || '',
        tags: data.tags?.join(', ') || '',
        category: data.category || 'general',
        status: data.status || 'draft',
        featured: data.featured || false,
        seoTitle: data.seoTitle || '',
        seoDescription: data.seoDescription || '',
      });

      // 将 Markdown 转换为 HTML 供编辑器使用
      if (content) {
        const html = marked.parse(content, { breaks: true, gfm: true });
        setEditorHtml(html as string);
      }
      // 使用 setTimeout 确保编辑器更新完成后再重置标志
      setTimeout(() => {
        isLoadingContentRef.current = false;
      }, 100);
    } catch (error: any) {
      console.error('Error fetching blog:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch blog');
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title) {
      toast.error(t('admin.requiredFields', '请填写必填字段'));
      return;
    }

    // 从编辑器 HTML 获取最新的 Markdown 内容
    let markdownContent = form.content;
    if (editorHtml) {
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
      });
      markdownContent = turndownService.turndown(editorHtml);
    }

    if (!markdownContent || markdownContent.trim() === '') {
      toast.error(t('admin.requiredFields', '请填写必填字段'));
      return;
    }

    try {
      setSaving(true);
      const tags = form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const data = {
        title: form.title,
        slug: form.slug || undefined,
        excerpt: form.excerpt || undefined,
        content: markdownContent,
        coverImage: form.coverImage || undefined,
        tags,
        category: form.category,
        status: form.status,
        featured: form.featured,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
      };

      if (isEditMode) {
        await blogAPI.update(id!, data);
        toast.success(t('admin.updateSuccess', '更新成功'));
      } else {
        await blogAPI.create(data);
        toast.success(t('admin.createSuccess', '创建成功'));
      }
      // 保存成功后返回到来源页面，如果没有来源则返回到博客管理页面
      const from = (location.state as any)?.from;
      navigate(from || '/admin/blogs');
    } catch (error: any) {
      console.error('Error saving blog:', error);
      toast.error(error.response?.data?.error || 'Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  const [drawerOpen, setDrawerOpen] = useState(false);

  const generateSlug = () => {
    const titleToUse = form.title || '';
    if (!titleToUse) return;
    const slug = titleToUse
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setForm(prev => ({ ...prev, slug }));
  };

  if (authLoading || loading || !isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'publisher')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t('common.back', '返回')}</span>
              </button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <Input
                  value={form.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setForm(prev => {
                      // 如果 slug 为空或者是基于旧标题生成的，则更新 slug
                      const shouldUpdateSlug = !prev.slug || prev.slug === '';
                      const newSlug = shouldUpdateSlug ? newTitle
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '') : prev.slug;
                      return { ...prev, title: newTitle, slug: newSlug };
                    });
                  }}
                  placeholder={t('admin.titlePlaceholder', '输入博客标题')}
                  required
                  className="text-lg font-semibold border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-0 placeholder:text-muted-foreground/50 flex-1 min-w-0"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-border/50 hover:bg-muted/80 hover:border-border transition-all">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('admin.settings', '设置')}</span>
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="sm:max-w-md">
                  <DrawerHeader className="border-b border-border/40 pb-6 pt-8 px-6">
                    <div className="space-y-1">
                      <DrawerTitle className="text-2xl font-bold tracking-tight">{t('admin.settings', '设置')}</DrawerTitle>
                      <DrawerDescription className="text-sm text-muted-foreground/80">
                        {t('admin.blogSettingsDesc', '配置博客的发布设置、分类、标签等信息')}
                      </DrawerDescription>
                    </div>
                  </DrawerHeader>
                  <div className="px-6 pb-6 overflow-y-auto max-h-[calc(100vh-180px)]">
                    <div className="space-y-6 pt-6">
                      {/* URL 别名 */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-foreground/90">
                          {t('admin.slug', 'URL 别名')}
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={form.slug}
                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                            placeholder={t('admin.slugPlaceholder', '自动生成或手动输入')}
                            className="border-border/50 focus:border-primary/50"
                          />
                          <Button type="button" variant="outline" onClick={generateSlug} className="whitespace-nowrap border-border/50 hover:bg-muted/80 shrink-0">
                            {t('admin.generateSlug', '生成')}
                          </Button>
                        </div>
                      </div>

                      {/* 分类 */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-foreground/90">
                          {t('admin.categoryLabel', '分类')}
                        </label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="w-full border border-border/50 rounded-md px-3 py-2.5 bg-background text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
                        >
                          <option value="general">{t('blog.categories.general', '通用')}</option>
                          <option value="technology">{t('blog.categories.technology', '技术')}</option>
                          <option value="tutorial">{t('blog.categories.tutorial', '教程')}</option>
                          <option value="news">{t('blog.categories.news', '新闻')}</option>
                          <option value="announcement">{t('blog.categories.announcement', '公告')}</option>
                        </select>
                      </div>

                      {/* 摘要 */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-foreground/90">
                          {t('admin.excerpt', '摘要')}
                        </label>
                        <textarea
                          value={form.excerpt}
                          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                          placeholder={t('admin.excerptPlaceholder', '博客摘要（可选）')}
                          maxLength={500}
                          rows={3}
                          className="w-full border border-border/50 rounded-md px-3 py-2.5 bg-background text-sm resize-none focus:outline-none focus:border-primary transition-colors"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="text-muted-foreground/70">{t('admin.optional', '可选')}</span>
                          <span>{form.excerpt.length}/500</span>
                        </div>
                      </div>

                      {/* 封面图片 */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-foreground/90">
                          {t('admin.coverImage', '封面图片 URL')}
                        </label>
                        <Input
                          value={form.coverImage}
                          onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                          placeholder={t('admin.coverImagePlaceholder', '输入图片 URL')}
                          className="border-border/50 focus:border-primary/50"
                        />
                        {form.coverImage && (
                          <div className="mt-3 rounded-lg overflow-hidden border-2 border-border/50 shadow-md">
                            <img 
                              src={form.coverImage} 
                              alt="Cover preview" 
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* 标签 */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-foreground/90">
                          {t('admin.tags', '标签')}
                        </label>
                        <Input
                          value={form.tags}
                          onChange={(e) => setForm({ ...form, tags: e.target.value })}
                          placeholder={t('admin.tagsPlaceholder', '用逗号分隔，如：技术,教程')}
                          className="border-border/50 focus:border-primary/50"
                        />
                        <p className="text-xs text-muted-foreground/70">
                          {t('admin.tagsHint', '使用逗号分隔多个标签')}
                        </p>
                      </div>

                      {/* 发布设置 */}
                      <div className="border-t border-border/40 pt-6 space-y-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-foreground/90">
                            {t('admin.status', '状态')}
                          </label>
                          <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                            className="w-full border border-border/50 rounded-md px-3 py-2.5 bg-background text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
                          >
                            <option value="draft">{t('admin.draft', '草稿')}</option>
                            <option value="published">{t('admin.published', '已发布')}</option>
                            <option value="archived">{t('admin.archived', '已归档')}</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-3 p-3.5 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors">
                          <input
                            type="checkbox"
                            id="featured"
                            checked={form.featured}
                            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 cursor-pointer accent-primary"
                          />
                          <label htmlFor="featured" className="text-sm font-medium cursor-pointer flex-1">
                            {t('admin.featured', '精选')}
                          </label>
                        </div>
                      </div>

                      {/* SEO 设置 */}
                      <div className="border-t border-border/40 pt-6 space-y-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-foreground/90">
                            {t('admin.seoTitle', 'SEO 标题')}
                          </label>
                          <Input
                            value={form.seoTitle}
                            onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                            placeholder={t('admin.seoTitlePlaceholder', 'SEO 标题（可选）')}
                            maxLength={200}
                            className="border-border/50 focus:border-primary/50"
                          />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="text-muted-foreground/70">{t('admin.optional', '可选')}</span>
                            <span>{form.seoTitle.length}/200</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-foreground/90">
                            {t('admin.seoDescription', 'SEO 描述')}
                          </label>
                          <textarea
                            value={form.seoDescription}
                            onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                            placeholder={t('admin.seoDescriptionPlaceholder', 'SEO 描述（可选）')}
                            className="w-full border border-border/50 rounded-md px-3 py-2.5 bg-background text-sm resize-none focus:outline-none focus:border-primary transition-colors"
                            maxLength={500}
                            rows={3}
                          />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="text-muted-foreground/70">{t('admin.optional', '可选')}</span>
                            <span>{form.seoDescription.length}/500</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
              <Button 
                onClick={handleSubmit} 
                disabled={saving} 
                size="sm"
                className="gap-2 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">{t('common.saving', '保存中...')}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{t('common.save', '保存')}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container max-w-[1600px] mx-auto px-4 md:px-6 py-6 flex flex-col">
        <div className="max-w-5xl mx-auto flex-1 flex flex-col min-h-0">
          {/* 编辑器 */}
          <div className="flex-1 flex flex-col min-h-0 bg-card">
            <SimpleEditor
              content={editorHtml}
              placeholder={t('admin.contentPlaceholder', '输入博客内容...')}
              onUpdate={handleEditorUpdate}
              className="flex-1 flex flex-col min-h-0"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BlogEditPage;
