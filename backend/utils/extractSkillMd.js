const path = require('path');
const fs = require('fs').promises;
const AdmZip = require('adm-zip');
const tar = require('tar');
const { parseSkillMd } = require('./parseSkillMd.js');

/**
 * Find SKILL.md in directory (recursive, max depth 2)
 */
async function findSkillMd(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isFile() && /^SKILL\.md$/i.test(e.name)) {
      return path.join(dir, e.name);
    }
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      const sub = path.join(dir, e.name);
      const found = await findSkillMd(sub);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Extract archive and find SKILL.md
 * Spec: skill is a directory with SKILL.md at root or in subfolder
 * @param {string} filePath - Path to .zip or .tar.gz
 * @param {string} extractTo - Temp directory
 * @param {string} [originalName] - Original filename for .tar.gz detection
 * @returns {{ skillMdPath: string, rootDir: string } | null}
 */
async function extractAndFindSkillMd(filePath, extractTo, originalName = '') {
  const baseName = originalName || path.basename(filePath);
  const ext = path.extname(baseName).toLowerCase();
  const base = path.basename(baseName, ext);
  const isTarGz = /\.tar\.gz$/i.test(baseName) || (ext === '.gz' && base.endsWith('.tar'));

  if (ext === '.zip' || baseName.toLowerCase().endsWith('.zip')) {
    const zip = new AdmZip(filePath);
    zip.extractAllTo(extractTo, true);
  } else if (isTarGz || ext === '.tar' || baseName.toLowerCase().endsWith('.tar.gz')) {
    await tar.extract({ file: filePath, cwd: extractTo });
  } else {
    return null;
  }

  const skillMdPath = await findSkillMd(extractTo);
  if (!skillMdPath) return null;

  return {
    skillMdPath,
    rootDir: extractTo,
  };
}

/**
 * Read and parse SKILL.md from file path or buffer
 * @param {string|Buffer} input - File path or raw content
 * @returns {Promise<{ data: object, content: string, errors: string[] }>}
 */
async function readAndParseSkillMd(input) {
  let raw;
  if (Buffer.isBuffer(input)) {
    raw = input.toString('utf-8');
  } else {
    raw = await fs.readFile(input, 'utf-8');
  }
  return parseSkillMd(raw);
}

module.exports = {
  extractAndFindSkillMd,
  readAndParseSkillMd,
  findSkillMd,
};
