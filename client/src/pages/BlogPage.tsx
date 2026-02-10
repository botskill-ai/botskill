import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, User, Tag, ArrowRight, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { blogAPI } from '@/lib/api';
import { toast } from 'sonner';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
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
}

const BlogPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBlogs: 0,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, selectedCategory]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 12,
      };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchTerm) {
        // 注意：后端可能需要添加搜索功能，这里先用前端过滤
      }
      
      const response = await blogAPI.getAll(params);
      const data = response.data.success !== undefined ? response.data.data : response.data;
      setBlogs(data.blogs || []);
      setPagination(data.pagination || pagination);
    } catch (error: any) {
      console.error('Error fetching blogs:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
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

  // 前端搜索过滤
  const filteredBlogs = searchTerm
    ? blogs.filter(
        (blog) =>
          blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : blogs;

  const categories = ['all', 'general', 'technology', 'tutorial', 'news', 'announcement'];

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-7xl py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading mb-2">{t('blog.title', '博客')}</h1>
          <p className="text-muted-foreground">
            {t('blog.subtitle', '探索最新的技术文章和教程')}
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('blog.searchPlaceholder', '搜索博客...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="border rounded-md px-3 py-2 bg-background text-sm min-w-[140px] sm:w-[160px] flex-shrink-0"
            >
              <option value="all">{t('blog.allCategories', '所有分类')}</option>
              {categories
                .filter((cat) => cat !== 'all')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`blog.categories.${cat}`, cat)}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Blog List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('blog.noBlogs', '暂无博客文章')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredBlogs.map((blog) => (
                <Link
                  key={blog._id}
                  to={`/blog/${blog.slug}`}
                  className="bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {blog.coverImage && (
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    {blog.featured && (
                      <span className="inline-block px-2 py-1 mb-2 text-xs font-semibold bg-primary text-primary-foreground rounded">
                        {t('blog.featured', '精选')}
                      </span>
                    )}
                    <h2 className="text-xl font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {blog.title}
                    </h2>
                    {blog.excerpt && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {blog.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{getAuthorName(blog.author)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(blog.publishedAt)}</span>
                      </div>
                      {blog.views > 0 && <span>{blog.views} {t('blog.views', '次浏览')}</span>}
                    </div>
                    {blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {blog.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center text-primary group-hover:gap-2 transition-all">
                      <span className="text-sm font-medium">{t('blog.readMore', '阅读更多')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {!searchTerm && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev || loading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  {t('pagination.prev', '上一页')}
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  {t('pagination.pageInfo', {
                    currentPage: pagination.currentPage,
                    totalPages: pagination.totalPages,
                  })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext || loading}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  {t('pagination.next', '下一页')}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default BlogPage;
