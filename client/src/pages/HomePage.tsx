import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, Download, Upload, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { skillAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Skill {
  _id: string;
  name: string;
  description: string;
  downloads?: number;
  rating?: { average?: number };
  author?: { fullName?: string; username?: string };
}

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [latestSkills, setLatestSkills] = useState<Skill[]>([]);
  const [popularSkills, setPopularSkills] = useState<Skill[]>([]);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);

  // 获取最新技能
  useEffect(() => {
    skillAPI.getLatest(4)
      .then((res) => {
        setLatestSkills(res.data?.skills || []);
      })
      .catch((err) => {
        console.error('Error fetching latest skills:', err);
        setLatestSkills([]);
      })
      .finally(() => setLoadingLatest(false));
  }, []);

  // 获取热门技能
  useEffect(() => {
    skillAPI.getPopular(4)
      .then((res) => {
        setPopularSkills(res.data?.skills || []);
      })
      .catch((err) => {
        console.error('Error fetching popular skills:', err);
        setPopularSkills([]);
      })
      .finally(() => setLoadingPopular(false));
  }, []);

  // 处理查看更多点击，滚动到顶部
  const handleViewMore = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/skills');
  };

  // 处理发布技能点击
  const handlePublishClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=/profile');
    } else {
      navigate('/profile');
    }
  };

  const getAuthorName = (author?: { fullName?: string; username?: string }) => {
    if (!author) return '未知';
    return author.fullName || author.username || '未知';
  };

  const getRating = (skill: Skill) => {
    return skill.rating?.average ?? 0;
  };

  // 截断描述文本
  const truncateDescription = (description: string, maxLength: number = 100) => {
    if (!description) return '—';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="container px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">
              {t('home.title')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {t('home.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/skills')}>
                <Download className="h-4 w-4 mr-2" />
                {t('home.browseSkills')}
              </Button>
              <Button variant="outline" size="lg" onClick={handlePublishClick}>
                <Upload className="h-4 w-4 mr-2" />
                {t('home.publishSkill')}
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold font-heading text-center mb-12">{t('home.features.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-card p-6 rounded-lg border shadow-sm flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('home.features.search.title')}</h3>
                <p className="text-muted-foreground">
                  {t('home.features.search.desc')}
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border shadow-sm flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('home.features.quality.title')}</h3>
                <p className="text-muted-foreground">
                  {t('home.features.quality.desc')}
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border shadow-sm flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('home.features.docs.title')}</h3>
                <p className="text-muted-foreground">
                  {t('home.features.docs.desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Latest Skills */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <h2 className="text-3xl font-bold font-heading mb-4 md:mb-0">{t('home.latestSkills')}</h2>
              <button onClick={handleViewMore} className="text-primary hover:underline">{t('home.viewMore')}</button>
            </div>
            {loadingLatest ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : latestSkills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无最新技能</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {latestSkills.map((skill) => (
                  <Link key={skill._id} to={`/skills/${skill._id}`} className="bg-card rounded-lg border p-6 hover:shadow-md transition-shadow flex flex-col h-full">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{skill.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-grow line-clamp-3">{truncateDescription(skill.description, 120)}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-auto">
                      <span className="inline-flex items-center gap-1.5">
                        <Download className="h-3 w-3 shrink-0" />
                        {(skill.downloads ?? 0).toLocaleString()} {t('skills.downloads')}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                        {getRating(skill).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{t('skills.author')}: {getAuthorName(skill.author)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Popular Skills */}
        <section className="py-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <h2 className="text-3xl font-bold font-heading mb-4 md:mb-0">{t('home.popularSkills')}</h2>
              <button onClick={handleViewMore} className="text-primary hover:underline">{t('home.viewMore')}</button>
            </div>
            {loadingPopular ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : popularSkills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无热门技能</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {popularSkills.map((skill) => (
                  <Link key={skill._id} to={`/skills/${skill._id}`} className="bg-card rounded-lg border p-6 hover:shadow-md transition-shadow flex flex-col h-full">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{skill.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-grow line-clamp-3">{truncateDescription(skill.description, 120)}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-auto">
                      <span className="inline-flex items-center gap-1.5">
                        <Download className="h-3 w-3 shrink-0" />
                        {(skill.downloads ?? 0).toLocaleString()} {t('skills.downloads')}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                        {getRating(skill).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{t('skills.author')}: {getAuthorName(skill.author)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;