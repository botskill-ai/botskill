const matter = require('gray-matter');

const VALID_CATEGORIES = ['ai', 'data', 'web', 'devops', 'security', 'tools'];

/**
 * Name: 1-64 chars, lowercase letters, numbers, hyphens, @, /
 * Must not start or end with hyphen; no consecutive hyphens.
 * Extended from Agent Skills spec to allow @ and / (e.g. org/skill-name, user@skill).
 */
const NAME_REGEX = /^[a-z0-9@/]+(?:[-@/][a-z0-9@/]+)*$/;

/**
 * Parse SKILL.md content per Agent Skills specification
 * @see https://agentskills.io/specification
 * @param {string} content - Raw SKILL.md content
 * @returns {{ data: object, content: string, errors: string[] }}
 */
function parseSkillMd(content) {
  const errors = [];
  let data = {};
  let body = '';

  try {
    const parsed = matter(content);
    data = parsed.data || {};
    body = (parsed.content || '').trim();

    // --- Required fields (spec) ---
    const name = String(data.name ?? '').trim();
    const description = String(data.description ?? '').trim();

    if (!name) errors.push('name is required');
    else {
      if (name.length > 64) errors.push('name must be at most 64 characters');
      if (!NAME_REGEX.test(name)) {
        errors.push('name must contain only lowercase letters, numbers, hyphens, @, and /; must not start or end with hyphen; no consecutive hyphens');
      }
    }

    if (!description) errors.push('description is required');
    else if (description.length > 1024) errors.push('description must be at most 1024 characters');

    // --- Optional fields (spec) ---
    const license = data.license != null ? String(data.license).trim() : undefined;
    const compatibility = data.compatibility != null ? String(data.compatibility).trim() : undefined;
    if (compatibility && compatibility.length > 500) {
      errors.push('compatibility must be at most 500 characters');
    }

    // metadata: optional key-value map; version and author typically live here
    const metadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
    const version = String(metadata.version ?? data.version ?? '1.0.0').trim();
    const metadataAuthor = metadata.author != null ? String(metadata.author) : undefined;

    if (!/^\d+\.\d+\.\d+$/.test(version)) errors.push('version (in metadata or top-level) must be X.Y.Z format');

    // allowed-tools: optional, space-delimited (experimental)
    const allowedTools = data['allowed-tools'] != null
      ? String(data['allowed-tools']).trim().split(/\s+/).filter(Boolean)
      : undefined;

    // --- Platform-specific (not in spec, for our UI/classification) ---
    const category = String(data.category ?? 'tools').toLowerCase();
    // Category validation will be done at application level using Category model
    // For now, accept any lowercase string (will be validated against Category collection)

    const tags = Array.isArray(data.tags)
      ? data.tags.map(t => String(t).trim()).filter(Boolean)
      : (typeof data.tags === 'string' ? data.tags.split(/[,，]/).map(s => s.trim()).filter(Boolean) : []);

    return {
      data: {
        name,
        description,
        version,
        license: license || 'MIT',
        compatibility: compatibility || undefined,
        metadataAuthor,
        allowedTools,
        category,
        tags,
        // Legacy/optional URLs (not in spec)
        repositoryUrl: data.repositoryUrl || undefined,
        documentationUrl: data.documentationUrl || undefined,
        demoUrl: data.demoUrl || undefined,
      },
      content: body,
      errors,
    };
  } catch (err) {
    return {
      data: {},
      content: '',
      errors: ['Failed to parse SKILL.md: ' + (err.message || 'Invalid format')],
    };
  }
}

module.exports = { parseSkillMd, VALID_CATEGORIES, NAME_REGEX };
