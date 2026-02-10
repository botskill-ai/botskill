const Skill = require('../models/Skill');
const Blog = require('../models/Blog');

/**
 * 获取站点基础 URL
 * 优先使用 SITE_URL 环境变量，其次 FRONTEND_URL，最后根据请求推断
 */
function getBaseUrl(req) {
  const envUrl = process.env.SITE_URL || process.env.FRONTEND_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
  return `${protocol}://${host}`;
}

/**
 * 生成 sitemap.xml
 * 包含：固定页面、已发布技能、已发布博客
 */
const getSitemap = async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);

    const staticPages = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/skills', priority: '0.9', changefreq: 'daily' },
      { path: '/blog', priority: '0.9', changefreq: 'daily' },
      { path: '/about', priority: '0.7', changefreq: 'monthly' },
      { path: '/docs', priority: '0.8', changefreq: 'weekly' },
    ];

    const [skills, blogs] = await Promise.all([
      Skill.find({ status: 'published' })
        .select('_id lastUpdated publishedAt')
        .lean(),
      Blog.find({ status: 'published' })
        .select('slug updatedAt publishedAt')
        .lean(),
    ]);

    const urls = [];

    for (const page of staticPages) {
      urls.push({
        loc: `${baseUrl}${page.path}`,
        changefreq: page.changefreq,
        priority: page.priority,
      });
    }

    for (const skill of skills) {
      const lastmod = skill.lastUpdated || skill.publishedAt || skill.updatedAt;
      urls.push({
        loc: `${baseUrl}/skills/${skill._id}`,
        lastmod: lastmod ? new Date(lastmod).toISOString().split('T')[0] : undefined,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    for (const blog of blogs) {
      const lastmod = blog.updatedAt || blog.publishedAt;
      urls.push({
        loc: `${baseUrl}/blog/${blog.slug}`,
        lastmod: lastmod ? new Date(lastmod).toISOString().split('T')[0] : undefined,
        changefreq: 'monthly',
        priority: '0.7',
      });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>
    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq || 'weekly'}</changefreq>
    <priority>${u.priority || '0.5'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // 缓存 1 小时
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?>\n<error>Failed to generate sitemap</error>');
  }
};

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 生成 robots.txt
 * 动态输出，确保 Sitemap 使用正确的站点 URL
 */
const getRobots = (req, res) => {
  const baseUrl = getBaseUrl(req);
  const txt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /profile
Disallow: /login
Disallow: /register
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
  res.set('Content-Type', 'text/plain');
  res.set('Cache-Control', 'public, max-age=86400'); // 缓存 24 小时
  res.send(txt);
};

module.exports = { getSitemap, getRobots };
