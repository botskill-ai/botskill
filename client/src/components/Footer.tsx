import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const Footer = () => {
  const { t } = useTranslation();
  const { siteTitle, siteDescription } = useSiteSettings();

  const handleLinkClick = () => {
    // 点击链接时滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t bg-background py-8 md:py-12">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col sm:flex-row flex-wrap gap-6 md:gap-8 max-w-6xl mx-auto">
          <div className="flex-1 min-w-0 sm:min-w-[180px] text-center sm:text-left">
            <h3 className="font-heading font-bold text-base md:text-lg mb-3 md:mb-4">{siteTitle || 'BotSkill'}</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              {siteDescription || t('footer.description')}
            </p>
          </div>
          <div className="flex-1 min-w-0 sm:min-w-[120px] text-center sm:text-left">
            <h4 className="font-semibold text-sm md:text-base mb-3 md:mb-4">{t('footer.product.title')}</h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground">
              <li><Link to="/skills" onClick={handleLinkClick} className="hover:text-primary transition-colors">{t('navigation.skills')}</Link></li>
              <li><Link to="/docs" onClick={handleLinkClick} className="hover:text-primary transition-colors">{t('navigation.docs')}</Link></li>
              <li><Link to="/cli" onClick={handleLinkClick} className="hover:text-primary transition-colors">{t('footer.product.cli')}</Link></li>
            </ul>
          </div>
          <div className="flex-1 min-w-0 sm:min-w-[120px] text-center sm:text-left">
            <h4 className="font-semibold text-sm md:text-base mb-3 md:mb-4">{t('footer.company.title')}</h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground">
              <li><Link to="/about" onClick={handleLinkClick} className="hover:text-primary transition-colors">{t('navigation.about')}</Link></li>
              <li><Link to="/blog" onClick={handleLinkClick} className="hover:text-primary transition-colors">{t('navigation.blog')}</Link></li>
              <li><Link to="/contact" onClick={handleLinkClick} className="hover:text-primary transition-colors">{t('footer.company.contact')}</Link></li>
            </ul>
          </div>
          <div className="flex-1 min-w-0 sm:min-w-[120px] text-center sm:text-left">
            <h4 className="font-semibold text-sm md:text-base mb-3 md:mb-4">{t('footer.legal.title')}</h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground">
              <li><Link to="/privacy" onClick={handleLinkClick} className="hover:text-primary transition-colors">{t('footer.legal.privacy')}</Link></li>
              <li><Link to="/terms" onClick={handleLinkClick} className="hover:text-primary transition-colors">{t('footer.legal.terms')}</Link></li>
              <li><Link to="/license" onClick={handleLinkClick} className="hover:text-primary transition-colors">{t('footer.legal.license')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t text-center text-xs md:text-sm text-muted-foreground max-w-6xl mx-auto px-2">
          © 2026 {siteTitle?.split(' - ')[0] || 'BotSkill'}. {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;