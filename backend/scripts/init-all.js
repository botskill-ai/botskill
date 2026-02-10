/**
 * 完整初始化脚本
 * 初始化权限、角色、分类、管理员账户和系统设置
 * 运行: node scripts/init-all.js
 * 或: npm run init
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const Category = require('../models/Category');
const User = require('../models/User');
const Settings = require('../models/Settings');

// ==================== 权限定义 ====================
const DEFAULT_PERMISSIONS = [
  // 技能相关权限
  { name: 'skill_create', description: '创建技能', resource: 'skill', action: 'create' },
  { name: 'skill_read', description: '读取技能', resource: 'skill', action: 'read' },
  { name: 'skill_update', description: '更新技能', resource: 'skill', action: 'update' },
  { name: 'skill_delete', description: '删除技能', resource: 'skill', action: 'delete' },
  { name: 'skill_manage', description: '管理技能（所有操作）', resource: 'skill', action: 'manage' },
  
  // 用户相关权限
  { name: 'user_create', description: '创建用户（注册）', resource: 'user', action: 'create' },
  { name: 'user_read', description: '读取用户信息', resource: 'user', action: 'read' },
  { name: 'user_update', description: '更新用户信息', resource: 'user', action: 'update' },
  { name: 'user_delete', description: '删除用户', resource: 'user', action: 'delete' },
  { name: 'user_manage', description: '管理用户（所有操作）', resource: 'user', action: 'manage' },
  
  // 博客相关权限
  { name: 'blog_create', description: '创建博客', resource: 'blog', action: 'create' },
  { name: 'blog_read', description: '读取博客', resource: 'blog', action: 'read' },
  { name: 'blog_update', description: '更新博客', resource: 'blog', action: 'update' },
  { name: 'blog_delete', description: '删除博客', resource: 'blog', action: 'delete' },
  { name: 'blog_manage', description: '管理博客（所有操作）', resource: 'blog', action: 'manage' },
  
  // 分类相关权限
  { name: 'category_create', description: '创建分类', resource: 'category', action: 'create' },
  { name: 'category_read', description: '读取分类', resource: 'category', action: 'read' },
  { name: 'category_update', description: '更新分类', resource: 'category', action: 'update' },
  { name: 'category_delete', description: '删除分类', resource: 'category', action: 'delete' },
  { name: 'category_manage', description: '管理分类（所有操作）', resource: 'category', action: 'manage' },
  
  // 系统设置相关权限
  { name: 'settings_read', description: '读取系统设置', resource: 'settings', action: 'read' },
  { name: 'settings_update', description: '更新系统设置', resource: 'settings', action: 'update' },
  { name: 'settings_manage', description: '管理系统设置（所有操作）', resource: 'settings', action: 'manage' },
  
  // 权限管理相关权限
  { name: 'permission_read', description: '读取权限', resource: 'permission', action: 'read' },
  { name: 'permission_create', description: '创建权限', resource: 'permission', action: 'create' },
  { name: 'permission_update', description: '更新权限', resource: 'permission', action: 'update' },
  { name: 'permission_delete', description: '删除权限', resource: 'permission', action: 'delete' },
  { name: 'permission_manage', description: '管理权限（所有操作）', resource: 'permission', action: 'manage' },
  
  // 角色管理相关权限
  { name: 'role_read', description: '读取角色', resource: 'role', action: 'read' },
  { name: 'role_create', description: '创建角色', resource: 'role', action: 'create' },
  { name: 'role_update', description: '更新角色', resource: 'role', action: 'update' },
  { name: 'role_delete', description: '删除角色', resource: 'role', action: 'delete' },
  { name: 'role_manage', description: '管理角色（所有操作）', resource: 'role', action: 'manage' },
  
  // 验证码相关权限
  { name: 'captcha_read', description: '获取验证码', resource: 'captcha', action: 'read' },
];

// ==================== 角色定义 ====================
const DEFAULT_ROLES = [
  {
    name: 'user',
    description: '普通用户，可浏览和下载技能、阅读博客',
    permissionNames: [
      'skill_read',
      'user_create',
      'user_read',
      'user_update', // 可以更新自己的信息
      'blog_read',
      'category_read',
      'captcha_read',
    ]
  },
  {
    name: 'publisher',
    description: '发布者，可创建和管理自己的技能、发布博客',
    permissionNames: [
      'skill_create',
      'skill_read',
      'skill_update',
      'skill_delete',
      'user_create',
      'user_read',
      'user_update',
      'blog_create',
      'blog_read',
      'blog_update',
      'blog_delete',
      'category_read',
      'captcha_read',
    ]
  },
  {
    name: 'admin',
    description: '管理员，拥有所有权限',
    permissionNames: [] // 空数组表示拥有所有权限
  },
];

// ==================== 分类定义 ====================
const DEFAULT_CATEGORIES = [
  { name: 'ai', displayName: 'AI/ML', description: 'Artificial Intelligence and Machine Learning', order: 1 },
  { name: 'data', displayName: 'Data Processing', description: 'Data processing and analysis tools', order: 2 },
  { name: 'web', displayName: 'Web Development', description: 'Web development frameworks and tools', order: 3 },
  { name: 'devops', displayName: 'DevOps', description: 'DevOps and infrastructure tools', order: 4 },
  { name: 'security', displayName: 'Security', description: 'Security and authentication tools', order: 5 },
  { name: 'tools', displayName: 'Development Tools', description: 'General development tools and utilities', order: 6 },
];

// ==================== 默认管理员账户 ====================
const DEFAULT_ADMIN = {
  username: 'admin',
  email: 'admin@botskill.ai',
  password: 'admin123456', // 默认密码，生产环境请修改
  fullName: 'Administrator',
  role: 'admin'
};

// ==================== 初始化函数 ====================

/**
 * 初始化权限
 */
async function initPermissions() {
  console.log('\n📋 1. 初始化权限...');
  const permMap = {};
  let createdCount = 0;
  let existingCount = 0;

  for (const p of DEFAULT_PERMISSIONS) {
    let perm = await Permission.findOne({ name: p.name });
    if (!perm) {
      perm = await Permission.create(p);
      console.log(`   ✓ 创建权限: ${p.name} (${p.description})`);
      createdCount++;
    } else {
      // 更新已存在的权限描述（如果不同）
      if (perm.description !== p.description || perm.resource !== p.resource || perm.action !== p.action) {
        await Permission.findByIdAndUpdate(perm._id, {
          description: p.description,
          resource: p.resource,
          action: p.action
        });
        console.log(`   ~ 更新权限: ${p.name}`);
      } else {
        console.log(`   - 权限已存在: ${p.name}`);
      }
      existingCount++;
    }
    permMap[p.name] = perm._id;
  }

  console.log(`   📊 权限统计: 新建 ${createdCount} 个, 已存在 ${existingCount} 个, 总计 ${DEFAULT_PERMISSIONS.length} 个`);
  return permMap;
}

/**
 * 初始化角色
 */
async function initRoles(permMap) {
  console.log('\n👥 2. 初始化角色...');
  const allPermIds = Object.values(permMap);
  let createdCount = 0;
  let updatedCount = 0;

  for (const r of DEFAULT_ROLES) {
    const permissionIds = r.permissionNames.length === 0
      ? allPermIds
      : r.permissionNames.map(n => permMap[n]).filter(Boolean);

    let role = await Role.findOne({ name: r.name });
    if (!role) {
      role = await Role.create({
        name: r.name,
        description: r.description,
        permissions: permissionIds
      });
      console.log(`   ✓ 创建角色: ${r.name} (${r.description})`);
      console.log(`     权限数量: ${permissionIds.length}`);
      createdCount++;
    } else {
      await Role.findByIdAndUpdate(role._id, {
        description: r.description,
        permissions: permissionIds
      });
      console.log(`   ~ 更新角色: ${r.name}`);
      console.log(`     权限数量: ${permissionIds.length}`);
      updatedCount++;
    }
  }

  console.log(`   📊 角色统计: 新建 ${createdCount} 个, 更新 ${updatedCount} 个, 总计 ${DEFAULT_ROLES.length} 个`);
}

/**
 * 初始化分类
 */
async function initCategories() {
  console.log('\n📂 3. 初始化分类...');
  let createdCount = 0;
  let existingCount = 0;

  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await Category.findOne({ name: cat.name });
    if (!existing) {
      await Category.create(cat);
      console.log(`   ✓ 创建分类: ${cat.name} (${cat.displayName})`);
      createdCount++;
    } else {
      // 更新已存在的分类
      await Category.findByIdAndUpdate(existing._id, {
        displayName: cat.displayName,
        description: cat.description,
        order: cat.order,
        isActive: true
      });
      console.log(`   ~ 更新分类: ${cat.name}`);
      existingCount++;
    }
  }

  console.log(`   📊 分类统计: 新建 ${createdCount} 个, 更新 ${existingCount} 个, 总计 ${DEFAULT_CATEGORIES.length} 个`);
}

/**
 * 创建默认管理员账户
 */
async function createDefaultAdmin() {
  console.log('\n👤 4. 创建默认管理员账户...');
  
  try {
    // 检查是否已存在相同用户名或邮箱的用户
    const existingUser = await User.findOne({
      $or: [
        { username: DEFAULT_ADMIN.username },
        { email: DEFAULT_ADMIN.email }
      ]
    });

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`   - 管理员账户已存在: ${existingUser.email}`);
        console.log(`   - 用户名: ${existingUser.username}`);
        return;
      } else {
        // 如果存在但不是管理员，删除后重新创建
        await User.deleteOne({ _id: existingUser._id });
        console.log(`   ~ 删除已存在的用户: ${existingUser.email}`);
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

    // 创建管理员账户
    const adminUser = new User({
      username: DEFAULT_ADMIN.username,
      email: DEFAULT_ADMIN.email,
      password: hashedPassword,
      fullName: DEFAULT_ADMIN.fullName,
      role: DEFAULT_ADMIN.role,
      isActive: true
    });

    await adminUser.save();
    console.log(`   ✓ 管理员账户创建成功!`);
    console.log(`   📧 邮箱: ${DEFAULT_ADMIN.email}`);
    console.log(`   👤 用户名: ${DEFAULT_ADMIN.username}`);
    console.log(`   🔑 密码: ${DEFAULT_ADMIN.password}`);
    console.log(`   ⚠️  请在生产环境中修改默认密码!`);
  } catch (error) {
    console.error(`   ✗ 创建管理员账户失败: ${error.message}`);
    throw error;
  }
}

/**
 * 初始化系统设置
 */
async function initSettings() {
  console.log('\n⚙️  5. 初始化系统设置...');
  
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
      console.log(`   ✓ 创建默认系统设置`);
    } else {
      console.log(`   - 系统设置已存在`);
    }
    
    console.log(`   📊 站点标题: ${settings.siteTitle}`);
    console.log(`   📝 站点描述: ${settings.siteDescription}`);
  } catch (error) {
    console.error(`   ✗ 初始化系统设置失败: ${error.message}`);
    throw error;
  }
}

/**
 * 主初始化函数
 */
async function initAll() {
  try {
    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/botskill';
    console.log('🔌 正在连接数据库...');
    await mongoose.connect(mongoUri);
    console.log('✓ 数据库连接成功\n');

    // 执行初始化步骤
    const permMap = await initPermissions();
    await initRoles(permMap);
    await initCategories();
    await createDefaultAdmin();
    await initSettings();

    console.log('\n' + '='.repeat(50));
    console.log('✅ 初始化完成!');
    console.log('='.repeat(50));
    console.log('\n📝 下一步:');
    console.log('   1. 登录管理员账户并修改默认密码');
    console.log('   2. 配置OAuth认证（如需要）');
    console.log('   3. 根据需求调整系统设置');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ 初始化失败:');
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 数据库连接已关闭');
    process.exit(0);
  }
}

// 运行初始化
if (require.main === module) {
  initAll();
}

module.exports = { initAll };
