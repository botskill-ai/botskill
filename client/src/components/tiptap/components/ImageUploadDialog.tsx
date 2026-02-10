import { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string) => void;
}

export const ImageUploadDialog = ({
  open,
  onOpenChange,
  onInsert,
}: ImageUploadDialogProps) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error(t('editor.invalidImageType', '请选择图片文件'));
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('editor.imageTooLarge', '图片大小不能超过 5MB'));
      return;
    }

    // 显示预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 上传文件
    try {
      setUploading(true);
      const { blogAPI } = await import('@/lib/api');
      const response = await blogAPI.uploadImage(file);
      
      const data = response.data;
      const imageUrl = data.url || data.data?.url;
      
      if (imageUrl) {
        // 如果返回的是相对路径（以 /api/ 开头），需要转换为完整 URL
        let finalUrl = imageUrl;
        if (imageUrl.startsWith('/api/')) {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
          // 移除 API_BASE_URL 末尾的 /api（如果存在），然后拼接相对路径
          const baseUrl = API_BASE_URL.replace(/\/api$/, '');
          finalUrl = `${baseUrl}${imageUrl}`;
        }
        
        onInsert(finalUrl);
        handleClose();
        toast.success(t('editor.uploadSuccess', '图片上传成功'));
      } else {
        throw new Error('未返回图片 URL');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || error.message || t('editor.uploadFailed', '图片上传失败'));
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlInsert = () => {
    if (!url.trim()) {
      toast.error(t('editor.urlRequired', '请输入图片 URL'));
      return;
    }

    // 简单的 URL 验证
    try {
      new URL(url);
      onInsert(url);
      handleClose();
    } catch {
      toast.error(t('editor.invalidUrl', '请输入有效的 URL'));
    }
  };

  const handleClose = () => {
    setUrl('');
    setPreview(null);
    setMode('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const fakeEvent = {
        target: { files: [file] },
      } as any;
      handleFileSelect(fakeEvent);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('editor.insertImage', '插入图片')}</DialogTitle>
          <DialogDescription>
            {t('editor.insertImageDesc', '上传图片或输入图片 URL')}
          </DialogDescription>
        </DialogHeader>

        {/* 模式切换 */}
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant={mode === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('upload')}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            {t('editor.upload', '上传')}
          </Button>
          <Button
            type="button"
            variant={mode === 'url' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('url')}
            className="flex-1"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            {t('editor.url', 'URL')}
          </Button>
        </div>

        {/* 上传模式 */}
        {mode === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {preview ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-48 rounded-lg border border-border"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 hover:bg-destructive/90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('editor.clickToChange', '点击更换图片')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {uploading ? (
                    <>
                      <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        {t('editor.uploading', '上传中...')}
                      </p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {t('editor.clickOrDrag', '点击或拖拽图片到此处')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('editor.imageFormatHint', '支持 JPG、PNG、GIF 等格式，最大 5MB')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* URL 模式 */}
        {mode === 'url' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('editor.imageUrl', '图片 URL')}
              </label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUrlInsert();
                  }
                }}
              />
            </div>
            {url && (
              <div className="rounded-lg border border-border overflow-hidden">
                <img
                  src={url}
                  alt="Preview"
                  className="w-full h-48 object-contain bg-muted"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            {t('common.cancel', '取消')}
          </Button>
          {mode === 'url' && (
            <Button
              type="button"
              onClick={handleUrlInsert}
              disabled={!url.trim()}
            >
              {t('editor.insert', '插入')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
