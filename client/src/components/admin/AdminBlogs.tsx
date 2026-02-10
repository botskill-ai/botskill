import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
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
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  views: number;
  featured: boolean;
  createdAt: string;
}

interface AdminBlogsProps {
  blogs?: Blog[];
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalBlogs: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  page?: number;
  onPageChange?: (page: number) => void;
  refetchBlogs?: () => void;
}

export const AdminBlogs = ({
  blogs: propBlogs,
  loading: propLoading,
  pagination: propPagination,
  page: propPage,
  onPageChange: propOnPageChange,
  refetchBlogs: propRefetchBlogs,
}: AdminBlogsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>(propBlogs || []);
  const [loading, setLoading] = useState(propLoading || false);
  const [pagination, setPagination] = useState(propPagination || {
    currentPage: 1,
    totalPages: 1,
    totalBlogs: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [page, setPage] = useState(propPage || 1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchBlogs = async (pageNum: number = page) => {
    try {
      setLoading(true);
      const params: any = {
        page: pageNum,
        limit: 10,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await blogAPI.adminGetAll(params);
      const data = response.data.success !== undefined ? response.data.data : response.data;
      setBlogs(data.blogs || []);
      setPagination(data.pagination || pagination);
      if (propOnPageChange) {
        propOnPageChange(pageNum);
      } else {
        setPage(pageNum);
      }
    } catch (error: any) {
      console.error('Error fetching blogs:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!propBlogs) {
      fetchBlogs(page);
    } else {
      setBlogs(propBlogs);
      setPagination(propPagination || pagination);
      setPage(propPage || 1);
    }
  }, [statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.confirmDelete', '确定要删除吗？'))) {
      return;
    }
    try {
      await blogAPI.delete(id);
      toast.success(t('admin.deleteSuccess', '删除成功'));
      if (propRefetchBlogs) {
        propRefetchBlogs();
      } else {
        fetchBlogs(page);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete blog');
    }
  };

  const handleEdit = (blog: Blog) => {
    navigate(`/blog/edit/${blog._id}`, { 
      state: { from: '/admin/blogs' } 
    });
  };

  const handleCreate = () => {
    navigate('/blog/new', { 
      state: { from: '/admin/blogs' } 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-heading">{t('admin.blogs', '博客管理')}</h2>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.createBlog', '创建博客')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2 bg-background text-sm"
        >
          <option value="all">{t('admin.allStatus', '所有状态')}</option>
          <option value="published">{t('admin.published', '已发布')}</option>
          <option value="draft">{t('admin.draft', '草稿')}</option>
          <option value="archived">{t('admin.archived', '已归档')}</option>
        </select>
      </div>

      {/* Blog List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('admin.noBlogs', '暂无博客')}</p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">{t('admin.title', '标题')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">{t('admin.author', '作者')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">{t('admin.categoryLabel', '分类')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">{t('admin.status', '状态')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">{t('admin.views', '浏览量')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">{t('admin.createdAt', '创建时间')}</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">{t('admin.actions', '操作')}</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map((blog) => (
                    <tr key={blog._id} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {blog.featured && (
                            <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded">
                              {t('blog.featured', '精选')}
                            </span>
                          )}
                          <span className="font-medium">{blog.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {blog.author?.fullName || blog.author?.username || '未知'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {blog.category}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(blog.status)}`}>
                          {t(`admin.${blog.status}`, blog.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {blog.views || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(blog.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {blog.status === 'published' && (
                            <Link
                              to={`/blog/${blog.slug}`}
                              target="_blank"
                              className="p-1.5 hover:bg-muted rounded"
                              title={t('admin.view', '查看')}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          )}
                          <button
                            onClick={() => handleEdit(blog)}
                            className="p-1.5 hover:bg-muted rounded"
                            title={t('admin.edit', '编辑')}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(blog._id)}
                            className="p-1.5 hover:bg-muted rounded text-destructive"
                            title={t('admin.delete', '删除')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">
                {t('pagination.pageInfo', {
                  currentPage: pagination.currentPage,
                  totalPages: pagination.totalPages,
                })}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => {
                    const newPage = Math.max(1, page - 1);
                    if (propOnPageChange) {
                      propOnPageChange(newPage);
                    } else {
                      setPage(newPage);
                      fetchBlogs(newPage);
                    }
                  }}
                >
                  {t('pagination.prev', '上一页')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => {
                    const newPage = page + 1;
                    if (propOnPageChange) {
                      propOnPageChange(newPage);
                    } else {
                      setPage(newPage);
                      fetchBlogs(newPage);
                    }
                  }}
                >
                  {t('pagination.next', '下一页')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
