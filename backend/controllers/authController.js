const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { verifyCaptcha } = require('./captchaController');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10);

const generateAccessToken = (userId, role = 'user') => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const createRefreshTokenRecord = async (userId, token) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  await RefreshToken.create({
    tokenHash: hashToken(token),
    userId,
    expiresAt
  });
};

const register = async (req, res) => {
  try {
    const { username, email, password, fullName, captchaId, captcha } = req.body;

    // 验证验证码
    if (!verifyCaptcha(captchaId, captcha)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired captcha'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'User already exists with this email or username' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      fullName
    });

    await user.save();

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken();
    await createRefreshTokenRecord(user._id, refreshToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token: accessToken,
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRES,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed', 
        details: errors 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Server error during registration',
      message: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, captchaId, captcha } = req.body;
    const loginInput = email?.trim();

    // 验证验证码（skm CLI 等不传 captcha 时跳过验证）
    const hasCaptcha = captchaId && captcha;
    if (hasCaptcha && !verifyCaptcha(captchaId, captcha)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired captcha'
      });
    }

    // 支持邮箱或用户名登录：判断是否包含 @
    const user = await User.findOne(
      loginInput?.includes('@') ? { email: loginInput } : { username: loginInput }
    );
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: 'Account is deactivated' 
      });
    }

    // Update lastLoginAt
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken();
    await createRefreshTokenRecord(user._id, refreshToken);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: accessToken,
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRES,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Server error during login',
      message: error.message
    });
  }
};

const logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
  }
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Refresh token required' });
    }

    const tokenHash = hashToken(refreshToken);
    const record = await RefreshToken.findOne({ tokenHash });
    if (!record) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }
    if (record.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ tokenHash });
      return res.status(401).json({ success: false, error: 'Refresh token expired' });
    }

    const user = await User.findById(record.userId);
    if (!user || !user.isActive) {
      await RefreshToken.deleteOne({ tokenHash });
      return res.status(401).json({ success: false, error: 'User not found or inactive' });
    }

    // Token rotation: delete old, create new
    await RefreshToken.deleteOne({ tokenHash });
    const newRefreshToken = generateRefreshToken();
    await createRefreshTokenRecord(user._id, newRefreshToken);

    const accessToken = generateAccessToken(user._id, user.role);

    res.json({
      success: true,
      data: {
        token: accessToken,
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRES
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error during token refresh',
      message: error.message
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  refresh,
  getCurrentUser
};