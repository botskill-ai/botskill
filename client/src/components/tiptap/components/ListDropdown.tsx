import { Editor } from '@tiptap/react';
import { List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from 'react-i18next';

interface ListDropdownProps {
  editor: Editor;
}

export const ListDropdown = ({ editor }: ListDropdownProps) => {
  const { t } = useTranslation();
  const items = [
    {
      type: 'bulletList',
      label: t('editor.toolbar.bulletList', '无序列表'),
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      type: 'orderedList',
      label: t('editor.toolbar.orderedList', '有序列表'),
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ];

  const currentType = items.find(item => editor.isActive(item.type))?.type;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={currentType ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.type}
              onClick={item.action}
              className={editor.isActive(item.type) ? 'bg-muted' : ''}
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
