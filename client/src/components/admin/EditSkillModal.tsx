import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { Upload, Loader2 } from 'lucide-react';
import { skillAdminAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useCategories } from '@/hooks/useCategories';
import type { AdminSkill, AdminSkillVersion } from '@/hooks/useAdminSkills';

interface EditSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: AdminSkill | null;
  onSuccess: (id: string, data: Record<string, unknown>) => Promise<boolean>;
}

export const EditSkillModal = ({ isOpen, onClose, skill, onSuccess }: EditSkillModalProps) => {
  const { t } = useTranslation();
  const { categories, loading: categoriesLoading } = useCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    category: 'tools',
    tags: '',
    status: '',
    repositoryUrl: '',
    content: '' as string | undefined,
  });
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);

  const versionList: AdminSkillVersion[] = (skill?.versions && skill.versions.length > 0)
    ? skill.versions
    : (skill?.version ? [{ version: skill.version, description: skill.description || '', tags: skill.tags || [] }] : []);

  useEffect(() => {
    if (skill) {
      const ver = versionList[0];
      const desc = ver?.description ?? skill.description ?? '';
      const tags = (ver?.tags && ver.tags.length > 0) ? ver.tags : (skill.tags || []);
      setForm(prev => ({
        ...prev,
        name: skill.name,
        description: desc,
        version: ver?.version || skill.version || '1.0.0',
        category: skill.category || 'tools',
        tags: tags.join(', '),
        status: skill.status || 'draft',
        repositoryUrl: (skill as { repositoryUrl?: string }).repositoryUrl || '',
        content: prev.content || ver?.content,
      }));
    }
  }, [skill]);

  useEffect(() => {
    if (!skill || !form.version) return;
    const ver = versionList.find(v => v.version === form.version);
    if (ver) {
      setForm(prev => ({
        ...prev,
        description: ver.description || prev.description,
        tags: (ver.tags && ver.tags.length > 0) ? ver.tags.join(', ') : prev.tags,
        content: prev.content === undefined ? ver.content : prev.content,
      }));
    }
  }, [form.version, skill?._id]);

  const handleVersionChange = (version: string) => {
    setForm(prev => ({ ...prev, version, content: undefined }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !skill) return;
    setParsing(true);
    try {
      const res = await skillAdminAPI.parseUpload(file);
      const { data, content } = res.data;
      setForm(prev => ({
        ...prev,
        description: data.description || prev.description,
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags ? [].concat(data.tags).join(', ') : prev.tags),
        content: content || '',
      }));
      toast.success(t('admin.parseSuccess', '解析成功'));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Parse failed');
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setForm(prev => ({ ...prev, content: undefined }));
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skill || !form.name.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      const tags = form.tags ? form.tags.split(',').map(s => s.trim()).filter(Boolean) : [];
      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        version: form.version,
        category: form.category,
        tags,
        status: form.status,
        repositoryUrl: form.repositoryUrl || undefined,
      };
      if (form.content !== undefined && form.content !== '') {
        payload.content = form.content;
      }
      const ok = await onSuccess(skill._id, payload);
      if (ok) handleClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !skill) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-card rounded-lg border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">{t('admin.edit')} - {skill.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.skillName')}</label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          {versionList.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">{t('skills.version')}</label>
              <select
                value={form.version}
                onChange={e => handleVersionChange(e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-background text-sm"
              >
                {versionList.map(v => (
                  <option key={v.version} value={v.version}>
                    {v.version === 'latest' ? 'latest' : `v${v.version}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">{t('admin.reuploadVersionHint', '选择版本后可重新上传该版本的技能包')}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.permissionDesc')}</label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.categoryLabel', '分类')}</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-md px-3 py-2 bg-background text-sm truncate"
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
          <div>
            <label className="block text-sm font-medium mb-1">{t('skills.repositoryUrl', 'GitHub / 仓库链接')}</label>
            <Input
              value={form.repositoryUrl}
              onChange={e => setForm({ ...form, repositoryUrl: e.target.value })}
              placeholder="https://github.com/user/repo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('admin.reuploadVersion', '重新上传该版本')}</label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".zip,.tar.gz,.gz,.md"
                onChange={handleFileChange}
                disabled={parsing}
              />
              {parsing ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-1" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
              )}
              <span className="text-xs text-muted-foreground">
                {parsing ? t('admin.parsing', '解析中...') : t('admin.reuploadVersionFile', '上传 .zip / .tar.gz / .md 覆盖该版本')}
              </span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('profile.status')}</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border rounded-md px-3 py-2 bg-background text-sm">
              <option value="published">{t('admin.published')}</option>
              <option value="pending_review">{t('admin.pending')}</option>
              <option value="draft">{t('admin.skillStatus.draft')}</option>
              <option value="archived">{t('admin.rejected')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={saving}>{saving ? t('common.loading') : t('admin.update')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
