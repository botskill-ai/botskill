# BotSkill - 多阶段构建
# Stage 1: 构建前端
FROM node:20-alpine AS client-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
# 生产环境 API 使用同源 /api
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: 构建后端并整合
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
COPY --from=client-builder /app/client/dist ./public

# Stage 3: 运行镜像
FROM node:20-alpine

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# 从构建阶段复制文件
COPY --from=backend-builder /app/backend ./

# 创建必要的目录并设置权限
RUN mkdir -p uploads/images && \
    chown -R nodejs:nodejs /app

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "server.js"]
