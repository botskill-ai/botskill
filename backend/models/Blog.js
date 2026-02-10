const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'],
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: [500, 'Excerpt cannot exceed 500 characters'],
  },
  content: {
    type: String,
    required: [true, 'Blog content is required'],
  },
  contentType: {
    type: String,
    enum: ['markdown', 'html', 'rich-text'],
    default: 'markdown',
  },
  coverImage: {
    type: String,
    trim: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters'],
  }],
  category: {
    type: String,
    trim: true,
    default: 'general',
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  publishedAt: {
    type: Date,
  },
  views: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  seoTitle: {
    type: String,
    trim: true,
    maxlength: [200, 'SEO title cannot exceed 200 characters'],
  },
  seoDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'SEO description cannot exceed 500 characters'],
  },
}, { 
  timestamps: true,
});

// 创建索引（slug 已有 unique: true，会自动创建唯一索引，无需重复定义）
blogSchema.index({ author: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ category: 1 });

// 在保存前生成slug
blogSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  // 如果状态是published且publishedAt未设置，设置当前时间
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
