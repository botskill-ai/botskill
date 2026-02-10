import { useTranslation } from 'react-i18next';
import { Scale } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const LicensePage = () => {
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
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold font-heading mb-4">
              {t('license.title', '许可证')}
            </h1>
            <p className="text-muted-foreground">
              {t('license.subtitle', 'BotSkill 平台许可证信息')}
            </p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('license.platform.title', '平台许可证')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('license.platform.content', 'BotSkill 平台本身受版权保护，所有权利保留。未经明确书面许可，不得复制、修改、分发或使用平台的任何部分。')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('license.skills.title', '技能许可证')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('license.skills.content', '平台上发布的技能可能使用不同的许可证。每个技能都应在 SKILL.md 文件中明确说明其许可证。常见的许可证包括：')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>MIT License</strong> - {t('license.skills.mit', '允许商业和非商业使用，修改和分发')}
                </li>
                <li>
                  <strong>Apache 2.0</strong> - {t('license.skills.apache', '类似 MIT，但包含专利授权')}
                </li>
                <li>
                  <strong>GPL v3</strong> - {t('license.skills.gpl', '要求衍生作品也使用 GPL 许可证')}
                </li>
                <li>
                  <strong>BSD</strong> - {t('license.skills.bsd', '允许使用，但需保留版权声明')}
                </li>
                <li>
                  <strong>Proprietary</strong> - {t('license.skills.proprietary', '专有许可证，使用受限制')}
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('license.userRights.title', '用户权利')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('license.userRights.content', '作为用户，您有权：')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>{t('license.userRights.item1', '下载和使用符合其许可证的技能')}</li>
                <li>{t('license.userRights.item2', '查看技能的源代码（如果提供）')}</li>
                <li>{t('license.userRights.item3', '根据技能许可证修改和分发技能')}</li>
                <li>{t('license.userRights.item4', '报告违反许可证的行为')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('license.publisherRights.title', '发布者权利')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('license.publisherRights.content', '作为发布者，您：')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>{t('license.publisherRights.item1', '保留对您发布的技能的所有权利')}</li>
                <li>{t('license.publisherRights.item2', '可以选择任何开源或专有许可证')}</li>
                <li>{t('license.publisherRights.item3', '可以随时更新或删除您的技能')}</li>
                <li>{t('license.publisherRights.item4', '对您发布的内容负责，确保不侵犯第三方权利')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('license.compliance.title', '合规性')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('license.compliance.content', '所有用户和发布者必须遵守：')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>{t('license.compliance.item1', '尊重每个技能的许可证条款')}</li>
                <li>{t('license.compliance.item2', '在使用技能时遵守所有适用的法律和法规')}</li>
                <li>{t('license.compliance.item3', '不发布侵犯他人知识产权的技能')}</li>
                <li>{t('license.compliance.item4', '在技能中明确声明许可证信息')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('license.violations.title', '许可证违规')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('license.violations.content', '如果我们发现任何违反许可证的行为，我们保留：')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>{t('license.violations.item1', '删除违规内容')}</li>
                <li>{t('license.violations.item2', '暂停或终止违规账户')}</li>
                <li>{t('license.violations.item3', '配合法律程序')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {t('license.contact.title', '联系我们')}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t('license.contact.content', '如果您对许可证有任何问题或需要报告违规行为，请通过以下方式联系我们：')}
              </p>
              <p className="text-muted-foreground">
                {t('license.contact.email', '邮箱：')} <a href="mailto:admin@botskill.ai" className="text-primary hover:underline">admin@botskill.ai</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LicensePage;
