import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TermsPage = () => {
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
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold font-heading mb-4">
              {t('terms.title', '服务条款')}
            </h1>
            <p className="text-muted-foreground">
              {t('terms.lastUpdated', '最后更新：2024年1月1日')}
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('terms.acceptance.title', '1. 接受条款')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('terms.acceptance.content', '通过访问和使用 BotSkill 平台（"服务"），您同意遵守并受本服务条款的约束。如果您不同意这些条款，请不要使用我们的服务。')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('terms.description.title', '2. 服务描述')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('terms.description.content', 'BotSkill 是一个技能分享平台，允许用户发现、下载和发布技能。我们保留随时修改、暂停或终止服务的权利，恕不另行通知。')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('terms.account.title', '3. 用户账户')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('terms.account.content', '使用某些功能需要创建账户。您同意：')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>{t('terms.account.item1', '提供准确、完整和最新的信息')}</li>
                <li>{t('terms.account.item2', '维护账户信息的安全性和保密性')}</li>
                <li>{t('terms.account.item3', '对账户下的所有活动负责')}</li>
                <li>{t('terms.account.item4', '立即通知我们任何未经授权的使用')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('terms.userContent.title', '4. 用户内容')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('terms.userContent.content', '您保留对您上传到平台的所有内容的权利。通过上传内容，您授予我们：')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>{t('terms.userContent.item1', '在全球范围内使用、复制、分发和展示内容的许可')}</li>
                <li>{t('terms.userContent.item2', '修改内容以使其适应平台格式的权利')}</li>
                <li>{t('terms.userContent.item3', '删除违反本条款的内容的权利')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('terms.prohibited.title', '5. 禁止行为')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('terms.prohibited.content', '您同意不：')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>{t('terms.prohibited.item1', '上传非法、有害、威胁、辱骂、骚扰、诽谤、粗俗或其他令人反感的内容')}</li>
                <li>{t('terms.prohibited.item2', '侵犯任何第三方的知识产权')}</li>
                <li>{t('terms.prohibited.item3', '传播恶意软件、病毒或其他有害代码')}</li>
                <li>{t('terms.prohibited.item4', '尝试未经授权访问系统或数据')}</li>
                <li>{t('terms.prohibited.item5', '干扰或破坏服务的正常运行')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('terms.intellectualProperty.title', '6. 知识产权')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('terms.intellectualProperty.content', '平台及其所有内容（包括但不限于文本、图形、徽标、图标、图像、音频剪辑、数字下载和软件）均为 BotSkill 或其内容提供商的财产，受版权、商标和其他知识产权法保护。')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('terms.disclaimer.title', '7. 免责声明')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('terms.disclaimer.content', '服务按"现状"和"可用"基础提供。我们不保证服务将无中断、及时、安全或无错误。我们不对任何直接、间接、偶然或后果性损害承担责任。')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('terms.termination.title', '8. 终止')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('terms.termination.content', '我们保留随时终止或暂停您的账户和访问服务的权利，无需事先通知，原因包括但不限于违反本服务条款。')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('terms.changes.title', '9. 条款变更')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('terms.changes.content', '我们保留随时修改本服务条款的权利。重大变更将通过电子邮件或网站公告通知您。继续使用服务即表示您接受修改后的条款。')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('terms.contact.title', '10. 联系我们')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('terms.contact.content', '如果您对本服务条款有任何问题，请通过以下方式联系我们：')}
              </p>
              <p className="text-muted-foreground">
                {t('terms.contact.email', '邮箱：')} <a href="mailto:admin@botskill.ai" className="text-primary hover:underline">admin@botskill.ai</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
