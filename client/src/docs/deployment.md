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

项目根目录提供 `Dockerfile`，可将前后端一体构建为单个镜像。

### 构建镜像

```bash
cd skills-project
docker build -t botskill:latest .
```

### 运行容器

```bash
docker run -d \
  --name botskill \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/botskill \
  -e JWT_SECRET=your-secret-key-at-least-32-chars \
  botskill:latest
```

- 端口 `3000`：应用入口（前端 + API 同源）
- `MONGODB_URI`：宿主机 MongoDB 可用 `host.docker.internal`（Mac/Windows）或宿主机 IP
- 生产环境建议使用外部 MongoDB（如 Atlas）

### Docker Compose 示例

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://mongo:27017/botskill
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mongo
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
volumes:
  mongo_data:
```

```bash
JWT_SECRET=your-secret docker-compose up -d
```

### 初始化数据（Docker 内）

```bash
docker exec -it botskill node scripts/create-admin.js
docker exec -it botskill node scripts/seed-permissions-roles.js
```

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
