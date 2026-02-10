import { Editor } from '@tiptap/react';
import { Heading1, Heading2, Heading3, Heading4, Heading5, Heading6 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';

interface HeadingDropdownProps {
  editor: Editor;
}

export const HeadingDropdown = ({ editor }: HeadingDropdownProps) => {
  const { t } = useTranslation();
  const items = [
    { level: 1, label: t('editor.toolbar.heading1', '标题 1'), icon: Heading1 },
    { level: 2, label: t('editor.toolbar.heading2', '标题 2'), icon: Heading2 },
    { level: 3, label: t('editor.toolbar.heading3', '标题 3'), icon: Heading3 },
    { level: 4, label: t('editor.toolbar.heading4', '标题 4'), icon: Heading4 },
    { level: 5, label: t('editor.toolbar.heading5', '标题 5'), icon: Heading5 },
    { level: 6, label: t('editor.toolbar.heading6', '标题 6'), icon: Heading6 },
  ];

  const currentLevel = items.find(item => 
    editor.isActive('heading', { level: item.level })
  )?.level;

  const currentLabel = currentLevel 
    ? items.find(item => item.level === currentLevel)?.label 
    : t('editor.toolbar.paragraph', '段落');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={currentLevel ? 'default' : 'ghost'}
          size="sm"
          className="h-8 px-3"
        >
          {currentLabel}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive('paragraph') ? 'bg-muted' : ''}
        >
          {t('editor.toolbar.paragraph', '段落')}
        </DropdownMenuItem>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.level}
              onClick={() => editor.chain().focus().toggleHeading({ level: item.level as 1 | 2 | 3 | 4 | 5 | 6 }).run()}
              className={editor.isActive('heading', { level: item.level }) ? 'bg-muted' : ''}
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
