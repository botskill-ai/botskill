const User = require('../models/User');
const Skill = require('../models/Skill');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const Settings = require('../models/Settings');
const Category = require('../models/Category');

const CACHE_TTL_MS = 60 * 1000; // 60 秒
let statsCache = { data: null, expiresAt: 0 };

const getStartOfTodayUTC = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const getDashboardStats = async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === '1';

    if (!forceRefresh && statsCache.data && Date.now() < statsCache.expiresAt) {
      return res.json({
        success: true,
        data: { stats: statsCache.data }
      });
    }

    const startOfToday = getStartOfTodayUTC();

    const [
      totalUsers,
      totalSkills,
      publishedSkills,
      pendingSkills,
      totalDownloadsResult,
      activeToday
    ] = await Promise.all([
      User.countDocuments(),
      Skill.countDocuments(),
      Skill.countDocuments({ status: 'published' }),
      Skill.countDocuments({ status: 'pending_review' }),
      Skill.aggregate([{ $group: { _id: null, total: { $sum: '$downloads' } } }]),
      User.countDocuments({ lastLoginAt: { $gte: startOfToday } })
    ]);

    const stats = {
      totalUsers,
      totalSkills,
      publishedSkills,
      pendingSkills,
      totalDownloads: totalDownloadsResult.length > 0 ? totalDownloadsResult[0].total : 0,
      activeToday
    };

    statsCache = { data: stats, expiresAt: Date.now() + CACHE_TTL_MS };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching dashboard stats',
      message: error.message
    });
  }
};

const getUsersForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments();
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching users',
      message: error.message
    });
  }
};

const getSkillsForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const statusFilter = req.query.status || null;
    
    const query = {};
    if (statusFilter) {
      query.status = statusFilter;
    }
    
    const skills = await Skill.find(query)
      .populate('author', 'username fullName avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Skill.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        skills,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalSkills: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching skills',
      message: error.message
    });
  }
};

const updateSkillStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['draft', 'published', 'archived', 'pending_review'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }
    
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Skill not found'
      });
    }
    
    const updatedSkill = await Skill.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(status === 'published' && !skill.publishedAt ? { publishedAt: new Date() } : {})
      },
      { new: true, runValidators: true }
    ).populate('author', 'username fullName avatar');
    
    res.json({
      success: true,
      message: 'Skill status updated successfully',
      data: { skill: updatedSkill }
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
      error: 'Server error while updating skill status',
      message: error.message
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isActive must be a boolean' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      message: 'User status updated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while updating user status',
      message: error.message
    });
  }
};

// 管理员更新用户信息（可修改 username, email, fullName, bio）
const updateUserForAdmin = async (req, res) => {
  try {
    const { username, email, fullName, bio } = req.body;
    const userId = req.params.id;

    // 不能修改自己的部分敏感信息（可选限制，这里允许管理员修改自己）
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const updateData = {};
    if (username !== undefined) {
      const existing = await User.findOne({ username, _id: { $ne: userId } });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Username already taken' });
      }
      updateData.username = username;
    }
    if (email !== undefined) {
      const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Email already taken' });
      }
      updateData.email = email.toLowerCase();
    }
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
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
      error: 'Server error while updating user',
      message: error.message
    });
  }
};

// 管理员重置用户密码
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.password = newPassword;
    await user.save(); // pre-save hook will hash the password

    res.json({
      success: true,
      message: 'Password reset successfully'
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
      error: 'Server error while resetting password',
      message: error.message
    });
  }
};

// 管理员删除用户
// 管理员创建用户
const createUserForAdmin = async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }

    // 验证密码长度
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // 验证角色
    const validRoles = ['user', 'publisher', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be one of: user, publisher, admin'
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email or username'
      });
    }

    // 创建新用户
    const user = new User({
      username,
      email: email.toLowerCase(),
      password,
      fullName: fullName || '',
      role: role || 'user',
      isActive: true
    });

    await user.save();

    // 返回用户信息（不包含密码）
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse }
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
    
    if (error.code === 11000) {
      // MongoDB duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while creating user',
      message: error.message
    });
  }
};

const deleteUserForAdmin = async (req, res) => {
  try {
    const userId = req.params.id;

    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while deleting user',
      message: error.message
    });
  }
};

const manageUserRoles = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'publisher', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role value'
      });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Prevent demoting oneself as admin
    if (user._id.toString() === req.user.userId && role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot change your own role'
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user: updatedUser }
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
      error: 'Server error while updating user role',
      message: error.message
    });
  }
};

// 角色管理相关功能
const getRoles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    
    const roles = await Role.find(query)
      .populate('permissions', 'name description resource action')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Role.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        roles,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRoles: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching roles',
      message: error.message
    });
  }
};

const getRoleByName = async (req, res) => {
  try {
    const role = await Role.findOne({ name: req.params.roleName })
      .populate('permissions', 'name description resource action');
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }
    
    res.json({
      success: true,
      data: { role }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching role',
      message: error.message
    });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, description, permissionIds } = req.body;
    
    // 检查角色名是否已存在
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        error: 'Role with this name already exists'
      });
    }
    
    // 创建新角色
    const newRole = new Role({
      name,
      description,
      permissions: permissionIds || []
    });
    
    await newRole.save();
    
    // 填充权限信息
    await newRole.populate('permissions', 'name description resource action');
    
    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: { role: newRole }
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
      error: 'Server error while creating role',
      message: error.message
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { description, permissionIds, isActive } = req.body;
    
    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (permissionIds !== undefined) updateData.permissions = permissionIds;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedRole = await Role.findOneAndUpdate(
      { name: req.params.roleName },
      updateData,
      { new: true, runValidators: true }
    ).populate('permissions', 'name description resource action');
    
    if (!updatedRole) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Role updated successfully',
      data: { role: updatedRole }
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
      error: 'Server error while updating role',
      message: error.message
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const role = await Role.findOneAndDelete({ name: req.params.roleName });
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }
    
    // 也要从所有用户中移除该角色（如果有的话）
    await User.updateMany(
      { role: req.params.roleName },
      { $set: { role: 'user' } } // 默认降级到普通用户
    );
    
    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while deleting role',
      message: error.message
    });
  }
};

const updateRolePermissions = async (req, res) => {
  try {
    const { permissionIds } = req.body;
    
    const role = await Role.findOne({ name: req.params.roleName });
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }
    
    role.permissions = permissionIds;
    await role.save();
    
    // 填充权限信息
    await role.populate('permissions', 'name description resource action');
    
    res.json({
      success: true,
      message: 'Role permissions updated successfully',
      data: { role }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while updating role permissions',
      message: error.message
    });
  }
};

// 权限管理相关功能
const getPermissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const resourceFilter = req.query.resource || null;
    const actionFilter = req.query.action || null;
    
    const query = {};
    if (resourceFilter) {
      query.resource = resourceFilter;
    }
    if (actionFilter) {
      query.action = actionFilter;
    }
    
    const permissions = await Permission.find(query)
      .sort({ resource: 1, action: 1, name: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Permission.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        permissions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPermissions: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching permissions',
      message: error.message
    });
  }
};

const createPermission = async (req, res) => {
  try {
    const { name, description, resource, action } = req.body;
    
    // 检查权限名是否已存在
    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        error: 'Permission with this name already exists'
      });
    }
    
    const newPermission = new Permission({
      name,
      description,
      resource,
      action
    });
    
    await newPermission.save();
    
    res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      data: { permission: newPermission }
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
      error: 'Server error while creating permission',
      message: error.message
    });
  }
};

const updatePermission = async (req, res) => {
  try {
    const { description, resource, action } = req.body;
    
    const updateData = {};
    if (description) updateData.description = description;
    if (resource) updateData.resource = resource;
    if (action) updateData.action = action;
    updateData.updatedAt = Date.now();
    
    const updatedPermission = await Permission.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedPermission) {
      return res.status(404).json({
        success: false,
        error: 'Permission not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Permission updated successfully',
      data: { permission: updatedPermission }
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
      error: 'Server error while updating permission',
      message: error.message
    });
  }
};

const deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.params.id);
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        error: 'Permission not found'
      });
    }
    
    // 从所有角色中移除该权限
    await Role.updateMany(
      { permissions: req.params.id },
      { $pull: { permissions: req.params.id } }
    );
    
    res.json({
      success: true,
      message: 'Permission deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while deleting permission',
      message: error.message
    });
  }
};

// 用户角色分配功能
const assignRoleToUser = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        error: 'User ID and role are required'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // 验证角色是否存在
    const roleExists = await Role.findOne({ name: role });
    if (!roleExists && !['user', 'publisher', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role value'
      });
    }
    
    // 防止管理员更改自己的角色
    if (user._id.toString() === req.user.userId && role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot change your own role'
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'User role assigned successfully',
      data: { user: updatedUser }
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
      error: 'Server error while assigning role to user',
      message: error.message
    });
  }
};

// 获取所有用户及其角色
const getUsersWithRoles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const roleFilter = req.query.role || null;
    
    const query = {};
    if (roleFilter) {
      query.role = roleFilter;
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching users with roles',
      message: error.message
    });
  }
};

const getPublicSiteSettings = async (req, res) => {
  try {
    const settings = await Settings.get();
    res.json({
      success: true,
      data: {
        siteTitle: settings.siteTitle,
        siteDescription: settings.siteDescription,
        maintenanceMode: settings.maintenanceMode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch site settings',
      message: error.message
    });
  }
};

const getSettings = async (req, res) => {
  try {
    const settings = await Settings.get();
    res.json({
      success: true,
      data: {
        siteTitle: settings.siteTitle,
        siteDescription: settings.siteDescription,
        require2FA: settings.require2FA,
        enableEmailVerification: settings.enableEmailVerification,
        maxFileSize: settings.maxFileSize,
        allowedFileTypes: settings.allowedFileTypes,
        maintenanceMode: settings.maintenanceMode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
      message: error.message
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    const settings = await Settings.updateSettings(updates);
    res.json({
      success: true,
      data: {
        siteTitle: settings.siteTitle,
        siteDescription: settings.siteDescription,
        require2FA: settings.require2FA,
        enableEmailVerification: settings.enableEmailVerification,
        maxFileSize: settings.maxFileSize,
        allowedFileTypes: settings.allowedFileTypes,
        maintenanceMode: settings.maintenanceMode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
      message: error.message
    });
  }
};

// 公开获取分类（只返回激活的分类，无需认证）
const getPublicCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select('name displayName description icon order');
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching categories',
      message: error.message
    });
  }
};

// 分类管理
const getCategories = async (req, res) => {
  try {
    // 如果没有提供分页参数，返回所有分类
    if (!req.query.page && !req.query.limit) {
      const categories = await Category.find()
        .sort({ order: 1, createdAt: 1 });
      
      res.json({
        success: true,
        data: { categories }
      });
      return;
    }
    
    // 分页模式
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const categories = await Category.find()
      .sort({ order: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Category.countDocuments();
    
    res.json({
      success: true,
      data: {
        categories,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCategories: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching categories',
      message: error.message
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, displayName, description, icon, order } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Name and displayName are required'
      });
    }

    // 检查分类名是否已存在
    const existing = await Category.findOne({ name: name.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }

    const category = new Category({
      name: name.toLowerCase(),
      displayName,
      description: description || '',
      icon: icon || '',
      order: order || 0,
      isActive: true
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
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
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error while creating category',
      message: error.message
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, description, icon, order, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    if (displayName !== undefined) category.displayName = displayName;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
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
      error: 'Server error while updating category',
      message: error.message
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // 检查是否有技能使用此分类（category 字段存储的是分类名称）
    const skillsCount = await Skill.countDocuments({ category: category.name });
    if (skillsCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category: ${skillsCount} skill(s) are using this category`
      });
    }

    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while deleting category',
      message: error.message
    });
  }
};

module.exports = {
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
  getPublicSiteSettings,
  getPublicCategories,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};