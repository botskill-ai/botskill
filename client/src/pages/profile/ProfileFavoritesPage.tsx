import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Download, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api';

const ProfileFavoritesPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setFavoritesLoading(true);
      userAPI
        .getFavorites()
        .then((res) => {
          const list = res.data?.data?.skills || res.data?.skills || [];
          setFavorites(list);
        })
        .catch(() => {
          setFavorites([]);
          toast.error(t('skills.fetchError', '获取收藏失败'));
        })
        .finally(() => setFavoritesLoading(false));
    }
  }, [isAuthenticated, t]);

  return (
    <div>
      <h1 className="text-2xl font-bold font-heading mb-6">{t('profile.favorites')}</h1>
      {favoritesLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('profile.favoritesEmpty', '暂无收藏')}</p>
          <Link to="/skills" className="mt-4 inline-block">
            <Button variant="outline">{t('skills.title')}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((skill) => (
            <div
              key={skill._id}
              className="bg-card rounded-xl border p-4 flex flex-col hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <Link to={`/skills/${skill._id}`} className="font-semibold hover:text-primary line-clamp-2 flex-1">
                  {skill.name}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    try {
                      await userAPI.removeFavorite(skill._id);
                      setFavorites((prev) => prev.filter((s) => s._id !== skill._id));
                      toast.success(t('profile.removedFromFavorites', '已取消收藏'));
                    } catch {
                      toast.error(t('profile.removeFailed', '取消收藏失败'));
                    }
                  }}
                  title={t('profile.removeFavorite', '取消收藏')}
                >
                  <Heart className="h-4 w-4 fill-current" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2 flex-1">
                {skill.description || '—'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <span className="inline-flex items-center gap-1.5">
                  <Download className="h-3 w-3 shrink-0" />
                  {(skill.downloads ?? 0).toLocaleString()} {t('skills.downloads')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                  {(skill.rating?.average ?? 0).toFixed(1)}
                </span>
                <Link to={`/skills/${skill._id}`} className="ml-auto">
                  <Button size="sm" variant="outline">
                    {t('common.download')}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileFavoritesPage;
