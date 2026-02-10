import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

const PolicyModal = ({ isOpen, onClose, type }: PolicyModalProps) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const isTerms = type === 'terms';
  const title = isTerms 
    ? t('terms.title', '服务条款')
    : t('privacy.title', '隐私政策');

  // 获取内容 - 使用国际化翻译
  const getContent = () => {
    if (isTerms) {
      return `
## ${t('terms.acceptance.title')}

${t('terms.acceptance.content')}

## ${t('terms.description.title')}

${t('terms.description.content')}

## ${t('terms.account.title')}

${t('terms.account.content')}
- ${t('terms.account.item1')}
- ${t('terms.account.item2')}
- ${t('terms.account.item3')}
- ${t('terms.account.item4')}

## ${t('terms.userContent.title')}

${t('terms.userContent.content')}
- ${t('terms.userContent.item1')}
- ${t('terms.userContent.item2')}
- ${t('terms.userContent.item3')}

## ${t('terms.prohibited.title')}

${t('terms.prohibited.content')}
- ${t('terms.prohibited.item1')}
- ${t('terms.prohibited.item2')}
- ${t('terms.prohibited.item3')}
- ${t('terms.prohibited.item4')}
- ${t('terms.prohibited.item5')}

## ${t('terms.intellectualProperty.title')}

${t('terms.intellectualProperty.content')}

## ${t('terms.disclaimer.title')}

${t('terms.disclaimer.content')}

## ${t('terms.termination.title')}

${t('terms.termination.content')}

## ${t('terms.changes.title')}

${t('terms.changes.content')}

## ${t('terms.contact.title')}

${t('terms.contact.content')}
${t('terms.contact.email')} admin@botskill.ai
      `;
    } else {
      return `
## ${t('privacy.introduction.title')}

${t('privacy.introduction.content')}

## ${t('privacy.dataCollection.title')}

${t('privacy.dataCollection.content')}
- ${t('privacy.dataCollection.item1')}
- ${t('privacy.dataCollection.item2')}
- ${t('privacy.dataCollection.item3')}
- ${t('privacy.dataCollection.item4')}

## ${t('privacy.dataUse.title')}

${t('privacy.dataUse.content')}
- ${t('privacy.dataUse.item1')}
- ${t('privacy.dataUse.item2')}
- ${t('privacy.dataUse.item3')}
- ${t('privacy.dataUse.item4')}
- ${t('privacy.dataUse.item5')}

## ${t('privacy.dataSharing.title')}

${t('privacy.dataSharing.content')}
- ${t('privacy.dataSharing.item1')}
- ${t('privacy.dataSharing.item2')}
- ${t('privacy.dataSharing.item3')}
- ${t('privacy.dataSharing.item4')}

## ${t('privacy.dataSecurity.title')}

${t('privacy.dataSecurity.content')}

## ${t('privacy.yourRights.title')}

${t('privacy.yourRights.content')}
- ${t('privacy.yourRights.item1')}
- ${t('privacy.yourRights.item2')}
- ${t('privacy.yourRights.item3')}
- ${t('privacy.yourRights.item4')}

## ${t('privacy.cookies.title')}

${t('privacy.cookies.content')}

## ${t('privacy.changes.title')}

${t('privacy.changes.content')}

## ${t('privacy.contact.title')}

${t('privacy.contact.content')}
${t('privacy.contact.email')} admin@botskill.ai
      `;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-background rounded-lg border shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold font-heading">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {getContent()}
            </ReactMarkdown>
          </div>
        </div>
        <div className="p-6 border-t flex justify-end">
          <Button onClick={onClose}>
            {t('common.close', '关闭')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;
