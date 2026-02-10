const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    maxlength: [30, 'Role name cannot exceed 30 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Role description cannot exceed 200 characters']
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isActive: {
    type: Boolean,
    default: true
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
roleSchema.index({ name: 1, isActive: 1 });

module.exports = mongoose.model('Role', roleSchema);