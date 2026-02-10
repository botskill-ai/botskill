import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PrivacyPage = () => {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold font-heading mb-4">
              {t('privacy.title', '隐私政策')}
            </h1>
            <p className="text-muted-foreground">
              {t('privacy.lastUpdated', '最后更新：2024年1月1日')}
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('privacy.introduction.title', '1. 介绍')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('privacy.introduction.content', 'BotSkill（"我们"、"我们的"或"本平台"）致力于保护您的隐私。本隐私政策说明了我们如何收集、使用、存储和保护您的个人信息。')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('privacy.dataCollection.title', '2. 信息收集')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('privacy.dataCollection.content', '我们可能收集以下类型的信息：')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>{t('privacy.dataCollection.item1', '账户信息：用户名、邮箱地址、密码（加密存储）')}</li>
                <li>{t('privacy.dataCollection.item2', '个人资料：姓名、头像、个人简介等可选信息')}</li>
                <li>{t('privacy.dataCollection.item3', '使用数据：访问记录、下载记录、搜索历史等')}</li>
                <li>{t('privacy.dataCollection.item4', '技术信息：IP地址、浏览器类型、设备信息等')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('privacy.dataUse.title', '3. 信息使用')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('privacy.dataUse.content', '我们使用收集的信息用于以下目的：')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>{t('privacy.dataUse.item1', '提供、维护和改进我们的服务')}</li>
                <li>{t('privacy.dataUse.item2', '处理您的请求和交易')}</li>
                <li>{t('privacy.dataUse.item3', '发送重要通知和更新')}</li>
                <li>{t('privacy.dataUse.item4', '分析使用情况以改善用户体验')}</li>
                <li>{t('privacy.dataUse.item5', '检测和防止欺诈、滥用和安全问题')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('privacy.dataSharing.title', '4. 信息共享')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('privacy.dataSharing.content', '我们不会出售、交易或出租您的个人信息给第三方。我们可能在以下情况下共享信息：')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>{t('privacy.dataSharing.item1', '获得您的明确同意')}</li>
                <li>{t('privacy.dataSharing.item2', '法律要求或响应法律程序')}</li>
                <li>{t('privacy.dataSharing.item3', '保护我们的权利、财产或安全')}</li>
                <li>{t('privacy.dataSharing.item4', '与服务提供商共享（受保密协议约束）')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('privacy.dataSecurity.title', '5. 数据安全')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('privacy.dataSecurity.content', '我们采用行业标准的安全措施来保护您的个人信息，包括加密传输、安全存储和访问控制。然而，没有任何互联网传输或存储方法是100%安全的。')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('privacy.yourRights.title', '6. 您的权利')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('privacy.yourRights.content', '您有权：')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>{t('privacy.yourRights.item1', '访问、更新或删除您的个人信息')}</li>
                <li>{t('privacy.yourRights.item2', '撤回对数据处理的同意')}</li>
                <li>{t('privacy.yourRights.item3', '请求数据导出')}</li>
                <li>{t('privacy.yourRights.item4', '提出投诉或问题')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('privacy.cookies.title', '7. Cookie 和跟踪技术')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('privacy.cookies.content', '我们使用 Cookie 和类似技术来改善用户体验、分析使用情况并提供个性化内容。您可以通过浏览器设置管理 Cookie 偏好。')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('privacy.changes.title', '8. 政策变更')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('privacy.changes.content', '我们可能会不时更新本隐私政策。重大变更将通过电子邮件或网站公告通知您。继续使用我们的服务即表示您接受更新后的政策。')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('privacy.contact.title', '9. 联系我们')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('privacy.contact.content', '如果您对本隐私政策有任何问题或疑虑，请通过以下方式联系我们：')}
              </p>
              <p className="text-muted-foreground">
                {t('privacy.contact.email', '邮箱：')} <a href="mailto:admin@botskill.ai" className="text-primary hover:underline">admin@botskill.ai</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
