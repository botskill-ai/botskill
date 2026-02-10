import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Star, Loader2, BookOpen, ExternalLink, Github, Copy, Check, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useTranslation } from 'react-i18next';
import { skillAPI, userAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSeo } from '@/contexts/SeoContext';

interface SkillVersion {
  version: string;
  description: string;
  content?: string;
  tags?: string[];
  createdAt?: string;
}

interface Skill {
  _id: string;
  name: string;
  description: string;
  version?: string;
  author?: { fullName?: string; username?: string };
  category?: string;
  tags?: string[];
  downloads?: number;
  rating?: { average?: number };
  versions?: SkillVersion[];
  repositoryUrl?: string;
  documentationUrl?: string;
  demoUrl?: string;
}

const SkillDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<SkillVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { setSeo, clearSeo } = useSeo();

  const versionParam = searchParams.get('version');

  useEffect(() => {
    if (!id) return;

    const fetchSkill = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await skillAPI.getById(id, true);
        const data = res.data?.skill ?? res.data;
        if (!data) throw new Error('Skill not found');
        setSkill(data);

        const versions = data.versions || [];
        if (versions.length === 0 && data.version) {
          versions.push({
            version: data.version,
            description: data.description || '',
            content: '',
            tags: data.tags || [],
            createdAt: data.createdAt,
          });
        }

        let targetVersion: SkillVersion | null = null;
        if (versionParam && versions.length > 0) {
          targetVersion = versions.find((v: SkillVersion) => v.version === versionParam) || null;
          if (!targetVersion) {
            const verRes = await skillAPI.getVersion(id, versionParam);
            const verData = verRes.data?.version ?? verRes.data;
            if (verData) {
              targetVersion = verData;
            }
          }
        }
        if (!targetVersion && versions.length > 0) {
          targetVersion = versions[0];
        }
        setSelectedVersion(targetVersion);
      } catch (err: unknown) {
        const msg = err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
        setError(msg || (err instanceof Error ? err.message : 'Failed to load skill'));
      } finally {
        setLoading(false);
      }
    };

    fetchSkill();
  }, [id, versionParam]);

  useEffect(() => {
    if (skill) {
      const desc = skill.description?.slice(0, 160) || '';
      setSeo({
        title: `${skill.name} - ${skill.category || 'Skill'}`,
        description: desc,
        canonical: `${window.location.origin}/skills/${skill._id}`,
      });
    }
    return () => clearSeo();
  }, [skill, setSeo, clearSeo]);

  useEffect(() => {
    if (isAuthenticated && skill?._id) {
      userAPI
        .getFavorites()
        .then((res) => {
          const list = res.data?.data?.skills || res.data?.skills || [];
          setIsFavorite(list.some((s: any) => s._id === skill._id));
        })
        .catch(() => {});
    } else {
      setIsFavorite(false);
    }
  }, [isAuthenticated, skill?._id]);

  const handleVersionChange = (ver: SkillVersion) => {
    setSelectedVersion(ver);
    setSearchParams(ver.version ? { version: ver.version } : {});
  };

  const getAuthorName = () => {
    if (!skill?.author) return '未知';
    const a = skill.author;
    return a.fullName || a.username || '未知';
  };

  const getRating = () => skill?.rating?.average ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-8 px-4 md:px-6">
          <p className="text-destructive mb-4">{error || t('skills.fetchError')}</p>
          <Link to="/skills">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('skills.backToList', '返回技能库')}
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const versions = skill.versions || [];
  if (versions.length === 0 && skill.version) {
    versions.push({
      version: skill.version,
      description: skill.description || '',
      content: '',
      tags: skill.tags || [],
      createdAt: (skill as { createdAt?: string }).createdAt,
    });
  }

  const displayDesc = selectedVersion?.description ?? skill.description ?? '';
  const displayTags = (selectedVersion?.tags && selectedVersion.tags.length > 0) ? selectedVersion.tags : (skill.tags || []);

  const handleDownload = () => {
    const url = skillAPI.getDownloadUrl(skill._id, selectedVersion?.version);
    window.open(url, '_blank');
  };

  const installCommand = selectedVersion?.version
    ? `skm get ${skill.name}@${selectedVersion.version}`
    : `skm get ${skill.name}`;

  const handleCopyInstall = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      toast.success(t('skills.copySuccess', '已复制到剪贴板'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('skills.copyFailed', '复制失败'));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8 px-4 md:px-6 max-w-4xl mx-auto">
        <Link
          to="/skills"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('skills.backToList', '返回技能库')}
        </Link>

        {/* 头部信息卡片 */}
        <div className="bg-card rounded-xl border mb-6">
          <div className="p-4 md:p-6 space-y-4">
            {/* 名称行：名称 + 版本选择 + 按钮（最右） */}
            <div className="flex flex-wrap items-center gap-2 gap-y-3">
              <h1 className="text-xl md:text-2xl font-bold font-heading break-words">{skill.name}</h1>
              {versions.length > 1 ? (
                versions.length <= 6 ? (
                  <div className="flex flex-wrap gap-1">
                    {versions.map((v: SkillVersion) => (
                      <button
                        key={v.version}
                        type="button"
                        onClick={() => handleVersionChange(v)}
                        className={`px-2.5 py-1 rounded text-sm ${
                          selectedVersion?.version === v.version
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {v.version === 'latest' ? 'latest' : `v${v.version}`}
                      </button>
                    ))}
                  </div>
                ) : (
                  <select
                    value={selectedVersion?.version || ''}
                    onChange={(e) => {
                      const v = versions.find((x: SkillVersion) => x.version === e.target.value);
                      if (v) handleVersionChange(v);
                    }}
                    className="border rounded px-2.5 py-1 bg-background text-sm"
                  >
                    {versions.map((v: SkillVersion) => (
                      <option key={v.version} value={v.version}>
                        {v.version === 'latest' ? 'latest' : `v${v.version}`}
                      </option>
                    ))}
                  </select>
                )
              ) : selectedVersion ? (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                  {selectedVersion.version === 'latest' ? 'latest' : `v${selectedVersion.version}`}
                </span>
              ) : null}
              <div className="flex-1" />
              <div className="flex items-center gap-2 shrink-0">
                {(skill.repositoryUrl || skill.documentationUrl || skill.demoUrl) && (
                  <>
                    {skill.repositoryUrl && (
                      <a
                        href={skill.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm border bg-background hover:bg-accent"
                      >
                        {skill.repositoryUrl.includes('github.com') ? <Github className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                        {skill.repositoryUrl.includes('github.com') ? 'GitHub' : t('skills.repository', '仓库')}
                      </a>
                    )}
                    {skill.documentationUrl && (
                      <a
                        href={skill.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm border bg-background hover:bg-accent"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        {t('skills.documentation', '文档')}
                      </a>
                    )}
                    {skill.demoUrl && (
                      <a
                        href={skill.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm border bg-background hover:bg-accent"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t('skills.demo', '演示')}
                      </a>
                    )}
                  </>
                )}
                {isAuthenticated && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={favoriteLoading}
                    onClick={async () => {
                      if (!skill?._id) return;
                      setFavoriteLoading(true);
                      try {
                        if (isFavorite) {
                          await userAPI.removeFavorite(skill._id);
                          setIsFavorite(false);
                          toast.success(t('profile.removedFromFavorites', '已取消收藏'));
                        } else {
                          await userAPI.addFavorite(skill._id);
                          setIsFavorite(true);
                          toast.success(t('profile.addedToFavorites', '已添加收藏'));
                        }
                      } catch {
                        toast.error(t('profile.favoriteFailed', '操作失败'));
                      } finally {
                        setFavoriteLoading(false);
                      }
                    }}
                    title={isFavorite ? t('profile.removeFavorite') : t('profile.addToFavorites')}
                  >
                    <Heart className={`h-3.5 w-3.5 mr-1.5 ${isFavorite ? 'fill-current' : ''}`} />
                    {isFavorite ? t('profile.removeFavorite', '取消收藏') : t('profile.addToFavorites', '收藏')}
                  </Button>
                )}
                <Button onClick={handleDownload} size="sm">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  {t('common.download')}
                </Button>
              </div>
            </div>

            {/* 描述 */}
            {displayDesc && (
              <div className="pt-2 border-t">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-0 prose-p:leading-relaxed prose-p:text-foreground/90 text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{displayDesc}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* 安装命令 */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/60 border">
              <span className="text-muted-foreground text-sm font-mono">$</span>
              <code className="flex-1 text-sm font-mono truncate">{installCommand}</code>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-8 w-8 p-0"
                onClick={handleCopyInstall}
                title={t('skills.copyInstall', '复制安装命令')}
              >
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* 卡片底部：作者、标签、下载量等 */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 border-t text-sm text-muted-foreground">
              <span>{t('skills.author')}: {getAuthorName()}</span>
              {skill.category && <span>{t(`skills.category.${skill.category}`)}</span>}
              <span className="inline-flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5 shrink-0" />
                {(skill.downloads ?? 0).toLocaleString()} {t('skills.downloads')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                {getRating().toFixed(1)}
              </span>
              {displayTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {displayTags.map((tag: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 文档内容区 */}
        <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
          <div className="border-b bg-muted/30 px-6 py-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              SKILL.md
              {selectedVersion && (
                <span className="text-muted-foreground font-normal">{selectedVersion.version === 'latest' ? 'latest' : `v${selectedVersion.version}`}</span>
              )}
            </h2>
          </div>
          <div className="p-6 md:p-8">
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-heading prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-table:text-sm prose-th:bg-muted/50 prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2">
              {selectedVersion?.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {selectedVersion.content}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground py-8 text-center">
                  {t('skills.noDocumentation', '暂无文档内容')}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SkillDetailPage;
