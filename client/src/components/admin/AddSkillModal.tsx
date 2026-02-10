import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { Upload, Loader2 } from 'lucide-react';
import { skillAdminAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useCategories } from '@/hooks/useCategories';

export interface SkillFormData {
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string;
  license: string;
  repositoryUrl: string;
  documentationUrl: string;
  demoUrl: string;
  status: string;
  content: string;
}

const INITIAL: SkillFormData = {
  name: '',
  description: '',
  version: '1.0.0',
  category: 'tools',
  tags: '',
  license: 'MIT',
  repositoryUrl: '',
  documentationUrl: '',
  demoUrl: '',
  status: 'published',
  content: '',
};

export type AddSkillMode = 'upload' | 'url';

export interface CreateSkillResult {
  ok: boolean;
  error?: string;
}

interface AddSkillModalProps {
  isOpen: boolean;
  mode: AddSkillMode;
  onClose: () => void;
  onSuccess: (data: SkillFormData & { tags: string[]; overwrite?: boolean }) => Promise<CreateSkillResult>;
}

export const AddSkillModal = ({ isOpen, mode, onClose, onSuccess }: AddSkillModalProps) => {
  const { t } = useTranslation();
  const { categories, loading: categoriesLoading } = useCategories();
  const [step, setStep] = useState<'input' | 'form'>('input');
  const [urlInput, setUrlInput] = useState('');
  const [form, setForm] = useState<SkillFormData>(INITIAL);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setStep('input');
    setForm(INITIAL);
    setUrlInput('');
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setParsing(true);
    try {
      const res = await skillAdminAPI.parseUpload(file);
      const { data, content } = res.data;

      setForm({
        name: data.name || '',
        description: data.description || '',
        version: data.version || '1.0.0',
        category: data.category || 'tools',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        license: data.license || 'MIT',
        repositoryUrl: data.repositoryUrl || '',
        documentationUrl: data.documentationUrl || '',
        demoUrl: data.demoUrl || '',
        status: 'published',
        content: content || '',
      });
      setStep('form');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; details?: string[] } } };
      const msg = e.response?.data?.error || 'Parse failed';
      const details = e.response?.data?.details;
      setParseError(details?.length ? `${msg}: ${details.join(', ')}` : msg);
      toast.error(msg);
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFetchUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;
    setParseError(null);
    setParsing(true);
    try {
      const res = await skillAdminAPI.parseFromUrl(url);
      const { data, content } = res.data;
      setForm({
        name: data.name || '',
        description: data.description || '',
        version: data.version || 'latest',
        category: data.category || 'tools',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        license: data.license || 'MIT',
        repositoryUrl: data.repositoryUrl || url,
        documentationUrl: data.documentationUrl || '',
        demoUrl: data.demoUrl || '',
        status: 'published',
        content: content || '',
      });
      setStep('form');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; details?: string[] } } };
      const msg = e.response?.data?.error || 'Parse failed';
      const details = e.response?.data?.details;
      setParseError(details?.length ? `${msg}: ${details.join(', ')}` : msg);
      toast.error(msg);
    } finally {
      setParsing(false);
    }
  };

  const submitData = (overwrite = false) => {
    const tags = form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [];
    return onSuccess({
      ...form,
      tags,
      repositoryUrl: form.repositoryUrl || undefined,
      documentationUrl: form.documentationUrl || undefined,
      demoUrl: form.demoUrl || undefined,
      content: form.content || undefined,
      overwrite: overwrite || undefined,
    } as SkillFormData & { tags: string[]; overwrite?: boolean });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      let result = await submitData(false);
      if (result?.error === 'VERSION_EXISTS') {
        const confirmed = window.confirm(
          t('admin.versionExistsConfirm', '版本 {{version}} 已存在，确定要覆盖旧版本吗？', { version: form.version })
        );
        if (confirmed) {
          result = await submitData(true);
        } else {
          return;
        }
      }
      if (result?.ok) handleClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-card rounded-lg border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">{t('admin.addSkill')}</h2>

        {step === 'input' && (
          <div className="space-y-4">
            {mode === 'upload' ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {t('admin.uploadSkillHint', '请上传技能文件包（.zip、.tar.gz）或 SKILL.md 文件，解析成功后即可填写并保存')}
                </p>
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".zip,.tar.gz,.gz,.md"
                    onChange={handleFileChange}
                    disabled={parsing}
                  />
                  {parsing ? (
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-2" />
                  ) : (
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {parsing ? t('admin.parsing', '解析中...') : t('admin.uploadOrDrop', '点击或拖拽文件到此处')}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">.zip, .tar.gz, .md</span>
                </label>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {t('admin.urlSkillHint', '输入远程地址或 GitHub 仓库地址，下载并解析后即可保存。版本默认 latest。')}
                </p>
                <div className="flex gap-2">
                  <Input
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://github.com/user/repo 或 https://example.com/skill.zip"
                    disabled={parsing}
                    onKeyDown={e => e.key === 'Enter' && handleFetchUrl()}
                  />
                  <Button type="button" onClick={handleFetchUrl} disabled={parsing || !urlInput.trim()}>
                    {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : t('admin.fetchAndParse', '获取并解析')}
                  </Button>
                </div>
              </>
            )}
            {parseError && (
              <p className="text-sm text-destructive">{parseError}</p>
            )}
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>{t('common.cancel')}</Button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-green-600 dark:text-green-400">
              {t('admin.parseSuccess', '解析成功，请确认信息后保存')}
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">{t('profile.skillName')}</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="my-skill" />
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.addVersionHint', '若技能已存在，将添加新版本；否则创建新技能')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('admin.permissionDesc')}</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                required
                placeholder="Skill description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('skills.version')}</label>
                <Input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="1.0.0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('admin.categoryLabel', '分类')}</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 bg-background text-sm truncate"
                  required
                  disabled={categoriesLoading}
                  style={{ 
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {categoriesLoading ? (
                    <option value="">{t('common.loading', '加载中...')}</option>
                  ) : categories.length > 0 ? (
                    categories.map(cat => (
                      <option key={cat._id} value={cat.name} title={cat.displayName}>
                        {cat.displayName.length > 30 ? `${cat.displayName.slice(0, 30)}...` : cat.displayName}
                      </option>
                    ))
                  ) : (
                    <option value="tools">{t('skills.category.tools', '开发工具')}</option>
                  )}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
              <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="ai, nlp, text" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('skills.repositoryUrl', 'GitHub / 仓库链接')}</label>
              <Input
                value={form.repositoryUrl}
                onChange={e => setForm({ ...form, repositoryUrl: e.target.value })}
                placeholder="https://github.com/user/repo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">License</label>
              <Input value={form.license} onChange={e => setForm({ ...form, license: e.target.value })} placeholder="MIT" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('profile.status')}</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border rounded-md px-3 py-2 bg-background text-sm">
                <option value="published">{t('admin.published')}</option>
                <option value="pending_review">{t('admin.pending')}</option>
                <option value="draft">{t('admin.skillStatus.draft')}</option>
              </select>
            </div>
            {form.content && (
              <div>
                <label className="block text-sm font-medium mb-1">{t('skills.documentation')}</label>
                <div className="rounded-md border bg-muted/30 p-3 max-h-40 overflow-y-auto text-sm whitespace-pre-wrap">
                  {form.content}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setStep('input'); setUrlInput(''); }}>
                {mode === 'upload' ? t('admin.reupload', '重新上传') : t('admin.reenterUrl', '重新输入')}
              </Button>
              <Button type="button" variant="outline" onClick={handleClose}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={saving}>{saving ? t('common.loading') : t('admin.save')}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
