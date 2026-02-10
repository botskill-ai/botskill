const express = require('express');
const passport = require('passport');
const { register, login, logout, refresh, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { oauthCallback } = require('../config/passport');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authenticateToken, getCurrentUser);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// OAuth: 跳转到第三方授权
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.redirect(`${FRONTEND_URL}/login?oauth_error=${encodeURIComponent('Google login is not configured')}`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) return next(err);
    req.user = user;
    req.authInfo = info;
    oauthCallback('google')(req, res);
  })(req, res, next);
});

router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.redirect(`${FRONTEND_URL}/login?oauth_error=${encodeURIComponent('GitHub login is not configured')}`);
  }
  passport.authenticate('github', { scope: ['user:email'], session: false })(req, res, next);
});
router.get('/github/callback', (req, res, next) => {
  passport.authenticate('github', { session: false }, (err, user, info) => {
    if (err) return next(err);
    req.user = user;
    req.authInfo = info;
    oauthCallback('github')(req, res);
  })(req, res, next);
});

module.exports = router;