import { BookOpen, Download, Upload, Users, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const AboutPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const handleBrowseClick = () => {
    navigate('/skills');
  };

  const handlePublishClick = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/profile');
    } else {
      navigate('/profile');
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="container px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-6">
              {t('navigation.about')} BotSkill
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('home.subtitle')}
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold font-heading mb-6">{t('about.mission.title')}</h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t('about.mission.description')}
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold font-heading text-center mb-12">{t('about.features.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('about.features.plugAndPlay.title')}</h3>
                <p className="text-muted-foreground">
                  {t('about.features.plugAndPlay.desc')}
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('home.features.quality.title')}</h3>
                <p className="text-muted-foreground">
                  {t('about.features.quality.desc')}
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('about.features.community.title')}</h3>
                <p className="text-muted-foreground">
                  {t('about.features.community.desc')}
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('about.features.oneClickDeploy.title')}</h3>
                <p className="text-muted-foreground">
                  {t('about.features.oneClickDeploy.desc')}
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('about.features.easyPublish.title')}</h3>
                <p className="text-muted-foreground">
                  {t('about.features.easyPublish.desc')}
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('home.features.docs.title')}</h3>
                <p className="text-muted-foreground">
                  {t('about.features.documentation.desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 container px-4 md:px-6">
          <h2 className="text-3xl font-bold font-heading text-center mb-12">{t('about.team.title')}</h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground mb-8 text-center">
              {t('about.team.description')}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
                <h3 className="font-semibold">{t('about.team.member1.name')}</h3>
                <p className="text-sm text-muted-foreground">{t('about.team.member1.position')}</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
                <h3 className="font-semibold">{t('about.team.member2.name')}</h3>
                <p className="text-sm text-muted-foreground">{t('about.team.member2.position')}</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
                <h3 className="font-semibold">{t('about.team.member3.name')}</h3>
                <p className="text-sm text-muted-foreground">{t('about.team.member3.position')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
          <div className="container px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
              {t('about.joinUs.title')}
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              {t('about.joinUs.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" onClick={handleBrowseClick}>
                {t('home.browseSkills')}
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent text-white border-white hover:bg-white/10" onClick={handlePublishClick}>
                {t('home.publishSkill')}
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AboutPage;