const express = require('express');
const { 
  getAllSkills, 
  getSkillById, 
  getSkillByName,
  getSkillVersion,
  downloadSkill,
  createSkill, 
  updateSkill, 
  deleteSkill, 
  searchSkills, 
  getPopularSkills, 
  getLatestSkills,
  getMySkills,
  // 管理员专用功能
  getAllSkillsForAdmin,
  createSkillForAdmin,
  createSkillFromForm,
  updateSkillForAdmin,
  updateSkillFromForm,
  deleteSkillForAdmin
} = require('../controllers/skillController');
const { uploadSkill, uploadParseSkill, parseSkillFromUrl } = require('../controllers/uploadController');
const { authenticateToken, authorizeRole, authorizeAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Admin-only routes (must be before /:id to avoid matching)
router.get('/admin/all', authenticateToken, authorizeAdmin, getAllSkillsForAdmin);
// 当前用户自己的技能（需登录，publisher 或 admin）
router.get('/my', authenticateToken, authorizeRole(['admin', 'publisher']), getMySkills);
router.post('/admin/create', authenticateToken, authorizeAdmin, createSkillForAdmin);
router.put('/admin/:id', authenticateToken, authorizeAdmin, updateSkillForAdmin);
// 发布者/管理员：创建和更新技能（Web 表单）
router.post('/create-from-form', authenticateToken, authorizeRole(['admin', 'publisher']), createSkillFromForm);
router.put('/update-from-form/:id', authenticateToken, authorizeRole(['admin', 'publisher']), updateSkillFromForm);
router.delete('/admin/:id', authenticateToken, authorizeAdmin, deleteSkillForAdmin);

// Public routes
router.get('/', getAllSkills);
router.get('/popular', getPopularSkills);
router.get('/latest', getLatestSkills);
router.get('/search', searchSkills);
router.get('/by-name/:name', getSkillByName);
router.get('/:id/versions/:version', getSkillVersion);
router.get('/:id/download', downloadSkill);
router.get('/:id', getSkillById);

// Parse only (for admin add skill - upload -> parse -> show -> save) - must be before /upload
router.post('/upload/parse', authenticateToken, authorizeRole(['admin', 'publisher']), upload.single('file'), uploadParseSkill);
router.post('/upload/parse-url', authenticateToken, authorizeRole(['admin', 'publisher']), parseSkillFromUrl);
// Upload skill (zip, tar.gz, or SKILL.md)
router.post('/upload', authenticateToken, authorizeRole(['admin', 'publisher']), upload.single('file'), uploadSkill);

// Authenticated routes (for publishers and admins)
router.post('/', authenticateToken, authorizeRole(['admin', 'publisher']), createSkill);
router.put('/:id', authenticateToken, authorizeRole(['admin', 'publisher']), updateSkill);
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'publisher']), deleteSkill);

module.exports = router;