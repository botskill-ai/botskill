import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Menu, X, Globe, ChevronDown, LogOut, User as UserProfileIcon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from './ThemeToggle';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { siteTitle } = useSiteSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'zh-CN', name: 'Chinese', native: '简体中文' },
    { code: 'en-US', name: 'English', native: 'English' },
    { code: 'ja-JP', name: 'Japanese', native: '日本語' },
    { code: 'ko-KR', name: 'Korean', native: '한국어' },
    { code: 'de-DE', name: 'German', native: 'Deutsch' },
    { code: 'fr-FR', name: 'French', native: 'Français' },
    { code: 'ru-RU', name: 'Russian', native: 'Русский' },
    { code: 'ar-SA', name: 'Arabic', native: 'العربية' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangDropdownOpen(false);
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    if (!isUserDropdownOpen && !isLangDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // 关闭用户下拉菜单
      if (isUserDropdownOpen) {
        const dropdown = userDropdownRef.current;
        if (dropdown) {
          // 检查点击是否在下拉菜单内部
          if (!dropdown.contains(target)) {
            // 检查是否点击的是触发按钮
            const parent = dropdown.parentElement;
            const triggerButton = parent?.querySelector('button');
            if (!triggerButton || !triggerButton.contains(target)) {
              setIsUserDropdownOpen(false);
            }
          }
        }
      }
      
      // 关闭语言下拉菜单
      if (isLangDropdownOpen) {
        const dropdown = langDropdownRef.current;
        if (dropdown) {
          if (!dropdown.contains(target)) {
            const parent = dropdown.parentElement;
            const triggerButton = parent?.querySelector('button');
            if (!triggerButton || !triggerButton.contains(target)) {
              setIsLangDropdownOpen(false);
            }
          }
        }
      }
    };

    // 使用 setTimeout 确保在下一个事件循环中添加监听器，避免立即触发
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isUserDropdownOpen, isLangDropdownOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto w-full h-16 px-4 md:px-6 flex items-center">
        {/* Logo - always on left */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold">
            {/* 原内联 SVG 已替换为 logo.svg */}
            <img src="/logo.svg" alt="BotSkill" className="h-8 w-8 rounded-lg flex-shrink-0" />
            <span className="text-primary">{siteTitle?.split(' - ')[0] || 'botskill'}</span>
          </Link>
        </div>

        {/* Desktop: Right-aligned nav and operation buttons */}
        <div className="hidden md:flex flex-1 items-center justify-end ml-8">
          {/* Desktop Navigation - right aligned */}
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link to="/skills" className="transition-colors hover:text-primary">{t('navigation.skills')}</Link>
            <Link to="/docs" className="transition-colors hover:text-primary">{t('navigation.docs')}</Link>
            <Link to="/download" className="transition-colors hover:text-primary">{t('navigation.download')}</Link>
            <Link to="/about" className="transition-colors hover:text-primary">{t('navigation.about')}</Link>
            <Link to="/blog" className="transition-colors hover:text-primary">{t('navigation.blog')}</Link>
          </nav>
          
          {/* Gap between nav and operation buttons - increased spacing */}
          <div className="w-10"></div>
          
          {/* Desktop Operation Buttons */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1"
              >
                <Globe className="h-4 w-4 mr-1" />
                <span>{currentLanguage.native}</span>
              </Button>
              {isLangDropdownOpen && (
                <div 
                  ref={langDropdownRef}
                  className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-[100]"
                >
                  <div className="py-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center justify-between ${
                          i18n.language === lang.code ? 'bg-accent font-medium' : ''
                        }`}
                        onClick={() => changeLanguage(lang.code)}
                      >
                        <span>{lang.native} ({lang.name})</span>
                        {i18n.language === lang.code && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {isAuthenticated && user ? (
              // 用户已登录 - 显示用户下拉菜单
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-2 pl-2 pr-3"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-6 h-6 rounded-full" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <span className="hidden sm:inline-block">{user.username}</span>
                  <ChevronDown className="h-4 w-4 hidden sm:block" />
                </Button>
                
                {isUserDropdownOpen && (
                  <div 
                    ref={userDropdownRef}
                    className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-[100]"
                  >
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsUserDropdownOpen(false);
                          setTimeout(() => navigate('/profile'), 0);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
                      >
                        <UserProfileIcon className="h-4 w-4" />
                        {t('navigation.profile')}
                      </button>
                      
                      {/* 普通用户和发布者显示"我的技能"，管理员显示"管理后台" */}
                      {user.role === 'admin' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsUserDropdownOpen(false);
                            setTimeout(() => navigate('/admin'), 0);
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
                        >
                          <Settings className="h-4 w-4" />
                          {t('navigation.adminPanel')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsUserDropdownOpen(false);
                            setTimeout(() => navigate('/profile/skills'), 0);
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
                        >
                          <Settings className="h-4 w-4" />
                          {t('navigation.mySkills')}
                        </button>
                      )}
                      
                      <button
                        type="button"
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-accent text-red-600 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsUserDropdownOpen(false);
                          setTimeout(() => {
                            logout();
                            navigate('/');
                          }, 0);
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        {t('navigation.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // 用户未登录 - 显示登录按钮
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-1" />
                  {t('navigation.login')}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile: Only operation buttons and menu button */}
        <div className="ml-auto flex md:hidden items-center gap-1 relative">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
          >
            <Globe className="h-5 w-5" />
          </Button>
          {isLangDropdownOpen && (
            <div 
              ref={langDropdownRef}
              className="absolute right-0 top-full mt-2 w-48 bg-background border rounded-md shadow-lg z-[100]"
            >
              <div className="py-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center justify-between ${
                      i18n.language === lang.code ? 'bg-accent font-medium' : ''
                    }`}
                    onClick={() => changeLanguage(lang.code)}
                  >
                    <span>{lang.native} ({lang.name})</span>
                    {i18n.language === lang.code && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          {isAuthenticated && user ? (
              // 移动端用户已登录 - 显示用户下拉菜单
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-6 h-6 rounded-full" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                </Button>
                
                {isUserDropdownOpen && (
                  <div 
                    ref={userDropdownRef}
                    className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-[100]"
                  >
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsUserDropdownOpen(false);
                          setTimeout(() => navigate('/profile'), 0);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
                      >
                        <UserProfileIcon className="h-4 w-4" />
                        {t('navigation.profile')}
                      </button>
                      
                      {/* 普通用户和发布者显示"我的技能"，管理员显示"管理后台" */}
                      {user.role === 'admin' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsUserDropdownOpen(false);
                            setTimeout(() => navigate('/admin'), 0);
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
                        >
                          <Settings className="h-4 w-4" />
                          {t('navigation.adminPanel')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsUserDropdownOpen(false);
                            setTimeout(() => navigate('/profile/skills'), 0);
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
                        >
                          <Settings className="h-4 w-4" />
                          {t('navigation.mySkills')}
                        </button>
                      )}
                      
                      <button
                        type="button"
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-accent text-red-600 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsUserDropdownOpen(false);
                          setTimeout(() => {
                            logout();
                            navigate('/');
                          }, 0);
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        {t('navigation.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // 移动端用户未登录 - 显示登录按钮
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
          <button 
            className="p-2 rounded-md hover:bg-muted"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background p-4">
          <div className="flex flex-col gap-4">
            <Link to="/skills" className="transition-colors hover:text-primary">{t('navigation.skills')}</Link>
            <Link to="/docs" className="transition-colors hover:text-primary">{t('navigation.docs')}</Link>
            <Link to="/download" className="transition-colors hover:text-primary">{t('navigation.download')}</Link>
            <Link to="/about" className="transition-colors hover:text-primary">{t('navigation.about')}</Link>
            <Link to="/blog" className="transition-colors hover:text-primary">{t('navigation.blog')}</Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;