const mongoose = require('mongoose');

const skillVersionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    match: [/^(\d+\.\d+\.\d+|latest)$/, 'Version must be X.Y.Z or latest'],
  },
  description: {
    type: String,
    required: true,
    maxlength: [1024, 'Description cannot exceed 1024 characters (Agent Skills spec)'],
  },
  content: {
    type: String,
    default: '',
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters'],
  }],
  filePath: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const skillSchema = new mongoose.Schema({
  // Name: 1-64 chars, lowercase alphanumeric, hyphens, @, /; unique globally (case-insensitive)
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
    maxlength: [64, 'Skill name cannot exceed 64 characters'],
  },
  slug: {
    type: String,
    trim: true,
    sparse: true,
  },
  // Agent Skills spec: description max 1024 chars
  description: {
    type: String,
    maxlength: [1024, 'Description cannot exceed 1024 characters (Agent Skills spec)'],
  },
  // Optional: environment requirements (spec compatibility field, max 500)
  compatibility: {
    type: String,
    maxlength: [500, 'Compatibility cannot exceed 500 characters'],
  },
  // Optional: allowed-tools (spec, experimental)
  allowedTools: [{
    type: String,
    trim: true,
  }],
  version: {
    type: String,
    default: '1.0.0',
    match: [/^(\d+\.\d+\.\d+|latest)$/, 'Version must be X.Y.Z or latest'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
    // Category validation will be done at application level using Category model
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters'],
  }],
  downloads: { type: Number, default: 0 },
  rating: {
    average: { type: Number, min: 0, max: 5, default: 0 },
    count: { type: Number, default: 0 },
  },
  license: { type: String, default: 'MIT' },
  repositoryUrl: { type: String, match: [/^https?:\/\/.*/, 'Please enter a valid URL'] },
  documentationUrl: { type: String, match: [/^https?:\/\/.*/, 'Please enter a valid URL'] },
  demoUrl: { type: String, match: [/^https?:\/\/.*/, 'Please enter a valid URL'] },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'pending_review'],
    default: 'draft',
  },
  publishedAt: { type: Date },
  lastUpdated: { type: Date, default: Date.now },
  versions: [skillVersionSchema],
}, {
  timestamps: true,
});

skillSchema.index({ name: 'text', description: 'text', tags: 'text' });
skillSchema.index({ category: 1, status: 1 });
skillSchema.index({ downloads: -1 });
skillSchema.index({ createdAt: -1 });
skillSchema.index({ author: 1 }); // 优化按作者查询
skillSchema.index({ author: 1, status: 1, createdAt: -1 }); // 复合索引优化常见查询
skillSchema.index({ status: 1, category: 1, downloads: -1 }); // 优化搜索排序
// slug index is created by sparse: true on the field
skillSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('Skill', skillSchema);
