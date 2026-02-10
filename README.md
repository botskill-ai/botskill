# BotSkill - 全栈AI技能管理平台

一个用于管理和分享AI代理技能的全栈应用程序，前端使用React + TypeScript，后端使用Node.js/Express/MongoDB。支持技能发布、博客管理、用户认证、OAuth登录等功能。

## 📋 目录

- [功能特性](#功能特性)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [API文档](#api文档)
- [部署指南](#部署指南)
- [开发指南](#开发指南)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## ✨ 功能特性

### 前端功能

- 🎨 **现代化UI设计**
  - 响应式布局，支持桌面和移动端
  - 明暗主题切换
  - 基于Tailwind CSS和Radix UI组件库
  - 流畅的动画和交互体验

- 🌍 **国际化支持**
  - 支持多语言（中文、英文、日文、韩文、德文、法文、俄文、阿拉伯文等）
  - 基于i18next实现
  - 自动语言检测

- 🔐 **用户认证**
  - 用户注册和登录
  - JWT令牌认证
  - OAuth第三方登录（Google、GitHub）
  - 密码加密存储
  - 个人资料管理

- 📚 **技能管理**
  - 技能浏览、搜索和筛选
  - 技能详情展示
  - 技能发布和编辑
  - 分类和标签管理
  - 下载统计和评分系统

- 📝 **博客系统**
  - 博客文章发布和管理
  - Markdown/HTML/富文本编辑器支持
  - 文章分类和标签
  - SEO优化支持
  - 特色文章标记

- 👤 **用户中心**
  - 个人资料编辑
  - 我的技能管理
  - 收藏夹功能
  - 数据统计

- 🛠️ **管理员后台**
  - 用户管理
  - 技能审核和管理
  - 博客管理
  - 系统设置
  - 数据统计仪表板
  - 权限和角色管理

### 后端功能

- 🔒 **安全特性**
  - JWT身份验证和授权
  - 密码加密（bcrypt）
  - Helmet安全头设置
  - CORS跨域支持
  - 请求验证和错误处理

- 👥 **用户管理**
  - 用户CRUD操作
  - 角色权限控制（用户、发布者、管理员）
  - OAuth集成（Google、GitHub）
  - 刷新令牌机制

- 📦 **技能管理**
  - 技能CRUD操作
  - 技能状态管理（草稿、已发布、待审核、已归档）
  - 技能搜索和筛选
  - 文件上传和处理
  - Markdown解析和提取

- 📄 **博客管理**
  - 博客CRUD操作
  - 多种内容格式支持
  - 文章状态管理
  - 浏览量统计
  - SEO字段支持

- ⚙️ **系统管理**
  - 系统设置管理
  - 分类管理
  - 权限和角色管理
  - 数据统计API

## 📁 项目结构

```
botskill/
├── client/                 # React前端应用
│   ├── public/            # 静态资源
│   ├── src/
│   │   ├── components/    # 可复用UI组件
│   │   ├── pages/         # 页面组件
│   │   ├── contexts/      # React上下文（认证、主题、站点设置）
│   │   ├── hooks/         # 自定义Hook
│   │   ├── lib/           # API客户端和工具函数
│   │   ├── locales/       # 国际化资源文件
│   │   ├── styles/        # 全局样式
│   │   └── types/         # TypeScript类型定义
│   ├── package.json
│   ├── vite.config.ts     # Vite配置
│   ├── tailwind.config.ts # Tailwind配置
│   └── tsconfig.json      # TypeScript配置
│
├── backend/               # Node.js/Express后端API
│   ├── models/           # Mongoose数据模型
│   ├── controllers/      # 控制器逻辑
│   ├── routes/           # API路由
│   ├── middleware/       # Express中间件
│   ├── services/         # 业务服务（如有）
│   ├── utils/            # 工具函数
│   ├── config/           # 配置文件（Passport等）
│   ├── scripts/          # 数据库脚本
│   ├── uploads/          # 上传文件目录
│   ├── server.js         # 主服务器文件
│   └── package.json
│
├── docker-compose.yml     # Docker Compose配置
├── Dockerfile            # Docker构建文件
├── nginx.conf            # Nginx配置示例
├── .npmrc                # NPM配置
├── package.json          # 根目录包配置
└── README.md
```

## 🛠️ 技术栈

### 前端

- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **UI组件**: Radix UI
- **路由**: React Router v6
- **国际化**: i18next + react-i18next
- **HTTP客户端**: Axios
- **富文本编辑器**: TipTap
- **Markdown**: react-markdown + marked
- **状态管理**: React Context API
- **图标**: Lucide React

### 后端

- **运行时**: Node.js 20+
- **框架**: Express.js
- **数据库**: MongoDB + Mongoose
- **认证**: JSON Web Tokens (JWT)
- **密码加密**: bcryptjs
- **OAuth**: Passport.js (Google、GitHub)
- **文件上传**: Multer
- **验证**: Joi
- **安全**: Helmet
- **Markdown处理**: gray-matter

### 开发工具

- **包管理**: npm
- **代码质量**: ESLint
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx（生产环境）

## 🚀 快速开始

### 环境要求

- Node.js 20+
- MongoDB 7+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/botskill-ai/botskill.git
cd botskill
```

2. **安装依赖**
```bash
# 安装所有依赖（根目录、前端、后端）
npm run install:all
```

3. **配置环境变量**

在 `backend` 目录创建 `.env` 文件：

```env
# 服务器配置
NODE_ENV=development
PORT=3000

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/botskill

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# OAuth配置（可选）
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# 前端URL（用于OAuth回调）
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

# 文件上传配置
MAX_FILE_SIZE=52428800  # 50MB
UPLOAD_DIR=./uploads
```

4. **启动MongoDB**

确保MongoDB服务正在运行：
```bash
# 使用Docker启动MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7

# 或使用本地安装的MongoDB
mongod
```

5. **初始化数据库**

运行初始化脚本（一键初始化权限、角色、分类、管理员账户和系统设置）：
```bash
cd backend
npm run init
```


6. **启动开发服务器**

```bash
# 在项目根目录，并行启动前端和后端
npm run dev

# 或分别启动
npm run dev:client  # 前端：http://localhost:3000
npm run dev:server  # 后端：http://localhost:3001
```

7. **访问应用**

- 前端: http://localhost:3000
- 后端API: http://localhost:3001/api
- API健康检查: http://localhost:3001/api/health

### 使用 Docker 快速启动

**前提**：已安装并启动 MongoDB。使用 Docker Hub 已发布的 server 镜像启动应用：

```bash
docker run -d --name botskill-app -p 3000:3000 \
  -e MONGODB_URI=你的MongoDB连接地址 \
  -e JWT_SECRET=你的JWT密钥 \
  -e JWT_REFRESH_SECRET=你的刷新令牌密钥 \
  botskill-ai/botskill-server:latest

# 首次启动需初始化数据库（管理员、分类、权限等）
docker exec -it botskill-app node scripts/init-all.js
```

启动后访问 http://localhost:3000。使用 Compose 一键启动应用+数据库见 [Docker Compose 文档](docs/docker-compose.md)。

**环境变量**

| 变量 | 必填 | 说明 |
|------|:----:|------|
| `MONGODB_URI` | 是 | MongoDB 连接地址（用户提供的 URL） |
| `JWT_SECRET` | 是 | JWT 签名密钥，建议 32 位以上随机串 |
| `JWT_REFRESH_SECRET` | 是 | 刷新令牌签名密钥 |
| `JWT_EXPIRES_IN` | 否 | 访问令牌有效期，默认 `7d` |
| `JWT_REFRESH_EXPIRES_IN` | 否 | 刷新令牌有效期，默认 `30d` |
| `FRONTEND_URL` | 否 | 前端地址，用于 OAuth 回调，默认 `http://localhost:3000` |
| `BACKEND_URL` | 否 | 后端地址，用于 OAuth 回调，默认同 `FRONTEND_URL` |
| `GOOGLE_CLIENT_ID` | 否 | Google OAuth 客户端 ID |
| `GOOGLE_CLIENT_SECRET` | 否 | Google OAuth 客户端密钥 |
| `GITHUB_CLIENT_ID` | 否 | GitHub OAuth 客户端 ID |
| `GITHUB_CLIENT_SECRET` | 否 | GitHub OAuth 客户端密钥 |

## ⚙️ 环境配置

### 开发环境

开发环境使用以下配置：
- 前端开发服务器：Vite Dev Server (端口 3000)
- 后端开发服务器：Express + Nodemon (端口 3001)
- 数据库：本地MongoDB (端口 27017)
- 热重载：前后端均支持

### 生产环境

生产环境配置：
- 前端构建：`npm run build:client`
- 后端服务：`npm start`
- 静态文件：由Express托管（client/dist复制到backend/public）
- 环境变量：通过`.env`文件配置

## 📚 API文档

详细的API文档请参考 [backend/API.md](./backend/API.md)

### 主要API端点

#### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/google` - Google OAuth登录
- `GET /api/auth/github` - GitHub OAuth登录
- `GET /api/auth/me` - 获取当前用户信息

#### 用户相关
- `GET /api/users` - 获取所有用户（管理员）
- `GET /api/users/:id` - 获取特定用户信息
- `PUT /api/users/:id` - 更新用户信息
- `DELETE /api/users/:id` - 删除用户（管理员）

#### 技能相关
- `GET /api/skills` - 获取所有已发布技能
- `GET /api/skills/:id` - 获取特定技能
- `POST /api/skills` - 创建新技能
- `PUT /api/skills/:id` - 更新技能
- `DELETE /api/skills/:id` - 删除技能
- `GET /api/skills/search` - 搜索技能
- `GET /api/skills/popular` - 获取热门技能
- `GET /api/skills/latest` - 获取最新技能

#### 博客相关
- `GET /api/blogs` - 获取所有已发布博客
- `GET /api/blogs/slug/:slug` - 根据slug获取博客
- `GET /api/blogs/:id` - 获取特定博客
- `POST /api/blogs` - 创建新博客
- `PUT /api/blogs/:id` - 更新博客
- `DELETE /api/blogs/:id` - 删除博客

#### 管理员相关
- `GET /api/admin/dashboard` - 获取仪表板统计数据
- `GET /api/admin/users` - 获取所有用户
- `GET /api/admin/skills` - 获取所有技能
- `PUT /api/admin/skills/:id/status` - 更新技能状态
- `PUT /api/admin/users/:id/role` - 管理用户角色
- `GET /api/admin/settings` - 获取系统设置
- `PUT /api/admin/settings` - 更新系统设置

## 🐳 部署指南

### 使用 Docker 部署

#### 方式一：Docker Compose

使用 Compose 一键启动应用与 MongoDB，适合本地或单机部署。**完整说明（环境变量、持久化、健康检查、故障排查等）请阅 [Docker Compose 文档](docs/docker-compose.md)。**

#### 方式二：使用已发布的 Docker 镜像

若项目已发布到 Docker Hub，可直接拉取运行（需自行准备 MongoDB）：

```bash
# 替换 <DOCKERHUB_USER> 为实际用户名或组织名，例如 botskill-ai
docker pull <DOCKERHUB_USER>/botskill-server:latest

docker run -d \
  --name botskill-app \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/botskill \
  -e JWT_SECRET=your-super-secret-key-at-least-32-chars \
  -e JWT_REFRESH_SECRET=your-refresh-secret \
  <DOCKERHUB_USER>/botskill-server:latest
```

- **Mac/Windows**：宿主机 MongoDB 可用 `mongodb://host.docker.internal:27017/botskill`
- **Linux**：需先启动 MongoDB，并将 `host.docker.internal` 改为宿主机 IP 或使用 `--network host` 等

#### 方式三：本地构建镜像后运行

```bash
# 在项目根目录构建
docker build -t botskill-server:latest .

# 运行（需先有 MongoDB）
docker run -d \
  --name botskill-app \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/botskill \
  -e JWT_SECRET=your-super-secret-key \
  -e JWT_REFRESH_SECRET=your-refresh-secret \
  botskill-server:latest
```

**初始化数据库**（方式二、三）：

```bash
docker exec -it botskill-app node scripts/init-all.js
```

#### Docker 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `MONGODB_URI` | 是 | MongoDB 连接串，如 `mongodb://mongo:27017/botskill`（Compose 内）或 `mongodb://host.docker.internal:27017/botskill`（宿主机） |
| `JWT_SECRET` | 是 | JWT 签名密钥，建议 `openssl rand -base64 32` 生成 |
| `JWT_REFRESH_SECRET` | 是 | 刷新令牌密钥 |
| `JWT_EXPIRES_IN` | 否 | 访问令牌有效期，默认 `7d` |
| `JWT_REFRESH_EXPIRES_IN` | 否 | 刷新令牌有效期，默认 `30d` |
| `FRONTEND_URL` | 否 | 前端地址（OAuth 回调用），默认 `http://localhost:3000` |
| `BACKEND_URL` | 否 | 后端地址（OAuth 回调），默认同 `FRONTEND_URL` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | 否 | Google OAuth |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | 否 | GitHub OAuth |

使用 Docker Compose 时，在项目根目录创建 `.env` 写入上述变量，Compose 会自动注入。

#### 数据与持久化

- **MongoDB**：Compose 中使用 volume `mongo_data`，数据持久化。
- **上传文件**：默认在容器内 `/app/uploads`，重启会丢失。需持久化时在 `docker-compose.yml` 的 `app` 下增加：

```yaml
volumes:
  - ./uploads:/app/uploads
```

或单独运行容器时：

```bash
docker run -d ... -v $(pwd)/uploads:/app/uploads ...
```

#### 端口与访问

- 应用端口：**3000**（前端 + API 同源，API 路径为 `/api`）
- 启动后访问：http://localhost:3000  
- 健康检查：http://localhost:3000/api/health

#### 健康检查

镜像内已配置 `HEALTHCHECK`，Compose 中也有对应配置。查看状态：

```bash
docker-compose ps
docker inspect --format='{{.State.Health.Status}}' <container-name>
```

### 使用Nginx反向代理

1. **构建前端**

```bash
npm run build:client
```

2. **配置Nginx**

参考项目根目录的 `nginx.conf` 文件，配置Nginx反向代理。

3. **启动服务**

```bash
# 启动后端服务
cd backend
npm start

# 配置Nginx并重启
sudo nginx -t
sudo systemctl restart nginx
```

### 生产环境最佳实践

- 使用HTTPS（Let's Encrypt证书）
- 配置环境变量（不要提交`.env`文件）
- 设置强密码的JWT密钥
- 启用MongoDB认证
- 配置防火墙规则
- 设置日志轮转
- 配置监控和告警
- 定期备份数据库

## 💻 开发指南

### 代码结构

- **前端组件**: 使用函数式组件和Hooks
- **API调用**: 统一通过 `client/src/lib/api.ts` 进行
- **类型定义**: 使用TypeScript，类型定义在 `client/src/types/`
- **样式**: 使用Tailwind CSS，组件样式内联
- **状态管理**: 使用React Context API

### 开发脚本

```bash
# 安装所有依赖
npm run install:all

# 开发模式（并行启动前后端）
npm run dev

# 仅启动前端
npm run dev:client

# 仅启动后端
npm run dev:server

# 构建前端
npm run build:client

# 预览生产构建
npm start

# 后端脚本
cd backend
npm run init              # 一键初始化（权限、角色、分类、管理员、设置）
```

### 代码规范

- 使用ESLint进行代码检查
- 遵循TypeScript严格模式
- 组件使用PascalCase命名
- 函数和变量使用camelCase命名
- 常量使用UPPER_SNAKE_CASE命名

### 提交规范

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具链相关

## 🤝 贡献指南

我们欢迎所有形式的贡献！

1. **Fork项目**
2. **创建功能分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建Pull Request**

### 贡献指南

- 确保代码通过ESLint检查
- 添加必要的测试
- 更新相关文档
- 遵循项目的代码风格

## 📄 许可证

MIT License

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交Issue
- 发送Pull Request
- 联系项目维护者

---

**注意**: 在生产环境部署前，请务必：
1. 更改所有默认密码和密钥
2. 配置正确的环境变量
3. 启用HTTPS
4. 设置数据库备份
5. 配置监控和日志系统
