import { Editor } from '@tiptap/react';
import { Link as LinkIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTranslation } from 'react-i18next';

interface LinkPopoverProps {
  editor: Editor;
}

export const LinkPopover = ({ editor }: LinkPopoverProps) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [open, setOpen] = useState(false);

  const handleSetLink = () => {
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
      setOpen(false);
      setUrl('');
    }
  };

  const handleUnsetLink = () => {
    editor.chain().focus().unsetLink().run();
    setOpen(false);
    setUrl('');
  };

  const currentUrl = editor.getAttributes('link').href || '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={editor.isActive('link') ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => {
            if (editor.isActive('link')) {
              setUrl(currentUrl);
            }
            setOpen(true);
          }}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t('editor.toolbar.linkUrl', '链接 URL')}</label>
            {editor.isActive('link') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnsetLink}
                className="h-6 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Input
            value={url || currentUrl}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSetLink();
              }
            }}
          />
          <Button onClick={handleSetLink} size="sm" className="w-full">
            {t('editor.toolbar.setLink', '设置链接')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
