# 分支与 GitHub Release 管理

本文档说明本项目的 Git 分支策略以及如何创建和管理 GitHub Release。

---

## 一、分支策略（GitHub Flow）

采用简化的 **GitHub Flow**：长期保留 `main`，功能/修复在分支上开发，通过 PR 合并。

| 分支 | 用途 |
|------|------|
| **main** | 默认分支，始终可部署的稳定代码 |
| **develop**（可选） | 集成中的下一版，小团队可省略 |
| **feature/xxx** | 新功能，从 main 拉出，完成后 PR 回 main |
| **fix/xxx** 或 **bugfix/xxx** | 修复，从 main 拉出，完成后 PR 回 main |
| **release** / **release/v1.x.x** | 发布分支：推送到此分支会触发打包并创建 GitHub Release |

### 日常流程

1. **开发新功能**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/技能导出
   # 开发、提交
   git push -u origin feature/技能导出
   ```
   在 GitHub 上创建 Pull Request：`feature/技能导出` → `main`，合并后删除该分支。

2. **修 Bug**
   ```bash
   git checkout -b fix/登录跳转
   # 修复、提交
   git push -u origin fix/登录跳转
   ```
   PR 合并到 `main` 后删除分支。

3. **保持 main 干净**
   - 只通过 PR 合并，避免直接在 main 上提交。
   - 合并前确保 CI（若有）通过。

---

## 二、版本号规范（语义化版本）

采用 [Semantic Versioning](https://semver.org/)：`主版本.次版本.修订号`（如 `1.2.3`）。

- **主版本**：不兼容的 API 或大改动
- **次版本**：向后兼容的新功能
- **修订号**：向后兼容的 Bug 修复

版本号写在根目录 `package.json` 的 `version` 字段，发布前记得更新。

---

## 三、创建 GitHub Release

### 方式一：在 release 分支上触发自动发布（推荐）

项目已配置 GitHub Actions：**推送到 `release` 或 `release/*` 分支时，会读取根目录 `package.json` 的版本号，自动构建、打 tag 并创建 Release**。

步骤：

1. **在 main 上更新版本号并合并到 release**
   ```bash
   git checkout main
   git pull origin main
   npm run version:minor   # 或 version:patch / version:major，只改 package.json
   git add package.json
   git commit -m "chore: bump version to 1.1.0"
   git push origin main
   ```

2. **推送到 release 分支触发打包与发布**
   ```bash
   git checkout -b release
   git push -u origin release
   # 或从 main 合并： git checkout release && git merge main && git push
   ```

3. **自动执行**
   - 工作流会读取 `package.json` 的 `version`（如 `1.1.0`），构建前端并复制到 `backend/public/`，打包 backend 为 `botskill-server-1.1.0.zip`。
   - 若 tag `v1.1.0` 不存在则自动创建并推送，然后创建 GitHub Release 并上传该 zip。
   - 在仓库 **Releases** 页面可编辑该 Release 的说明（建议写 Changelog）。

### 方式二：在 GitHub 网页手动创建

1. 打开仓库 → **Releases** → **Draft a new release**。
2. **Choose a tag**：输入 `v1.0.0`，选择「Create new tag」，通常选当前 `main` 的 commit。
3. **Release title**：如 `v1.0.0`。
4. **Describe**：粘贴本版本的更新内容（Changelog）。
5. 若需附件：可上传构建好的 `client/dist` 压缩包或其它产物。
6. 勾选 **Set as the latest release**（若这是最新版），发布。

### 方式三：用 GitHub CLI

```bash
# 安装: brew install gh
gh auth login
gh release create v1.0.0 --title "v1.0.0" --notes "首次正式发布"
# 或从文件写说明
gh release create v1.0.0 --notes-file CHANGELOG.md
```

---

## 四、Release 包内容说明

当前自动化 Release（见 `.github/workflows/release.yml`）会：

1. 构建前端：`npm run build`（生成 `client/dist`）。
2. 将 `client/dist` 复制到 `backend/public/`（后端可直接托管前端静态资源）。
3. 将整个 backend 目录打包为 **`botskill-server-X.Y.Z.zip`** 并上传到 Release 附件。打包时已排除：
   - `node_modules`
   - `.env`、`.env.*`
   - `uploads/`（用户上传目录）
   - `*.log`、`.DS_Store`、`.git`、`coverage`、`.nyc_output`
4. **自动生成 Changelog**：根据「上一版 tag 到当前」的提交，用 [Conventional Commits](https://www.conventionalcommits.org/) 规范生成 Release 说明，并作为该次 Release 的正文。若没有符合规范的提交，则使用简短占位说明。

用户下载 zip 后解压，在目录内执行 `npm install --production` 和 `npm start`（或按你提供的启动方式）即可运行服务。

---

## 五、自动 Changelog 与 Conventional Commits

发版时 Release 的说明会**自动根据提交历史生成**，前提是 commit message 遵循 **Conventional Commits** 格式。

### 推荐写法

- `feat: 新功能描述` → 归入 **Features**
- `fix: 修复描述` → 归入 **Bug Fixes**
- `docs: 文档变更`
- `style: 代码风格、格式（不影响逻辑）`
- `refactor: 重构`
- `perf: 性能优化`
- `chore: 构建/工具/依赖等`

示例：

```text
feat: 支持技能导出为 Markdown
fix: 登录后跳转错误
docs: 更新部署说明
```

### 本地更新 CHANGELOG.md

若希望仓库里的 `CHANGELOG.md` 也随版本更新，可在发版前在项目根目录执行：

```bash
npm run changelog
```

会将「自上次 tag 以来的变更」按规范追加到 `CHANGELOG.md`，然后可一并提交到 release 分支。

---

## 六、常用命令速查

```bash
# 查看当前版本（直接看 package.json 的 version）

# 仅更新 package.json 版本
npm run version:patch   # 1.0.0 -> 1.0.1
npm run version:minor   # 1.0.0 -> 1.1.0
npm run version:major   # 1.0.0 -> 2.0.0

# 在 release 分支上发布（先改好 version 并合并到 release，再推送）
git checkout release
git merge main
git push origin release
# 推送后 Actions 会自动打包并创建 tag + Release

# 列出所有 tag
git tag -l

# 删除本地/远程 tag（慎用，通常不删已发布的 tag）
git tag -d v1.2.0
git push origin --delete v1.2.0
```

---

按上述流程即可完成分支管理和 GitHub Release 的创建与维护；日常以 **main + 功能/修复分支 + PR** 为主，发版时用 **tag + 自动或手动 Release** 即可。
