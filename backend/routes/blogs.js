const express = require('express');
const {
  getAllBlogs,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  adminGetAllBlogs,
  uploadBlogImage,
} = require('../controllers/blogController');
const { authenticateToken, authorizeAdmin, authorizeRole } = require('../middleware/auth');
const { imageUpload } = require('../middleware/imageUpload');

const router = express.Router();

// 公开路由
router.get('/', getAllBlogs);
router.get('/slug/:slug', getBlogBySlug);

// 需要认证的路由（创建博客需要publisher或admin角色）
router.post('/', authenticateToken, authorizeRole(['publisher', 'admin']), createBlog);

// 图片上传（需要publisher或admin角色）
router.post('/upload-image', authenticateToken, authorizeRole(['publisher', 'admin']), imageUpload.single('image'), uploadBlogImage);

// 需要认证的路由（更新和删除需要是作者或管理员）
router.get('/:id', authenticateToken, getBlogById);
router.put('/:id', authenticateToken, updateBlog);
router.delete('/:id', authenticateToken, deleteBlog);

// 管理员路由
router.get('/admin/all', authenticateToken, authorizeAdmin, adminGetAllBlogs);

module.exports = router;
