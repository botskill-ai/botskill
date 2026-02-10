const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const Skill = require('../models/Skill');
const User = require('../models/User');
const { extractAndFindSkillMd, readAndParseSkillMd } = require('../utils/extractSkillMd.js');

/**
 * Convert GitHub URL to fetchable raw/archive URL
 */
function toFetchableUrl(url) {
  const u = url.trim();
  // github.com/user/repo/blob/branch/path -> raw.githubusercontent.com/user/repo/branch/path
  const blobMatch = u.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/);
  if (blobMatch) {
    return `https://raw.githubusercontent.com/${blobMatch[1]}/${blobMatch[2]}/${blobMatch[3]}/${blobMatch[4]}`;
  }
  // github.com/user/repo -> try main branch SKILL.md
  const repoMatch = u.match(/github\.com\/([^/]+)\/([^/]+)\/?$/);
  if (repoMatch) {
    return `https://raw.githubusercontent.com/${repoMatch[1]}/${repoMatch[2]}/main/SKILL.md`;
  }
  return u;
}

async function ensureUploadDir() {
  const dir = path.join(os.tmpdir(), 'botskill-uploads');
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-')
    .replace(/@/g, '-at-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * POST /api/skills/upload
 * Upload skill package (.zip, .tar.gz) or SKILL.md
 */
const uploadSkill = async (req, res) => {
  let tempDir;
  try {
    if (!req.file && !req.files?.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const file = req.file || req.files?.file;
    const filePath = file.path || file.filepath;
    const originalName = file.originalname || file.originalFilename || '';
    const ext = path.extname(originalName).toLowerCase();

    const user = await User.findById(req.user.userId);
    if (!user || !['admin', 'publisher'].includes(user.role)) {
      return res.status(403).json({ error: 'Not authorized to publish skills' });
    }

    let parsed;
    let extractResult = null;
    const isMd = ext === '.md' || originalName.toLowerCase().endsWith('.md');

    if (isMd) {
      parsed = await readAndParseSkillMd(filePath);
    } else if (ext === '.zip' || originalName.toLowerCase().endsWith('.tar.gz')) {
      tempDir = await ensureUploadDir();
      const extractDir = path.join(tempDir, `extract-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      await fs.mkdir(extractDir, { recursive: true });

      extractResult = await extractAndFindSkillMd(filePath, extractDir, originalName);
      if (!extractResult) {
        return res.status(400).json({ error: 'No SKILL.md found in archive. Please include SKILL.md in the root or a subfolder.' });
      }
      parsed = await readAndParseSkillMd(extractResult.skillMdPath);
    } else {
      return res.status(400).json({ error: 'Unsupported format. Use .zip, .tar.gz, or .md' });
    }

    if (parsed.errors.length > 0) {
      return res.status(400).json({ error: 'Invalid SKILL.md', details: parsed.errors });
    }

    const { data, content } = parsed;
    const name = (data.name || '').trim().toLowerCase();

    // skill.config.json from zip (when packed with skm pack)
    let zipConfig = {};
    if (extractResult) {
      const skillDir = path.dirname(extractResult.skillMdPath);
      const configPath = path.join(skillDir, 'skill.config.json');
      try {
        zipConfig = await fs.readFile(configPath, 'utf-8').then(JSON.parse).catch(() => ({}));
      } catch (_) {}
    }

    // Merge: form fields (CLI) > zip skill.config.json > parsed SKILL.md
    const body = req.body || {};
    let tags = data.tags;
    if (body.tags !== undefined) {
      try {
        tags = typeof body.tags === 'string' ? JSON.parse(body.tags) : body.tags;
      } catch (_) {}
    } else if (zipConfig.tags && Array.isArray(zipConfig.tags)) {
      tags = zipConfig.tags;
    }
    const version = body.version ?? zipConfig.version ?? data.version ?? '1.0.0';
    const category = (body.category ?? zipConfig.category ?? data.category ?? 'tools').toLowerCase();
    const license = body.license ?? zipConfig.license ?? data.license ?? 'MIT';
    const repositoryUrl = body.repositoryUrl ?? zipConfig.repositoryUrl ?? data.repositoryUrl ?? '';
    const documentationUrl = body.documentationUrl ?? zipConfig.documentationUrl ?? data.documentationUrl ?? '';
    const demoUrl = body.demoUrl ?? zipConfig.demoUrl ?? data.demoUrl ?? '';
    const description = data.description ?? '';
    const compatibility = data.compatibility;
    const allowedTools = data.allowedTools;

    const existing = await Skill.findOne({
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existing) {
      if (existing.author.toString() !== req.user.userId) {
        return res.status(400).json({ error: 'Skill name already exists' });
      }
      const versionExists = existing.versions?.some(v => v.version === version);
      if (versionExists) {
        return res.status(400).json({ error: `Version ${version} already exists for this skill` });
      }
    }

    let storedFilePath = undefined;
    if (!isMd && filePath) {
      const skillsUploadDir = path.join(__dirname, '..', 'uploads', 'skills');
      await fs.mkdir(skillsUploadDir, { recursive: true });
      const ext = path.extname(filePath) || '.zip';
      const storedName = `skill-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      storedFilePath = path.join(skillsUploadDir, storedName);
      await fs.copyFile(filePath, storedFilePath);
    }

    const versionDoc = {
      version,
      description,
      content,
      filePath: storedFilePath,
      createdAt: new Date(),
    };

    if (existing) {
      existing.versions.push(versionDoc);
      existing.description = description;
      existing.version = version;
      existing.category = category;
      existing.tags = tags || existing.tags;
      existing.license = license || existing.license;
      if (compatibility != null) existing.compatibility = compatibility;
      if (allowedTools != null) existing.allowedTools = allowedTools;
      existing.repositoryUrl = repositoryUrl || existing.repositoryUrl;
      existing.documentationUrl = documentationUrl || existing.documentationUrl;
      existing.demoUrl = demoUrl || existing.demoUrl;
      existing.lastUpdated = new Date();
      existing.status = existing.status === 'published' ? 'published' : 'pending_review';
      await existing.save();
      await existing.populate('author', 'username fullName avatar');

      return res.status(201).json({
        message: `Version ${version} added successfully`,
        skill: existing,
      });
    }

    const slug = slugify(name) + '-' + Date.now().toString(36);
    const skill = new Skill({
      name,
      slug,
      description,
      version,
      category,
      tags: tags || [],
      license,
      compatibility: compatibility || undefined,
      allowedTools: allowedTools || undefined,
      repositoryUrl,
      documentationUrl,
      demoUrl,
      author: req.user.userId,
      status: 'pending_review',
      versions: [versionDoc],
    });
    await skill.save();
    await skill.populate('author', 'username fullName avatar');

    res.status(201).json({
      message: 'Skill created successfully and is pending review',
      skill,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message,
    });
  } finally {
    if (tempDir) {
      try {
        const extractDirs = await fs.readdir(tempDir);
        for (const d of extractDirs) {
          if (d.startsWith('extract-')) {
            await fs.rm(path.join(tempDir, d), { recursive: true, force: true });
          }
        }
      } catch (_) {}
    }
  }
};

/**
 * POST /api/skills/upload/parse
 * Upload and parse only - returns parsed data without saving (for admin add skill flow)
 */
const uploadParseSkill = async (req, res) => {
  let tempDir;
  try {
    if (!req.file && !req.files?.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const file = req.file || req.files?.file;
    const filePath = file.path || file.filepath;
    const originalName = file.originalname || file.originalFilename || '';
    const ext = path.extname(originalName).toLowerCase();

    const user = await User.findById(req.user.userId);
    if (!user || !['admin', 'publisher'].includes(user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    let parsed;
    const isMd = ext === '.md' || originalName.toLowerCase().endsWith('.md');

    if (isMd) {
      parsed = await readAndParseSkillMd(filePath);
    } else if (ext === '.zip' || originalName.toLowerCase().endsWith('.tar.gz')) {
      tempDir = await ensureUploadDir();
      const extractDir = path.join(tempDir, `extract-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      await fs.mkdir(extractDir, { recursive: true });

      const result = await extractAndFindSkillMd(filePath, extractDir, originalName);
      if (!result) {
        return res.status(400).json({ error: 'No SKILL.md found in archive. Please include SKILL.md in the root or a subfolder.' });
      }
      parsed = await readAndParseSkillMd(result.skillMdPath);
    } else {
      return res.status(400).json({ error: 'Unsupported format. Use .zip, .tar.gz, or .md' });
    }

    if (parsed.errors.length > 0) {
      return res.status(400).json({ error: 'Invalid SKILL.md', details: parsed.errors });
    }

    const { data, content } = parsed;
    res.json({
      data: {
        name: (data.name || '').trim().toLowerCase(),
        description: data.description || '',
        version: data.version || '1.0.0',
        category: data.category || 'tools',
        tags: data.tags || [],
        license: data.license || 'MIT',
        compatibility: data.compatibility,
        allowedTools: data.allowedTools,
        repositoryUrl: data.repositoryUrl,
        documentationUrl: data.documentationUrl,
        demoUrl: data.demoUrl,
      },
      content,
    });
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: 'Parse failed', message: error.message });
  } finally {
    if (tempDir) {
      try {
        const extractDirs = await fs.readdir(tempDir);
        for (const d of extractDirs) {
          if (d.startsWith('extract-')) {
            await fs.rm(path.join(tempDir, d), { recursive: true, force: true });
          }
        }
      } catch (_) {}
    }
  }
};

/**
 * POST /api/skills/upload/parse-url
 * Fetch from URL, parse, return parsed data (version default: latest for URL source)
 */
const parseSkillFromUrl = async (req, res) => {
  let tempDir;
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user || !['admin', 'publisher'].includes(user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const fetchUrl = toFetchableUrl(url);
    const response = await fetch(fetchUrl, {
      redirect: 'follow',
      headers: { 'User-Agent': 'BotSkill/1.0' },
    });
    if (!response.ok) {
      return res.status(400).json({ error: `Failed to fetch: ${response.status} ${response.statusText}` });
    }

    const contentType = response.headers.get('content-type') || '';
    const contentDisposition = response.headers.get('content-disposition') || '';
    const finalUrl = response.url || fetchUrl;
    const isZip = /\.zip$/i.test(finalUrl) || contentType.includes('zip') || /\.zip$/i.test(contentDisposition);
    const isTarGz = /\.tar\.gz$|\.tgz$/i.test(finalUrl) || /gzip/.test(contentType);
    const buffer = Buffer.from(await response.arrayBuffer());
    const isZipMagic = buffer[0] === 0x50 && buffer[1] === 0x4b;
    const isGzipMagic = buffer[0] === 0x1f && buffer[1] === 0x8b;

    let parsed;
    if (isZipMagic) {
      tempDir = await ensureUploadDir();
      const extractDir = path.join(tempDir, `extract-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      await fs.mkdir(extractDir, { recursive: true });
      const filePath = path.join(tempDir, `fetch-${Date.now()}.zip`);
      await fs.writeFile(filePath, buffer);
      const result = await extractAndFindSkillMd(filePath, extractDir, 'file.zip');
      await fs.unlink(filePath).catch(() => {});
      if (!result) {
        return res.status(400).json({ error: 'No SKILL.md found in archive.' });
      }
      parsed = await readAndParseSkillMd(result.skillMdPath);
    } else if (isGzipMagic) {
      tempDir = await ensureUploadDir();
      const extractDir = path.join(tempDir, `extract-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      await fs.mkdir(extractDir, { recursive: true });
      const filePath = path.join(tempDir, `fetch-${Date.now()}.tar.gz`);
      await fs.writeFile(filePath, buffer);
      const result = await extractAndFindSkillMd(filePath, extractDir, 'file.tar.gz');
      await fs.unlink(filePath).catch(() => {});
      if (!result) {
        return res.status(400).json({ error: 'No SKILL.md found in archive.' });
      }
      parsed = await readAndParseSkillMd(result.skillMdPath);
    } else {
      const str = buffer.toString('utf-8');
      if (!str.trim().startsWith('---')) {
        return res.status(400).json({ error: 'URL does not point to a valid SKILL.md file' });
      }
      const { parseSkillMd } = require('../utils/parseSkillMd');
      parsed = parseSkillMd(str);
    }

    if (parsed.errors.length > 0) {
      return res.status(400).json({ error: 'Invalid SKILL.md', details: parsed.errors });
    }

    const { data, content } = parsed;
    const versionFromMeta = data.version || '1.0.0';
    const version = versionFromMeta === '1.0.0' ? 'latest' : versionFromMeta;

    res.json({
      data: {
        name: (data.name || '').trim().toLowerCase(),
        description: data.description || '',
        version,
        category: data.category || 'tools',
        tags: data.tags || [],
        license: data.license || 'MIT',
        compatibility: data.compatibility,
        allowedTools: data.allowedTools,
        repositoryUrl: data.repositoryUrl || url,
        documentationUrl: data.documentationUrl,
        demoUrl: data.demoUrl,
      },
      content,
    });
  } catch (error) {
    console.error('Parse URL error:', error);
    res.status(500).json({ error: 'Parse failed', message: error.message });
  } finally {
    if (tempDir) {
      try {
        const extractDirs = await fs.readdir(tempDir);
        for (const d of extractDirs) {
          if (d.startsWith('extract-')) {
            await fs.rm(path.join(tempDir, d), { recursive: true, force: true });
          }
        }
      } catch (_) {}
    }
  }
};

module.exports = { uploadSkill, uploadParseSkill, parseSkillFromUrl };
