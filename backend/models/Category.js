const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [30, 'Category name cannot exceed 30 characters'],
    match: [/^[a-z0-9-]+$/, 'Category name can only contain lowercase letters, numbers, and hyphens']
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [50, 'Display name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  icon: {
    type: String,
    trim: true,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

categorySchema.index({ order: 1 });
categorySchema.index({ isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
