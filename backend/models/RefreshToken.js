const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL: 文档在 expiresAt 时刻过期
refreshTokenSchema.index({ userId: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
