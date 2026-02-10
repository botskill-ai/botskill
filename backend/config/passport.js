const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

const createOrFindOAuthUser = async (provider, profile) => {
  const oauthId = profile.id;
  const email = profile.emails?.[0]?.value || profile._json?.email || profile.email || `${provider}_${oauthId}@oauth.local`;
  const displayName = profile.displayName || profile.username || profile._json?.name || profile.name?.givenName || 'User';
  const avatar = profile.photos?.[0]?.value || profile._json?.avatar_url || profile.avatar_url || '';

  // 生成唯一 username：provider_id 或 基于 displayName
  const baseUsername = (profile.username || displayName || oauthId)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase()
    .slice(0, 25);
  let username = baseUsername || `${provider}_${oauthId}`;
  if (username.length < 3) username = `${provider}_${oauthId}`;

  let user = await User.findOne({ oauthProvider: provider, oauthId: String(oauthId) });

  if (user) {
    await User.findByIdAndUpdate(user._id, {
      lastLoginAt: new Date(),
      ...(avatar && { avatar }),
      ...(displayName && user.fullName !== displayName && { fullName: displayName })
    });
    return await User.findById(user._id);
  }

  // 检查 email 是否已存在（本地注册用户）
  user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    if (user.oauthProvider) {
      return user; // 已是 OAuth 用户
    }
    // 关联 OAuth 到已有账号
    user.oauthProvider = provider;
    user.oauthId = String(oauthId);
    if (avatar) user.avatar = avatar;
    await user.save();
    return user;
  }

  // 确保 username 唯一
  let uniqueUsername = username;
  let suffix = 0;
  while (await User.findOne({ username: uniqueUsername })) {
    uniqueUsername = `${username}_${++suffix}`.slice(0, 30);
  }

  user = new User({
    username: uniqueUsername,
    email: email.toLowerCase(),
    oauthProvider: provider,
    oauthId: String(oauthId),
    fullName: displayName,
    avatar: avatar || undefined,
    password: undefined
  });
  await user.save();
  return user;
};

const getCallbackUrl = (path) => {
  const base = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${base.replace(/\/$/, '')}${path}`;
};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || getCallbackUrl('/api/auth/google/callback')
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await createOrFindOAuthUser('google', profile);
      if (!user.isActive) {
        return done(null, false, { message: 'Account is deactivated' });
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }));
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || getCallbackUrl('/api/auth/github/callback'),
    scope: ['user:email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await createOrFindOAuthUser('github', profile);
      if (!user.isActive) {
        return done(null, false, { message: 'Account is deactivated' });
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }));
}

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

const oauthCallback = (provider) => async (req, res) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!req.user) {
    const error = encodeURIComponent(req.authInfo?.message || 'OAuth authentication failed');
    return res.redirect(`${FRONTEND_URL}/login?oauth_error=${error}`);
  }

  const user = req.user;
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken();
  await createRefreshTokenRecord(user._id, refreshToken);

  const params = new URLSearchParams({
    token: accessToken,
    refreshToken,
    userId: String(user._id)
  });
  res.redirect(`${FRONTEND_URL}/login?${params.toString()}`);
};

module.exports = { passport, oauthCallback };
