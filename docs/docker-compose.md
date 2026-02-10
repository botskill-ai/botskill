# Docker Compose 部署文档

本文档说明如何使用项目内的 `docker-compose.yml` 一键启动 BotSkill 应用与 MongoDB，适用于本地体验或单机部署。

---

## 前置要求

- Docker 20.10+
- Docker Compose v2+（或 `docker compose` 插件）

---

## 快速启动

在项目根目录执行：

```bash
# 1. 设置必填环境变量（JWT 密钥）
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)" >> .env

# 2. 构建并启动
docker-compose up -d

# 3. 首次启动后初始化数据库
docker-compose exec app node scripts/init-all.js
```

启动完成后访问：**http://localhost:3000**（前端与 API 同源，API 路径为 `/api`）。

---

## 服务说明

`docker-compose.yml` 包含两个服务：

| 服务名 | 说明 | 端口 |
|--------|------|------|
| **app** | BotSkill 应用（Node.js，内含前端静态资源） | 3000 |
| **mongo** | MongoDB 7 | 27017 |

- **app** 依赖 **mongo**，启动时会等待 MongoDB 就绪。
- 应用通过 `MONGODB_URI=mongodb://mongo:27017/botskill` 连接容器内的 MongoDB。

---

## 环境变量

在项目根目录创建或编辑 `.env`，Compose 会自动注入到 **app** 服务。

### 必填

| 变量 | 说明 |
|------|------|
| `JWT_SECRET` | JWT 签名密钥，建议 32 字符以上，可用 `openssl rand -base64 32` 生成 |
| `JWT_REFRESH_SECRET` | 刷新令牌密钥 |

### 可选（有默认值）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `JWT_EXPIRES_IN` | `7d` | 访问令牌有效期 |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | 刷新令牌有效期 |
| `FRONTEND_URL` | `http://localhost:3000` | 前端地址（OAuth 回调用） |
| `BACKEND_URL` | `http://localhost:3000` | 后端地址（OAuth 回调） |

### 可选（OAuth）

| 变量 | 说明 |
|------|------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google 登录 |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub 登录 |

未设置时对应功能不可用，不影响基础运行。

---

## 常用命令

```bash
# 启动（后台）
docker-compose up -d

# 查看日志（应用）
docker-compose logs -f app

# 查看日志（MongoDB）
docker-compose logs -f mongo

# 停止
docker-compose down

# 停止并删除数据卷（会清空 MongoDB 数据，慎用）
docker-compose down -v

# 重启应用
docker-compose restart app

# 查看服务状态
docker-compose ps
```

---

## 数据持久化

- **MongoDB 数据**：使用命名 volume `mongo_data`，执行 `docker-compose down` 不会删除数据；只有 `docker-compose down -v` 才会删除。
- **应用上传文件**：默认保存在容器内 `/app/uploads`，容器重建后会丢失。若需持久化，在 `docker-compose.yml` 的 **app** 服务下增加：

```yaml
services:
  app:
    # ... 原有配置 ...
    volumes:
      - ./uploads:/app/uploads
```

然后重新启动：

```bash
docker-compose up -d
```

---

## 初始化与维护

### 首次初始化

必须执行一次，用于创建默认管理员、分类、权限与角色等：

```bash
docker-compose exec app node scripts/init-all.js
```

### 进入应用容器

```bash
docker-compose exec app sh
# 容器内工作目录为 /app，可执行 node scripts/xxx.js 等
```

### 进入 MongoDB

```bash
docker-compose exec mongo mongosh
# 或
docker-compose exec mongo mongosh mongodb://localhost:27017/botskill
```

---

## 健康检查

- **app** 与 **mongo** 均配置了健康检查。
- 应用健康检查地址：`GET http://localhost:3000/api/health`。

查看健康状态：

```bash
docker-compose ps
docker inspect --format='{{.State.Health.Status}}' $(docker-compose ps -q app)
```

---

## 生产使用建议

1. **务必修改默认密钥**：不要使用示例中的 `change-me-in-production`，`.env` 中设置强随机 `JWT_SECRET` 与 `JWT_REFRESH_SECRET`。
2. **上传目录持久化**：若允许用户上传文件，按上文为 **app** 挂载 `./uploads:/app/uploads`。
3. **反向代理与 HTTPS**：对外暴露时建议使用 Nginx/Caddy 等做反向代理并配置 HTTPS，Compose 仅暴露 3000 端口给内网或本机。
4. **资源限制**：可在 `docker-compose.yml` 中为 **app**、**mongo** 增加 `deploy.resources.limits`（CPU/内存）避免单机过载。

---

## 故障排查

- **应用启动失败**：先看日志 `docker-compose logs app`，常见原因包括 MongoDB 未就绪（可稍等几秒后重试）、`JWT_SECRET` 未设置。
- **无法访问 3000 端口**：确认防火墙或云安全组放行 3000；本机执行 `curl http://localhost:3000/api/health` 验证。
- **初始化脚本报错**：确认已执行 `docker-compose exec app node scripts/init-all.js`，且 MongoDB 已正常运行（`docker-compose ps` 中 mongo 为 healthy/up）。
