const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Permission name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Permission description is required'],
    maxlength: [200, 'Permission description cannot exceed 200 characters']
  },
  resource: {
    type: String,
    required: [true, 'Resource is required'],
    trim: true,
    maxlength: [50, 'Resource name cannot exceed 50 characters']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
    enum: ['create', 'read', 'update', 'delete', 'manage']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
permissionSchema.index({ resource: 1, action: 1 });

module.exports = mongoose.model('Permission', permissionSchema);