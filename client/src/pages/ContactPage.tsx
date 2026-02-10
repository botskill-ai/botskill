import { Mail, MessageSquare, Github, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const ContactPage = () => {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 这里可以添加实际的表单提交逻辑
    setTimeout(() => {
      toast.success(t('contact.submitSuccess', '消息已发送，我们会尽快回复您！'));
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-heading mb-4">
              {t('contact.title', '联系我们')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('contact.subtitle', '我们很乐意听到您的声音，随时欢迎您的反馈和建议')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-6">
                  {t('contact.getInTouch', '取得联系')}
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{t('contact.email', '邮箱')}</h3>
                      <a href="mailto:support@botskill.ai" className="text-primary hover:underline">
                        support@botskill.ai
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{t('contact.feedback', '反馈')}</h3>
                      <p className="text-muted-foreground text-sm">
                        {t('contact.feedbackDesc', '通过下面的表单提交您的反馈')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Github className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">GitHub</h3>
                      <a 
                        href="https://github.com/botskill-ai/botskill" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        github.com/botskill-ai/botskill
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{t('contact.website', '网站')}</h3>
                      <a 
                        href="https://botskill.ai" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        botskill.ai
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-2xl font-semibold mb-6">
                {t('contact.sendMessage', '发送消息')}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    {t('contact.name', '姓名')}
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder={t('contact.namePlaceholder', '请输入您的姓名')}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    {t('contact.email', '邮箱')}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder={t('contact.emailPlaceholder', 'your@email.com')}
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    {t('contact.subject', '主题')}
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder={t('contact.subjectPlaceholder', '请输入主题')}
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    {t('contact.message', '消息')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-3 py-2 border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('contact.messagePlaceholder', '请输入您的消息...')}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t('contact.sending', '发送中...') : t('contact.send', '发送')}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
