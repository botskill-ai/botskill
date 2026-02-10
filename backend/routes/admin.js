const express = require('express');
const { 
  getDashboardStats, 
  getUsersForAdmin, 
  getSkillsForAdmin, 
  updateSkillStatus, 
  updateUserStatus,
  updateUserForAdmin,
  createUserForAdmin,
  resetUserPassword,
  deleteUserForAdmin,
  manageUserRoles,
  getRoles,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions,
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  assignRoleToUser,
  getUsersWithRoles,
  getSettings,
  updateSettings,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/adminController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// 仪表板统计
router.get('/dashboard', authenticateToken, authorizeAdmin, getDashboardStats);

// 用户管理
router.get('/users', authenticateToken, authorizeAdmin, getUsersForAdmin);
router.get('/users-with-roles', authenticateToken, authorizeAdmin, getUsersWithRoles);
router.post('/users', authenticateToken, authorizeAdmin, createUserForAdmin);
router.put('/users/:id', authenticateToken, authorizeAdmin, updateUserForAdmin);
router.put('/users/:id/role', authenticateToken, authorizeAdmin, manageUserRoles);
router.put('/users/:id/status', authenticateToken, authorizeAdmin, updateUserStatus);
router.post('/users/:id/reset-password', authenticateToken, authorizeAdmin, resetUserPassword);
router.delete('/users/:id', authenticateToken, authorizeAdmin, deleteUserForAdmin);

// 技能管理
router.get('/skills', authenticateToken, authorizeAdmin, getSkillsForAdmin);
router.put('/skills/:id/status', authenticateToken, authorizeAdmin, updateSkillStatus);

// 角色管理
router.get('/roles', authenticateToken, authorizeAdmin, getRoles);
router.get('/roles/:roleName', authenticateToken, authorizeAdmin, getRoleByName);
router.post('/roles', authenticateToken, authorizeAdmin, createRole);
router.put('/roles/:roleName', authenticateToken, authorizeAdmin, updateRole);
router.delete('/roles/:roleName', authenticateToken, authorizeAdmin, deleteRole);
router.put('/roles/:roleName/permissions', authenticateToken, authorizeAdmin, updateRolePermissions);

// 权限管理
router.get('/permissions', authenticateToken, authorizeAdmin, getPermissions);
router.post('/permissions', authenticateToken, authorizeAdmin, createPermission);
router.put('/permissions/:id', authenticateToken, authorizeAdmin, updatePermission);
router.delete('/permissions/:id', authenticateToken, authorizeAdmin, deletePermission);

// 用户角色分配
router.post('/assign-role', authenticateToken, authorizeAdmin, assignRoleToUser);

// 系统设置
router.get('/settings', authenticateToken, authorizeAdmin, getSettings);
router.put('/settings', authenticateToken, authorizeAdmin, updateSettings);

// 分类管理
router.get('/categories', authenticateToken, authorizeAdmin, getCategories);
router.post('/categories', authenticateToken, authorizeAdmin, createCategory);
router.put('/categories/:id', authenticateToken, authorizeAdmin, updateCategory);
router.delete('/categories/:id', authenticateToken, authorizeAdmin, deleteCategory);

module.exports = router;