import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, Tag, ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { blogAPI } from '@/lib/api';
import { useSeo } from '@/contexts/SeoContext';
import { toast } from 'sonner';
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
  author: {
    _id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
  tags: string[];
  category: string;
  publishedAt: string;
  views: number;
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
}

const BlogDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { setSeo, clearSeo } = useSeo();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  useEffect(() => {
    if (blog) {
      const title = blog.seoTitle || blog.title;
      const desc = blog.seoDescription || blog.excerpt || blog.content?.slice(0, 160) || '';
      const image = blog.coverImage?.startsWith('http') ? blog.coverImage : (blog.coverImage ? `${window.location.origin}${blog.coverImage}` : undefined);
      setSeo({
        title,
        description: desc,
        image,
        canonical: `${window.location.origin}/blog/${blog.slug}`,
        type: 'article',
        publishedTime: blog.publishedAt,
        modifiedTime: (blog as { updatedAt?: string }).updatedAt,
      });
    }
    return () => clearSeo();
  }, [blog, setSeo, clearSeo]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await blogAPI.getBySlug(slug!);
      const data = response.data.success !== undefined ? response.data.data : response.data;
      setBlog(data);
    } catch (error: any) {
      console.error('Error fetching blog:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch blog');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAuthorName = (author?: { fullName?: string; username?: string }) => {
    if (!author) return '未知';
    return author.fullName || author.username || '未知';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container max-w-4xl py-8 px-4 md:px-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">{t('blog.notFound', '博客文章未找到')}</h1>
            <Link to="/blog" className="text-primary hover:underline">
              {t('blog.backToList', '返回博客列表')}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-4xl py-8 px-4 md:px-6">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('blog.backToList', '返回博客列表')}</span>
        </Link>

        <article>
          {/* Header */}
          <header className="mb-8">
            {blog.featured && (
              <span className="inline-block px-3 py-1 mb-4 text-sm font-semibold bg-primary text-primary-foreground rounded">
                {t('blog.featured', '精选')}
              </span>
            )}
            <h1 className="text-4xl font-bold font-heading mb-4">{blog.title}</h1>
            {blog.excerpt && (
              <p className="text-xl text-muted-foreground mb-6">{blog.excerpt}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{getAuthorName(blog.author)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(blog.publishedAt)}</span>
              </div>
              {blog.views > 0 && <span>{blog.views} {t('blog.views', '次浏览')}</span>}
              {blog.category && (
                <span className="px-2 py-1 bg-muted rounded">
                  {t(`blog.categories.${blog.category}`, blog.category)}
                </span>
              )}
            </div>
            {blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {blog.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Cover Image */}
          {blog.coverImage && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-heading prose-headings:font-semibold prose-h1:text-3xl prose-h1:mb-6 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-7 prose-p:mb-4 prose-ul:my-4 prose-li:my-1 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-muted prose-pre:border prose-pre:border-border/50 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-table:text-sm prose-th:bg-muted/50 prose-th:px-4 prose-th:py-3 prose-td:px-4 prose-td:py-3 prose-blockquote:border-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:rounded-r">
            {blog.contentType === 'markdown' ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {blog.content}
              </ReactMarkdown>
            ) : blog.contentType === 'html' ? (
              <div dangerouslySetInnerHTML={{ __html: blog.content }} />
            ) : (
              <div className="whitespace-pre-wrap">{blog.content}</div>
            )}
          </div>
        </article>
      </main>
    </div>
  );
};

export default BlogDetailPage;
