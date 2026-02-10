const AdmZip = require('adm-zip');
const Skill = require('../models/Skill');
const User = require('../models/User');
const Category = require('../models/Category');
const { NAME_REGEX } = require('../utils/parseSkillMd');

/** 确保 author 有默认值（作者用户被删除时 populate 返回 null） */
function normalizeAuthor(skill) {
  if (!skill.author || (!skill.author.username && !skill.author.fullName)) {
    skill.author = { username: 'unknown', fullName: '未知' };
  }
  return skill;
}

const getAllSkills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { status: 'published' }; // Only return published skills
    
    const skills = await Skill.find(query)
      .populate('author', 'username fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    skills.forEach(normalizeAuthor);
    const total = await Skill.countDocuments(query);
    
    res.json({
      skills,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalSkills: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching skills' });
  }
};

const getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('author', 'username fullName avatar');
    
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    if (skill.status !== 'published') {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    normalizeAuthor(skill);
    // Legacy: ensure versions array for backward compatibility
    if (!skill.versions || skill.versions.length === 0) {
      skill.versions = [{
        version: skill.version || '1.0.0',
        description: skill.description,
        content: '',
        tags: skill.tags || [],
        createdAt: skill.createdAt,
      }];
    }
    
    if (req.query.incrementView) {
      await Skill.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });
      skill.downloads += 1;
    }
    
    res.json({ skill });
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching skill' });
  }
};

/**
 * Build SKILL.md content from skill and version data (Agent Skills spec format)
 */
function buildSkillMdContent(skill, version) {
  const meta = {
    name: skill.name,
    description: String(version.description || skill.description || ''),
    license: skill.license || 'MIT',
    metadata: {
      version: String(version.version || '1.0.0'),
    },
  };
  if (skill.compatibility) meta.compatibility = skill.compatibility;
  if (skill.allowedTools?.length) meta['allowed-tools'] = skill.allowedTools.join(' ');
  if (skill.category) meta.category = skill.category;
  const tagsToUse = (version.tags && version.tags.length > 0) ? version.tags : skill.tags;
  if (tagsToUse?.length) meta.tags = tagsToUse;
  const authorName = skill.author?.username || skill.author?.fullName;
  if (authorName) meta.metadata.author = authorName;

  const yaml = require('js-yaml');
  const frontmatter = '---\n' + yaml.dump(meta, { lineWidth: -1 }).trim() + '\n---\n';
  return frontmatter + (version.content || '');
}

/**
 * Compare semver: returns 1 if a > b, -1 if a < b, 0 if equal
 */
function compareVersions(a, b) {
  if (!a || !b) return 0;
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

/**
 * Download skill as zip (skill directory with SKILL.md)
 * GET /skills/:id/download?version=x.y.z
 * When no version: returns latest by semver
 * When version has filePath (uploaded zip): returns that file; else builds from content
 */
const downloadSkill = async (req, res) => {
  const fs = require('fs').promises;

  try {
    const skill = await Skill.findById(req.params.id)
      .populate('author', 'username fullName avatar');
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    if (skill.status !== 'published') {
      return res.status(404).json({ error: 'Skill not found' });
    }
    normalizeAuthor(skill);

    const versions = skill.versions || [];
    const versionParam = req.query.version;
    let ver;
    if (versionParam) {
      ver = versions.find(v => v.version === versionParam);
    } else {
      ver = versions.length > 0
        ? versions.reduce((a, b) => compareVersions(a.version, b.version) >= 0 ? a : b)
        : null;
    }
    if (!ver && skill.version) {
      ver = {
        version: skill.version,
        description: skill.description,
        content: '',
        tags: skill.tags,
      };
    }
    if (!ver) {
      return res.status(404).json({ error: 'No version available' });
    }

    await Skill.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });

    const dirName = skill.name;
    const filename = `${dirName}-${ver.version}.zip`;

    if (ver.filePath) {
      try {
        const stat = await fs.stat(ver.filePath);
        if (stat.isFile()) {
          const buffer = await fs.readFile(ver.filePath);
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
          res.setHeader('Content-Length', buffer.length);
          return res.send(buffer);
        }
      } catch (_) {}
    }

    const skillMdContent = buildSkillMdContent(skill, ver);
    const zip = new AdmZip();
    zip.addFile(`${dirName}/SKILL.md`, Buffer.from(skillMdContent, 'utf-8'));
    const zipBuffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', zipBuffer.length);
    res.send(zipBuffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
};

/**
 * Parse specifier: name@version or name
 * Returns { name, version }
 */
function parseSpecifier(spec) {
  const s = spec.trim();
  const atIdx = s.lastIndexOf('@');
  if (atIdx < 0) return { name: s, version: undefined };
  return {
    name: s.slice(0, atIdx).trim(),
    version: s.slice(atIdx + 1).trim() || undefined,
  };
}

/**
 * Resolve skill by name (for CLI get name@version)
 * GET /skills/by-name/:specifier  (specifier = name or name%401.0.0)
 */
const getSkillByName = async (req, res) => {
  try {
    const raw = decodeURIComponent(req.params.name || req.params.specifier || '').trim();
    if (!raw) {
      return res.status(400).json({ error: 'Skill name is required (e.g. pdf-parser or pdf-parser@1.0.0)' });
    }
    const { name, version } = parseSpecifier(raw);

    const skill = await Skill.findOne({
      status: 'published',
      $or: [
        { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        { slug: name },
      ],
    })
      .populate('author', 'username fullName avatar')
      .sort({ downloads: -1 });

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    res.json({ skill, requestedVersion: version });
  } catch (error) {
    res.status(500).json({ error: 'Server error while resolving skill' });
  }
};

const getSkillVersion = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('author', 'username fullName avatar');
    
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    if (skill.status !== 'published') {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    const ver = (skill.versions || []).find(v => v.version === req.params.version);
    if (!ver) {
      const legacy = !skill.versions?.length && skill.version === req.params.version;
      if (legacy) {
        return res.json({
          skill,
          version: {
            version: skill.version,
            description: skill.description,
            content: '',
            tags: skill.tags || [],
          },
        });
      }
      return res.status(404).json({ error: 'Version not found' });
    }
    
    res.json({
      skill,
      version: {
        version: ver.version,
        description: ver.description,
        content: ver.content,
        tags: ver.tags || [],
        createdAt: ver.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching skill version' });
  }
};

const createSkill = async (req, res) => {
  try {
    const { name, description, version, category, tags, repositoryUrl, documentationUrl, demoUrl, license } = req.body;
    
    // Validate that user is authorized to publish
    const user = await User.findById(req.user.userId);
    if (!user || !['admin', 'publisher'].includes(user.role)) {
      return res.status(403).json({ error: 'Not authorized to publish skills' });
    }
    
    const skill = new Skill({
      name,
      description,
      version,
      category,
      tags,
      repositoryUrl,
      documentationUrl,
      demoUrl,
      license,
      author: req.user.userId,
      status: 'pending_review',
      versions: [{ version, description, content: '', createdAt: new Date() }],
    });
    
    await skill.save();
    
    // Populate author info before returning
    await skill.populate('author', 'username fullName avatar');
    
    res.status(201).json({
      message: 'Skill created successfully and is pending review',
      skill
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    
    res.status(500).json({ error: 'Server error while creating skill' });
  }
};

const updateSkill = async (req, res) => {
  try {
    const { name, description, version, category, tags, repositoryUrl, documentationUrl, demoUrl, license, status } = req.body;
    
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    // Check authorization - owner or admin can update
    if (skill.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this skill' });
    }
    
    // Prepare update object
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (version) updateData.version = version;
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags;
    if (repositoryUrl) updateData.repositoryUrl = repositoryUrl;
    if (documentationUrl) updateData.documentationUrl = documentationUrl;
    if (demoUrl) updateData.demoUrl = demoUrl;
    if (license) updateData.license = license;
    if (status && req.user.role === 'admin') updateData.status = status; // Only admins can change status
    updateData.lastUpdated = Date.now();
    
    const updatedSkill = await Skill.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'username fullName avatar');
    
    res.json({
      message: 'Skill updated successfully',
      skill: updatedSkill
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    
    res.status(500).json({ error: 'Server error while updating skill' });
  }
};

const deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    // Check authorization - owner or admin can delete
    if (skill.author.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this skill' });
    }
    
    await Skill.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error while deleting skill' });
  }
};

const searchSkills = async (req, res) => {
  try {
    const { q, category, tags, page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = { status: 'published' };
    
    if (q) {
      query.$text = { $search: q }; // Use text index for search
    }
    
    if (category) {
      query.category = category;
    }
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray.map(tag => new RegExp(tag.trim(), 'i')) };
    }
    
    const skills = await Skill.find(query)
      .populate('author', 'username fullName avatar')
      .sort({ downloads: -1 }) // Sort by downloads by default
      .skip(skip)
      .limit(parseInt(limit));
    skills.forEach(normalizeAuthor);
    const total = await Skill.countDocuments(query);
    
    res.json({
      skills,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalSkills: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error while searching skills' });
  }
};

const getPopularSkills = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const skills = await Skill.find({ status: 'published' })
      .populate('author', 'username fullName avatar')
      .sort({ downloads: -1 })
      .limit(limit);
    skills.forEach(normalizeAuthor);
    res.json({ skills });
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching popular skills' });
  }
};

const getLatestSkills = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const skills = await Skill.find({ status: 'published' })
      .populate('author', 'username fullName avatar')
      .sort({ createdAt: -1 })
      .limit(limit);
    skills.forEach(normalizeAuthor);
    res.json({ skills });
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching latest skills' });
  }
};

// 当前用户自己的技能（publisher/admin 登录后）
const getMySkills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const categoryFilter = req.query.category || null;
    const statusFilter = req.query.status || null;
    const search = req.query.q || req.query.search || null;

    const query = { author: req.user.userId };
    if (categoryFilter) query.category = categoryFilter;
    if (statusFilter) query.status = statusFilter;
    if (search && search.trim()) {
      query.$or = [
        { name: new RegExp(search.trim(), 'i') },
        { description: new RegExp(search.trim(), 'i') },
        { tags: new RegExp(search.trim(), 'i') },
      ];
    }

    const skills = await Skill.find(query)
      .populate('author', 'username fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    skills.forEach(normalizeAuthor);
    const total = await Skill.countDocuments(query);

    res.json({
      skills,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalSkills: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching your skills' });
  }
};

// 管理员专用的技能管理功能
const getAllSkillsForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // 管理员可以看到所有状态的技能
    const statusFilter = req.query.status || null;
    const authorFilter = req.query.author || null;
    const categoryFilter = req.query.category || null;
    const search = req.query.q || req.query.search || null;
    
    const query = {};
    if (statusFilter) {
      query.status = statusFilter;
    }
    if (authorFilter) {
      query.author = authorFilter;
    }
    if (categoryFilter) {
      query.category = categoryFilter;
    }
    // 优化搜索：使用文本索引进行搜索（性能更好）
    if (search && search.trim()) {
      const trimmedSearch = search.trim();
      // 使用文本搜索（需要文本索引支持，已在模型中定义）
      query.$text = { $search: trimmedSearch };
    }
    
    // 并行执行查询和计数，提高性能
    const [skillsResult, total] = await Promise.all([
      Skill.find(query)
        .populate('author', 'username fullName avatar email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Skill.countDocuments(query)
    ]);
    
    // 处理 author 信息
    const skills = skillsResult.map(skill => {
      normalizeAuthor(skill);
      return skill;
    });
    
    res.json({
      skills,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalSkills: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error in getAllSkillsForAdmin:', error);
    res.status(500).json({ error: 'Server error while fetching skills for admin' });
  }
};

const createSkillForAdmin = async (req, res) => {
  try {
    const { name, description, version, category, tags, repositoryUrl, documentationUrl, demoUrl, license, compatibility, allowedTools, status, authorId, content } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Skill name is required' });
    }
    const nameTrimmed = name.trim().toLowerCase();
    if (nameTrimmed.length > 64) {
      return res.status(400).json({ error: 'Skill name cannot exceed 64 characters' });
    }
    if (!NAME_REGEX.test(nameTrimmed)) {
      return res.status(400).json({ error: 'Skill name must contain only lowercase letters, numbers, hyphens, @, and /; must not start or end with hyphen' });
    }

    const ver = version || '1.0.0';
    const versionTags = Array.isArray(tags) ? tags : (tags ? [].concat(tags) : []);
    const versionDoc = {
      version: ver,
      description: description || '',
      content: content || '',
      tags: versionTags,
      createdAt: new Date(),
    };

    const existing = await Skill.findOne({
      name: { $regex: new RegExp(`^${nameTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existing) {
      const versionExists = existing.versions?.some(v => v.version === ver);
      const overwrite = req.body.overwrite === true || req.body.overwrite === 'true';
      if (versionExists && !overwrite) {
        return res.status(400).json({
          error: 'VERSION_EXISTS',
          message: `Version ${ver} already exists. Overwrite?`,
          version: ver,
        });
      }
      if (versionExists && overwrite) {
        const idx = existing.versions.findIndex(v => v.version === ver);
        existing.versions[idx] = versionDoc;
      } else {
        existing.versions.push(versionDoc);
      }
      existing.description = description || existing.description;
      existing.version = ver;
      if (category) existing.category = category;
      existing.tags = versionTags.length > 0 ? versionTags : existing.tags;
      if (repositoryUrl !== undefined) existing.repositoryUrl = repositoryUrl;
      if (documentationUrl !== undefined) existing.documentationUrl = documentationUrl;
      if (demoUrl !== undefined) existing.demoUrl = demoUrl;
      if (license) existing.license = license;
      if (compatibility !== undefined) existing.compatibility = compatibility;
      if (allowedTools !== undefined) existing.allowedTools = Array.isArray(allowedTools) ? allowedTools : allowedTools;
      existing.lastUpdated = new Date();
      await existing.save();
      await existing.populate('author', 'username fullName avatar email');
      return res.status(201).json({
        message: `Version ${ver} added successfully`,
        skill: existing,
      });
    }

    // 新建技能
    const skill = new Skill({
      name: nameTrimmed,
      description,
      version: ver,
      category: categoryName,
      tags,
      repositoryUrl,
      documentationUrl,
      demoUrl,
      license,
      compatibility,
      allowedTools: Array.isArray(allowedTools) ? allowedTools : undefined,
      author: authorId || req.user.userId,
      status: status || 'published',
      versions: [versionDoc],
    });
    
    await skill.save();
    await skill.populate('author', 'username fullName avatar email');
    
    res.status(201).json({
      message: 'Skill created successfully by admin',
      skill
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    
    res.status(500).json({ error: 'Server error while creating skill for admin' });
  }
};

/**
 * 发布技能（管理员或发布者）
 * 管理员：可设置任意状态、指定作者
 * 发布者：仅能创建自己的技能，状态为 draft 或 pending_review
 */
const createSkillFromForm = async (req, res) => {
  try {
    const { name, description, version, category, tags, repositoryUrl, documentationUrl, demoUrl, license, compatibility, allowedTools, status, authorId, content } = req.body;
    const isAdmin = req.user.role === 'admin';

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Skill name is required' });
    }
    const nameTrimmed = name.trim().toLowerCase();
    if (nameTrimmed.length > 64) {
      return res.status(400).json({ error: 'Skill name cannot exceed 64 characters' });
    }
    if (!NAME_REGEX.test(nameTrimmed)) {
      return res.status(400).json({ error: 'Skill name must contain only lowercase letters, numbers, hyphens, @, and /; must not start or end with hyphen' });
    }

    // Validate category exists and is active
    const categoryName = (category || 'tools').toLowerCase();
    const categoryDoc = await Category.findOne({ name: categoryName, isActive: true });
    if (!categoryDoc) {
      return res.status(400).json({ error: `Category "${categoryName}" does not exist or is not active` });
    }

    const ver = version || '1.0.0';
    const versionTags = Array.isArray(tags) ? tags : (tags ? [].concat(tags) : []);
    const versionDoc = {
      version: ver,
      description: description || '',
      content: content || '',
      tags: versionTags,
      createdAt: new Date(),
    };

    const existing = await Skill.findOne({
      name: { $regex: new RegExp(`^${nameTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existing) {
      if (!isAdmin && existing.author.toString() !== req.user.userId) {
        return res.status(400).json({ error: 'Skill name already exists' });
      }
      const versionExists = existing.versions?.some(v => v.version === ver);
      const overwrite = req.body.overwrite === true || req.body.overwrite === 'true';
      if (versionExists && !overwrite) {
        return res.status(400).json({
          error: 'VERSION_EXISTS',
          message: `Version ${ver} already exists. Overwrite?`,
          version: ver,
        });
      }
      if (versionExists && overwrite) {
        const idx = existing.versions.findIndex(v => v.version === ver);
        existing.versions[idx] = versionDoc;
      } else {
        existing.versions.push(versionDoc);
      }
      existing.description = description || existing.description;
      existing.version = ver;
      if (category) existing.category = categoryName;
      existing.tags = versionTags.length > 0 ? versionTags : existing.tags;
      if (repositoryUrl !== undefined) existing.repositoryUrl = repositoryUrl;
      if (documentationUrl !== undefined) existing.documentationUrl = documentationUrl;
      if (demoUrl !== undefined) existing.demoUrl = demoUrl;
      if (license) existing.license = license;
      if (compatibility !== undefined) existing.compatibility = compatibility;
      if (allowedTools !== undefined) existing.allowedTools = Array.isArray(allowedTools) ? allowedTools : allowedTools;
      existing.lastUpdated = new Date();
      await existing.save();
      await existing.populate('author', 'username fullName avatar email');
      return res.status(201).json({
        message: `Version ${ver} added successfully`,
        skill: existing,
      });
    }

    const effectiveAuthor = isAdmin && authorId ? authorId : req.user.userId;
    let effectiveStatus = status || 'pending_review';
    if (!isAdmin) {
      effectiveStatus = (effectiveStatus === 'draft') ? 'draft' : 'pending_review';
    }

    const skill = new Skill({
      name: nameTrimmed,
      description,
      version: ver,
      category: categoryName,
      tags,
      repositoryUrl,
      documentationUrl,
      demoUrl,
      license,
      compatibility,
      allowedTools: Array.isArray(allowedTools) ? allowedTools : undefined,
      author: effectiveAuthor,
      status: effectiveStatus,
      publishedAt: effectiveStatus === 'published' ? new Date() : undefined,
      versions: [versionDoc],
    });

    await skill.save();
    await skill.populate('author', 'username fullName avatar email');

    res.status(201).json({
      message: isAdmin ? 'Skill created successfully' : 'Skill created successfully and is pending review',
      skill
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    res.status(500).json({ error: 'Server error while creating skill' });
  }
};

/**
 * 更新技能（管理员或发布者）
 * 发布者：仅能更新自己的技能，不能修改 status 为 published
 */
const updateSkillFromForm = async (req, res) => {
  try {
    const { name, description, version, category, tags, repositoryUrl, documentationUrl, demoUrl, license, compatibility, allowedTools, status, authorId, content } = req.body;
    const isAdmin = req.user.role === 'admin';

    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    if (!isAdmin && skill.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this skill' });
    }

    let nameTrimmed;
    if (name !== undefined && name.trim()) {
      nameTrimmed = name.trim().toLowerCase();
      if (nameTrimmed.length > 64) {
        return res.status(400).json({ error: 'Skill name cannot exceed 64 characters' });
      }
      if (!NAME_REGEX.test(nameTrimmed)) {
        return res.status(400).json({ error: 'Skill name must contain only lowercase letters, numbers, hyphens, @, and /; must not start or end with hyphen' });
      }
      const nameTaken = await Skill.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${nameTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (nameTaken) {
        return res.status(400).json({ error: 'Skill name already exists' });
      }
    }
    
    // 若指定了 version 且提供了 content/description/tags，则更新该版本（支持旧版本重新上传）
    const versionUpdate = version !== undefined && (content !== undefined || description !== undefined || tags !== undefined);
    if (versionUpdate) {
      if (!skill.versions || skill.versions.length === 0) {
        skill.versions = [{
          version: skill.version || version || '1.0.0',
          description: description ?? skill.description ?? '',
          content: content ?? '',
          tags: tags !== undefined ? (Array.isArray(tags) ? tags : (tags ? [].concat(tags) : [])) : (skill.tags || []),
          createdAt: skill.createdAt || new Date(),
        }];
      } else {
        const idx = skill.versions.findIndex(v => v.version === version);
        if (idx < 0) {
          return res.status(404).json({ error: `Version ${version} not found` });
        }
        if (description !== undefined) skill.versions[idx].description = description;
        if (content !== undefined) skill.versions[idx].content = content;
        if (tags !== undefined) skill.versions[idx].tags = Array.isArray(tags) ? tags : (tags ? [].concat(tags) : []);
      }
    }
    
    // 管理员可以更新任何技能的任何属性
    const updateData = {};
    if (name !== undefined) updateData.name = (name && name.trim()) ? nameTrimmed : skill.name;
    if (description !== undefined && !versionUpdate) updateData.description = description;
    if (version !== undefined) updateData.version = version;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined && !versionUpdate) updateData.tags = tags;
    if (repositoryUrl !== undefined) updateData.repositoryUrl = repositoryUrl;
    if (documentationUrl !== undefined) updateData.documentationUrl = documentationUrl;
    if (demoUrl !== undefined) updateData.demoUrl = demoUrl;
    if (license !== undefined) updateData.license = license;
    if (compatibility !== undefined) updateData.compatibility = compatibility;
    if (allowedTools !== undefined) updateData.allowedTools = Array.isArray(allowedTools) ? allowedTools : allowedTools;
    if (status !== undefined) {
      if (isAdmin) {
        updateData.status = status;
      } else {
        const s = status === 'draft' ? 'draft' : 'pending_review';
        updateData.status = s;
      }
    }
    if (isAdmin && authorId !== undefined) updateData.author = authorId;
    updateData.lastUpdated = Date.now();

    const finalUpdate = { ...updateData };
    if (versionUpdate) finalUpdate.versions = skill.versions;

    const updatedSkill = await Skill.findByIdAndUpdate(
      req.params.id,
      finalUpdate,
      { new: true, runValidators: true }
    ).populate('author', 'username fullName avatar email');

    res.json({
      message: 'Skill updated successfully',
      skill: updatedSkill
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    res.status(500).json({ error: 'Server error while updating skill' });
  }
};

const updateSkillForAdmin = updateSkillFromForm;

const deleteSkillForAdmin = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    // 管理员可以删除任何技能
    await Skill.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Skill deleted successfully by admin' });
  } catch (error) {
    res.status(500).json({ error: 'Server error while deleting skill for admin' });
  }
};

module.exports = {
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
};