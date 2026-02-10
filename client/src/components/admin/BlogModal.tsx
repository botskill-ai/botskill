import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { blogAPI } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  contentType: 'markdown' | 'html' | 'rich-text';
  coverImage?: string;
  tags: string[];
  category: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

interface BlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: Blog | null;
}

export const BlogModal = ({ isOpen, onClose, blog }: BlogModalProps) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    contentType: 'markdown' as 'markdown' | 'html' | 'rich-text',
    coverImage: '',
    tags: '',
    category: 'general',
    status: 'draft' as 'draft' | 'published' | 'archived',
    featured: false,
    seoTitle: '',
    seoDescription: '',
  });
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (blog) {
        setForm({
          title: blog.title || '',
          slug: blog.slug || '',
          excerpt: blog.excerpt || '',
          content: blog.content || '',
          contentType: blog.contentType || 'markdown',
          coverImage: blog.coverImage || '',
          tags: blog.tags?.join(', ') || '',
          category: blog.category || 'general',
          status: blog.status || 'draft',
          featured: blog.featured || false,
          seoTitle: blog.seoTitle || '',
          seoDescription: blog.seoDescription || '',
        });
      } else {
        setForm({
          title: '',
          slug: '',
          excerpt: '',
          content: '',
          contentType: 'markdown',
          coverImage: '',
          tags: '',
          category: 'general',
          status: 'draft',
          featured: false,
          seoTitle: '',
          seoDescription: '',
        });
      }
      setPreviewMode(false);
    }
  }, [isOpen, blog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
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
        content: form.content,
        contentType: form.contentType,
        coverImage: form.coverImage || undefined,
        tags,
        category: form.category,
        status: form.status,
        featured: form.featured,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
      };

      if (blog) {
        await blogAPI.update(blog._id, data);
        toast.success(t('admin.updateSuccess', '更新成功'));
      } else {
        await blogAPI.create(data);
        toast.success(t('admin.createSuccess', '创建成功'));
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving blog:', error);
      toast.error(error.response?.data?.error || 'Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = () => {
    if (!form.title) return;
    const slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setForm({ ...form, slug });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {blog ? t('admin.editBlog', '编辑博客') : t('admin.createBlog', '创建博客')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('admin.title', '标题')} *
              </label>
              <Input
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value });
                  if (!form.slug) {
                    generateSlug();
                  }
                }}
                placeholder={t('admin.titlePlaceholder', '输入博客标题')}
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('admin.slug', 'URL 别名')}
              </label>
              <div className="flex gap-2">
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder={t('admin.slugPlaceholder', '自动生成或手动输入')}
                />
                <Button type="button" variant="outline" onClick={generateSlug}>
                  {t('admin.generateSlug', '生成')}
                </Button>
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('admin.excerpt', '摘要')}
              </label>
              <Input
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder={t('admin.excerptPlaceholder', '博客摘要（可选）')}
                maxLength={500}
              />
            </div>

            {/* Content Type and Preview Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('admin.contentType', '内容类型')}
                </label>
                <select
                  value={form.contentType}
                  onChange={(e) => setForm({ ...form, contentType: e.target.value as any })}
                  className="border rounded-md px-3 py-2 bg-background"
                >
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                  <option value="rich-text">Rich Text</option>
                </select>
              </div>
              {form.contentType === 'markdown' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? t('admin.edit', '编辑') : t('admin.preview', '预览')}
                </Button>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('admin.content', '内容')} *
              </label>
              {previewMode && form.contentType === 'markdown' ? (
                <div className="border rounded-lg p-4 bg-muted/50 min-h-[400px] max-h-[600px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {form.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder={t('admin.contentPlaceholder', '输入博客内容...')}
                  className="w-full border rounded-md px-3 py-2 bg-background min-h-[400px] font-mono text-sm"
                  required
                />
              )}
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('admin.coverImage', '封面图片 URL')}
              </label>
              <Input
                value={form.coverImage}
                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                placeholder={t('admin.coverImagePlaceholder', '输入图片 URL')}
              />
            </div>

            {/* Tags and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('admin.tags', '标签')}
                </label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder={t('admin.tagsPlaceholder', '用逗号分隔，如：技术,教程')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('admin.categoryLabel', '分类')}
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                >
                  <option value="general">{t('blog.categories.general', '通用')}</option>
                  <option value="technology">{t('blog.categories.technology', '技术')}</option>
                  <option value="tutorial">{t('blog.categories.tutorial', '教程')}</option>
                  <option value="news">{t('blog.categories.news', '新闻')}</option>
                  <option value="announcement">{t('blog.categories.announcement', '公告')}</option>
                </select>
              </div>
            </div>

            {/* Status and Featured */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('admin.status', '状态')}
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                >
                  <option value="draft">{t('admin.draft', '草稿')}</option>
                  <option value="published">{t('admin.published', '已发布')}</option>
                  <option value="archived">{t('admin.archived', '已归档')}</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="featured" className="text-sm font-medium">
                  {t('admin.featured', '精选')}
                </label>
              </div>
            </div>

            {/* SEO */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">{t('admin.seo', 'SEO 设置')}</h3>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('admin.seoTitle', 'SEO 标题')}
                </label>
                <Input
                  value={form.seoTitle}
                  onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                  placeholder={t('admin.seoTitlePlaceholder', 'SEO 标题（可选）')}
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('admin.seoDescription', 'SEO 描述')}
                </label>
                <textarea
                  value={form.seoDescription}
                  onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                  placeholder={t('admin.seoDescriptionPlaceholder', 'SEO 描述（可选）')}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  maxLength={500}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t('common.cancel', '取消')}
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {blog ? t('common.update', '更新') : t('common.create', '创建')}
          </Button>
        </div>
      </div>
    </div>
  );
};
