import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useSeo } from '@/contexts/SeoContext';
import { useTranslation } from 'react-i18next';

const PAGE_KEYS: Record<string, string> = {
  '/': 'home',
  '/skills': 'skills',
  '/blog': 'blog',
  '/about': 'about',
  '/docs': 'docs',
  '/login': 'login',
  '/register': 'register',
  '/profile': 'profile',
  '/admin': 'adminPanel',
};

/** 获取站点基础 URL（用于 canonical、og:url） */
function getBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.protocol}//${window.location.host}`;
}

const DEFAULT_IMAGE = '/logo.svg';
const DEFAULT_DESCRIPTION = '连接开发者与智能技能的桥梁，让技术更易用';

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMeta(name: string, attr: 'name' | 'property' = 'name') {
  const el = document.querySelector(`meta[${attr}="${name}"]`);
  if (el) el.remove();
}

export const DocumentHead = () => {
  const { pathname } = useLocation();
  const { siteTitle, siteDescription } = useSiteSettings();
  const { meta } = useSeo();
  const { t } = useTranslation();

  const baseTitle = siteTitle || 'BotSkill - AI 技能市场';
  const baseDesc = siteDescription || DEFAULT_DESCRIPTION;
  const baseUrl = getBaseUrl();
  const currentUrl = baseUrl ? `${baseUrl}${pathname}` : '';

  useEffect(() => {
    const title = meta?.title ?? (() => {
      const pageKey = PAGE_KEYS[pathname];
      const pageTitle = pageKey ? t(`navigation.${pageKey}`) : null;
      return pageTitle && pageTitle !== `navigation.${pageKey}` ? `${pageTitle} - ${baseTitle}` : baseTitle;
    })();
    document.title = title;
  }, [pathname, baseTitle, meta?.title, t]);

  useEffect(() => {
    const desc = meta?.description ?? baseDesc;
    setMeta('description', desc);
  }, [meta?.description, baseDesc]);

  useEffect(() => {
    const desc = meta?.description ?? baseDesc;
    setMeta('description', desc);
  }, [meta?.description, baseDesc]);

  useEffect(() => {
    const canonical = meta?.canonical ?? currentUrl;
    if (!canonical) return;
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonical);
  }, [meta?.canonical, currentUrl]);

  useEffect(() => {
    const image = meta?.image ? (meta.image.startsWith('http') ? meta.image : `${baseUrl}${meta.image}`) : `${baseUrl}${DEFAULT_IMAGE}`;
    const title = meta?.title ?? document.title;
    const desc = meta?.description ?? baseDesc;
    const url = meta?.canonical ?? currentUrl;

    setMeta('og:title', title, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:image', image, 'property');
    setMeta('og:url', url, 'property');
    setMeta('og:type', meta?.type ?? 'website', 'property');
    setMeta('og:site_name', baseTitle, 'property');

    if (meta?.type === 'article') {
      if (meta.publishedTime) setMeta('article:published_time', meta.publishedTime, 'property');
      if (meta.modifiedTime) setMeta('article:modified_time', meta.modifiedTime, 'property');
    } else {
      removeMeta('article:published_time', 'property');
      removeMeta('article:modified_time', 'property');
    }

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', image);
  }, [meta, baseTitle, baseDesc, baseUrl, currentUrl]);

  useEffect(() => {
    if (meta?.noIndex) {
      setMeta('robots', 'noindex, nofollow');
    } else {
      removeMeta('robots');
    }
  }, [meta?.noIndex]);

  return null;
};
