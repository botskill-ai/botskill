const express = require('express');
const path = require('path');
const fs = require('fs');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Passport (loads OAuth strategies)
require('./config/passport');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const skillRoutes = require('./routes/skills');
const blogRoutes = require('./routes/blogs');
const adminRoutes = require('./routes/admin');
const captchaRoutes = require('./routes/captcha');
const seoRoutes = require('./routes/seo');
const { getPublicSiteSettings, getPublicCategories } = require('./controllers/adminController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/botskill')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/captcha', captchaRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 公开站点设置（无需认证，用于 Header/Footer/页面标题）
app.get('/api/site-settings', getPublicSiteSettings);

// 公开分类列表（无需认证，只返回激活的分类）
app.get('/api/categories', getPublicCategories);

// SEO：sitemap.xml、robots.txt（必须在静态文件之前，否则会被 SPA 吞掉）
app.use(seoRoutes);

// 静态文件服务：上传的图片
const uploadsDir = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsDir)) {
  app.use('/api/uploads', express.static(uploadsDir));
}

// 生产环境：托管前端静态文件（Docker 构建时 client/dist 复制到 public）
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found' 
  });
});

// 监听所有接口，支持 Docker 容器访问
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server is running on ${HOST}:${PORT}`);
});

module.exports = app;