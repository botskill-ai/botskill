import { Download, Package, Server, Database, Cpu, HardDrive, Monitor, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Version {
  version: string;
  binaryUrl: string;
  dockerImage: string;
  md5: string;
  releaseNotes: string;
  docsUrl: string;
}

const DownloadPage = () => {
  const { t } = useTranslation();

  // 稳定版本数据
  const stableVersions: Version[] = [
    {
      version: '1.0.0',
      binaryUrl: 'https://github.com/botskill-ai/botskill/releases/download/v1.0.0/botskill-server-1.0.0.zip',
      dockerImage: 'botskill/server:1.0.0',
      md5: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      releaseNotes: 'https://github.com/botskill-ai/botskill/releases/tag/v1.0.0',
      docsUrl: '/docs#getting-started'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-heading mb-4">
              {t('download.title', '下载 BotSkill')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('download.subtitle', '选择适合您环境的安装方式')}
            </p>
          </div>

            {/* 系统要求 */}
            <div className="bg-card rounded-lg border p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-semibold font-heading">
                  {t('download.systemRequirements', '系统要求')}
                </h2>
              </div>
              <p className="text-muted-foreground mb-4">
                {t('download.systemRequirementsNote', '以下是部署 BotSkill Server 的最小系统要求。如果您的环境无法满足系统最小要求，可能会导致无法部署和启动 BotSkill Server。')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Monitor className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">{t('download.requirements.nodejs', 'Node.js')}</div>
                    <div className="text-sm text-muted-foreground">{t('download.requirements.nodejsDesc', '16.x 及以上版本')}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Cpu className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">{t('download.requirements.cpu', 'CPU')}</div>
                    <div className="text-sm text-muted-foreground">{t('download.requirements.cpuDesc', '1核及以上，支持64位CPU')}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Server className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">{t('download.requirements.memory', '内存')}</div>
                    <div className="text-sm text-muted-foreground">{t('download.requirements.memoryDesc', '2GB及以上')}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <HardDrive className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">{t('download.requirements.storage', '硬盘')}</div>
                    <div className="text-sm text-muted-foreground">{t('download.requirements.storageDesc', '无最小要求，根据保留日志自行调整')}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Database className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">{t('download.requirements.mongodb', 'MongoDB')}</div>
                    <div className="text-sm text-muted-foreground">{t('download.requirements.mongodbDesc', '4.4 及以上版本')}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Monitor className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">{t('download.requirements.os', '操作系统')}</div>
                    <div className="text-sm text-muted-foreground">{t('download.requirements.osDesc', 'Linux, Mac OS X, Windows')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 稳定版本 */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold font-heading mb-6">
                {t('download.stableVersions', '稳定版本')}
              </h2>
              <div className="space-y-4">
                {stableVersions.map((version) => (
                  <div key={version.version} className="bg-card rounded-lg border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Package className="h-6 w-6 text-primary" />
                        <h3 className="text-xl font-semibold">v{version.version}</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full">
                          {t('download.stable', '稳定版')}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-medium mb-2">{t('download.binaryPackage', '二进制包下载')}</div>
                        <div className="flex items-center gap-2">
                          <a
                            href={version.binaryUrl}
                            className="text-primary hover:underline text-sm font-mono"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            botskill-server-{version.version}.zip
                          </a>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          MD5: {version.md5}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">{t('download.dockerImage', 'Docker 镜像')}</div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                            {version.dockerImage}
                          </code>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <a
                        href={version.binaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t('download.download', '下载')}
                      </a>
                      <a
                        href={version.releaseNotes}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      >
                        {t('download.releaseNotes', '发布说明')}
                      </a>
                      <a
                        href={version.docsUrl}
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                      >
                        {t('download.referenceDocs', '参考文档')}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 其他下载方式 */}
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-2xl font-semibold font-heading mb-4">
                {t('download.otherMethods', '其他下载方式')}
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">{t('download.gitClone', 'Git 克隆')}</div>
                    <code className="text-sm bg-background px-2 py-1 rounded font-mono">
                      git clone https://github.com/botskill-ai/botskill.git
                    </code>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">{t('download.npmInstall', 'NPM 安装')}</div>
                    <code className="text-sm bg-background px-2 py-1 rounded font-mono">
                      npm install -g @botskill/server
                    </code>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <div className="font-semibold mb-1">{t('download.dockerPull', 'Docker 拉取')}</div>
                    <code className="text-sm bg-background px-2 py-1 rounded font-mono">
                      docker pull botskill/server:latest
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* 提示信息 */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    {t('download.licenseNote', '许可证说明')}
                  </div>
                  <div className="text-blue-800 dark:text-blue-200">
                    {t('download.licenseText', '基于 Apache License v2.0 分发版本。更多历史版本下载，请参考发布历史。')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
};

export default DownloadPage;
