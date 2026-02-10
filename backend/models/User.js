const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: function() { return !this.oauthProvider; },
    unique: true,
    sparse: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() { return !this.oauthProvider; },
    minlength: [8, 'Password must be at least 8 characters long']
  },
  oauthProvider: {
    type: String,
    enum: ['google', 'github', ''],
    default: ''
  },
  oauthId: {
    type: String,
    sparse: true,
    default: null
  },
  fullName: {
    type: String,
    trim: true,
    maxlength: [50, 'Full name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters']
  },
  role: {
    type: String,
    enum: ['user', 'publisher', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  }]
}, {
  timestamps: true
});

userSchema.index({ lastLoginAt: -1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving (skip for OAuth users without password)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method (OAuth users may not have password)
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);