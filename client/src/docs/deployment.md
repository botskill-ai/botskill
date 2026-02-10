# 部署指南

## 环境要求

- Node.js 18+
- MongoDB 4.4+（本地或 Atlas）
- 内存建议 1GB+
- Docker 20+（可选，用于容器化部署）

## 本地开发

```bash
# 克隆并安装
git clone https://github.com/botskill-ai/botskill && cd botskill
npm run install:all

# 配置 backend/.env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/botskill
JWT_SECRET=your-secret-key-at-least-32-chars

# 启动（前后端并行）
npm run dev
```

前端默认 `http://localhost:3000`，后端 `http://localhost:3001`

---

## Docker 部署（推荐）

项目提供多阶段 `Dockerfile`，将前端构建与后端合并为单一镜像，端口 3000 同时提供前端与 `/api` 接口。

### 方式一：Docker Compose（推荐）

应用 + MongoDB 一起启动，适合本地或单机。

```bash
# 项目根目录
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)" >> .env
docker-compose up -d
```

首次启动后初始化数据库（管理员、分类、权限等）：

```bash
docker-compose exec app node scripts/init-all.js
```

### 方式二：使用 Docker Hub 镜像

前提：本机已安装并启动 MongoDB。若已发布到 Docker Hub，可直接拉取运行：

```bash
# 将 <DOCKERHUB_USER> 替换为实际用户名/组织名
docker pull <DOCKERHUB_USER>/botskill-server:latest

docker run -d \
  --name botskill \
  -p 3000:3000 \
  -e MONGODB_URI=你的MongoDB连接地址 \
  -e JWT_SECRET=your-secret-at-least-32-chars \
  -e JWT_REFRESH_SECRET=your-refresh-secret \
  <DOCKERHUB_USER>/botskill-server:latest
```

初始化：

```bash
docker exec -it botskill node scripts/init-all.js
```

### 方式三：本地构建镜像

```bash
docker build -t botskill-server:latest .
docker run -d --name botskill -p 3000:3000 \
  -e MONGODB_URI=你的MongoDB连接地址 \
  -e JWT_SECRET=your-secret \
  -e JWT_REFRESH_SECRET=your-refresh-secret \
  botskill-server:latest
```

### Docker 环境变量要点

| 变量 | 必填 | 说明 |
|------|------|------|
| MONGODB_URI | 是 | MongoDB 连接地址（用户提供的 URL） |
| JWT_SECRET | 是 | JWT 密钥，建议 32 字符以上 |
| JWT_REFRESH_SECRET | 是 | 刷新令牌密钥 |
| FRONTEND_URL / BACKEND_URL | 否 | OAuth 回调地址，Docker 同源时可省略 |
| GOOGLE_* / GITHUB_* | 否 | OAuth 客户端 ID/Secret |

### 上传目录持久化

默认上传文件在容器内，重启会丢失。需持久化时挂载 volume：

```bash
docker run -d ... -v $(pwd)/uploads:/app/uploads ...
```

或在 `docker-compose.yml` 的 `app` 服务下增加 `volumes: - ./uploads:/app/uploads`。

### 端口与健康检查

- 应用端口：**3000**（前端与 API 同源，API 前缀 `/api`）
- 健康检查：`GET http://localhost:3000/api/health`，镜像内已配置 `HEALTHCHECK`

---

## 传统部署（PM2 + Nginx）

### 1. 构建前端

```bash
npm run build
```

产物在 `client/dist`，可部署到 Nginx、Vercel 等静态托管。

### 2. 后端（PM2）

```bash
cd backend
npm install --production
# 配置 .env (NODE_ENV=production, MONGODB_URI, JWT_SECRET)
pm2 start server.js --name skills-backend
pm2 startup && pm2 save
```

### 3. Nginx 反向代理

```nginx
# API 代理
location /api {
  proxy_pass http://127.0.0.1:3001;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}

# 前端 SPA
location / {
  root /path/to/client/dist;
  try_files $uri $uri/ /index.html;
}
```

### 4. HTTPS 配置

使用 Let's Encrypt 免费证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d botskill.ai
```

### 5. 初始化数据

```bash
cd backend
npm run create-admin    # 创建管理员账户
npm run seed-permissions # 初始化权限与角色
```

---

## 环境变量

| 变量 | 说明 |
|------|------|
| NODE_ENV | development / production |
| PORT | 应用端口，默认 3000 |
| MONGODB_URI | MongoDB 连接字符串 |
| JWT_SECRET | JWT 密钥，务必使用强随机串（`openssl rand -base64 32`） |
| FRONTEND_URL | 前端地址（OAuth 回调用，Docker 部署时通常同源可省略） |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | Google OAuth（可选） |
| GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET | GitHub OAuth（可选） |
