import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TiptapLink from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Quote, Code, Image as ImageIcon,
  Undo, Redo, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HeadingDropdown } from './components/HeadingDropdown';
import { ListDropdown } from './components/ListDropdown';
import { LinkPopover } from './components/LinkPopover';
import { ImageUploadDialog } from './components/ImageUploadDialog';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SimpleEditorProps {
  content?: string;
  placeholder?: string;
  onUpdate?: (content: string) => void;
  className?: string;
}

export const SimpleEditor = ({ 
  content = '', 
  placeholder = '开始输入...',
  onUpdate,
  className 
}: SimpleEditorProps) => {
  const { t } = useTranslation();
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3 h-full',
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        const html = editor.getHTML();
        onUpdate(html);
      }
    },
  });

  // 同步外部 content 变化到编辑器
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHtml = editor.getHTML();
      if (currentHtml !== content) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-background flex flex-col', className)}>
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-2 flex flex-wrap items-center gap-1 shrink-0">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className="h-8 w-8 p-0"
            title={t('editor.toolbar.bold', '加粗 (Ctrl+B)')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className="h-8 w-8 p-0"
            title={t('editor.toolbar.italic', '斜体 (Ctrl+I)')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className="h-8 w-8 p-0"
            title={t('editor.toolbar.underline', '下划线 (Ctrl+U)')}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className="h-8 w-8 p-0"
            title={t('editor.toolbar.strikethrough', '删除线')}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('highlight') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className="h-8 w-8 p-0"
            title={t('editor.toolbar.highlight', '高亮')}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          {/* 文本颜色 */}
          <div className="flex items-center gap-1">
            <input
              type="color"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              className="h-8 w-8 cursor-pointer border rounded"
              title={t('editor.toolbar.textColor', '文本颜色')}
            />
          </div>
        </div>

        {/* Headings - 使用下拉菜单 */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <HeadingDropdown editor={editor} />
        </div>

        {/* Lists - 使用下拉菜单 */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <ListDropdown editor={editor} />
        </div>

        {/* Other Formats */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="h-8 w-8 p-0"
            title={t('editor.toolbar.blockquote', '引用')}
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className="h-8 w-8 p-0"
            title={t('editor.toolbar.codeBlock', '代码块')}
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className="h-8 w-8 p-0"
            title={t('editor.toolbar.alignLeft', '左对齐')}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className="h-8 w-8 p-0"
            title={t('editor.toolbar.alignCenter', '居中')}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className="h-8 w-8 p-0"
            title={t('editor.toolbar.alignRight', '右对齐')}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className="h-8 w-8 p-0"
            title={t('editor.toolbar.alignJustify', '两端对齐')}
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>

        {/* Links and Images */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <LinkPopover editor={editor} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setImageDialogOpen(true)}
            className="h-8 w-8 p-0"
            title={t('editor.toolbar.insertImage', '插入图片')}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0"
            title={t('editor.toolbar.undo', '撤销 (Ctrl+Z)')}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0"
            title={t('editor.toolbar.redo', '重做 (Ctrl+Shift+Z)')}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div 
        className="flex-1 overflow-y-auto min-h-0 cursor-text"
        onMouseDown={(e) => {
          // 如果点击的是容器本身（空白区域），则聚焦编辑器
          if (e.target === e.currentTarget) {
            editor.commands.focus('end');
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onInsert={(url) => {
          editor.chain().focus().setImage({ src: url }).run();
        }}
      />
    </div>
  );
};
