const Blog = require('../models/Blog');
const User = require('../models/User');

// 获取所有博客（公开）
const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    const query = { status: 'published' };
    
    // 支持分类和标签筛选
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.tag) {
      query.tags = req.query.tag;
    }
    if (req.query.featured === 'true') {
      query.featured = true;
    }
    
    const blogs = await Blog.find(query)
      .populate('author', 'username fullName avatar')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content'); // 列表页不返回完整内容
    
    const total = await Blog.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalBlogs: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error while fetching blogs', message: error.message });
  }
};

// 根据slug获取博客详情
const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' })
      .populate('author', 'username fullName avatar');
    
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }
    
    // 增加浏览量
    blog.views += 1;
    await blog.save();
    
    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error while fetching blog', message: error.message });
  }
};

// 根据ID获取博客详情（管理员）
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'username fullName avatar');
    
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }
    
    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error while fetching blog', message: error.message });
  }
};

// 创建博客
const createBlog = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      contentType,
      coverImage,
      tags,
      category,
      status,
      featured,
      seoTitle,
      seoDescription
    } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }
    
    // 生成slug（如果没有提供）
    let blogSlug = slug;
    if (!blogSlug) {
      blogSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    // 检查slug是否已存在
    const existingBlog = await Blog.findOne({ slug: blogSlug });
    if (existingBlog) {
      return res.status(400).json({ success: false, error: 'Blog with this slug already exists' });
    }
    
    const blog = new Blog({
      title,
      slug: blogSlug,
      excerpt,
      content,
      contentType: contentType || 'markdown',
      coverImage,
      author: req.user.userId,
      tags: tags || [],
      category: category || 'general',
      status: status || 'draft',
      featured: featured || false,
      seoTitle,
      seoDescription,
      publishedAt: status === 'published' ? new Date() : null,
    });
    
    await blog.save();
    await blog.populate('author', 'username fullName avatar');
    
    res.status(201).json({ success: true, message: 'Blog created successfully', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error while creating blog', message: error.message });
  }
};

// 更新博客
const updateBlog = async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      contentType,
      coverImage,
      tags,
      category,
      status,
      featured,
      seoTitle,
      seoDescription
    } = req.body;
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }
    
    // 检查权限：只有作者或管理员可以编辑
    if (blog.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }
    
    // 如果slug改变，检查新slug是否已存在
    if (slug && slug !== blog.slug) {
      const existingBlog = await Blog.findOne({ slug, _id: { $ne: req.params.id } });
      if (existingBlog) {
        return res.status(400).json({ success: false, error: 'Blog with this slug already exists' });
      }
      blog.slug = slug;
    }
    
    if (title) blog.title = title;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (content) blog.content = content;
    if (contentType) blog.contentType = contentType;
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (tags) blog.tags = tags;
    if (category) blog.category = category;
    if (status) {
      blog.status = status;
      // 如果状态改为published且publishedAt未设置，设置当前时间
      if (status === 'published' && !blog.publishedAt) {
        blog.publishedAt = new Date();
      }
    }
    if (featured !== undefined) blog.featured = featured;
    if (seoTitle !== undefined) blog.seoTitle = seoTitle;
    if (seoDescription !== undefined) blog.seoDescription = seoDescription;
    
    await blog.save();
    await blog.populate('author', 'username fullName avatar');
    
    res.json({ success: true, message: 'Blog updated successfully', data: blog });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error while updating blog', message: error.message });
  }
};

// 删除博客
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog not found' });
    }
    
    // 检查权限：只有作者或管理员可以删除
    if (blog.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }
    
    await Blog.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error while deleting blog', message: error.message });
  }
};

// 管理员获取所有博客（包括草稿）
const adminGetAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // 支持状态筛选
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.author) {
      query.author = req.query.author;
    }
    
    const blogs = await Blog.find(query)
      .populate('author', 'username fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Blog.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalBlogs: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error while fetching blogs', message: error.message });
  }
};

// 上传博客图片
const uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '没有上传文件' });
    }

    // 构建图片 URL（相对于 API 基础路径）
    // 例如：/api/uploads/images/blog-image-xxx.jpg
    const imageUrl = `/api/uploads/images/${req.file.filename}`;

    res.json({
      success: true,
      url: imageUrl,
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: '图片上传失败',
      message: error.message,
    });
  }
};

module.exports = {
  getAllBlogs,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  adminGetAllBlogs,
  uploadBlogImage,
};
