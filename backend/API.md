# BotSkill API 文档

## 概述

BotSkill API 是一个 RESTful API，提供对AI技能管理平台的数据访问。API 基础路径为 `/api`。

## 认证

大多数 API 端点需要 JWT 认证。认证头格式如下：

```
Authorization: Bearer <jwt_token>
```

## API 端点

### 认证相关

#### POST /api/auth/register
注册新用户

**请求体:**
```json
{
  "username": "string (3-30 chars)",
  "email": "string (valid email)",
  "password": "string (min 8 chars)",
  "fullName": "string (optional, max 50 chars)"
}
```

**响应:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "email",
    "fullName": "full_name",
    "role": "user"
  }
}
```

#### POST /api/auth/login
用户登录

**请求体:**
```json
{
  "email": "string (valid email)",
  "password": "string"
}
```

**响应:**
```json
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "email",
    "fullName": "full_name",
    "role": "user",
    "avatar": "avatar_url"
  }
}
```

#### GET /api/auth/google
Google OAuth 登录 - 跳转到 Google 授权页，授权后回调并重定向到前端 `/login?token=xxx`

#### GET /api/auth/github
GitHub OAuth 登录 - 跳转到 GitHub 授权页，授权后回调并重定向到前端 `/login?token=xxx`

**环境变量（需在 .env 中配置）：**
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth 凭据
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth 凭据
- `FRONTEND_URL` - 前端地址，用于 OAuth 回调重定向（默认 http://localhost:5173）
- `BACKEND_URL` - 后端地址，用于 OAuth callback URL（默认 http://localhost:3001）

#### GET /api/auth/me
获取当前用户信息（需要认证）

**响应:**
```json
{
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "email",
    "fullName": "full_name",
    "avatar": "avatar_url",
    "bio": "bio",
    "role": "user",
    "isActive": true,
    "joinDate": "date",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### 用户相关

#### GET /api/users
获取所有用户（仅管理员）

**查询参数:**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）

**响应:**
```json
{
  "users": [...],
  "pagination": {...}
}
```

#### GET /api/users/:id
获取特定用户信息（需要认证）

**响应:**
```json
{
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "email",
    "fullName": "full_name",
    "avatar": "avatar_url",
    "bio": "bio",
    "role": "user",
    "isActive": true,
    "joinDate": "date",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

#### PUT /api/users/:id
更新用户信息（需要认证，只能更新自己的信息或管理员可以更新任何用户）

**请求体:**
```json
{
  "fullName": "string (optional)",
  "bio": "string (optional)",
  "avatar": "string (optional)"
}
```

### 技能相关

#### GET /api/skills
获取所有已发布的技能

**查询参数:**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认12）

**响应:**
```json
{
  "skills": [
    {
      "id": "skill_id",
      "name": "skill_name",
      "description": "skill_description",
      "version": "version",
      "author": {
        "id": "user_id",
        "username": "username",
        "fullName": "full_name",
        "avatar": "avatar_url"
      },
      "category": "category",
      "tags": ["tag1", "tag2"],
      "downloads": 0,
      "rating": {
        "average": 0,
        "count": 0
      },
      "license": "license",
      "repositoryUrl": "url",
      "documentationUrl": "url",
      "demoUrl": "url",
      "status": "published",
      "publishedAt": "date",
      "lastUpdated": "date",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ],
  "pagination": {...}
}
```

#### GET /api/skills/:id
获取特定技能

**响应:**
```json
{
  "skill": {...}
}
```

#### POST /api/skills
创建新技能（需要发布者或管理员权限）

**请求体:**
```json
{
  "name": "string (required, max 100 chars)",
  "description": "string (required, max 500 chars)",
  "version": "string (default '1.0.0')",
  "category": "string (required, enum: ai, data, web, devops, security, tools)",
  "tags": ["string"],
  "repositoryUrl": "string (optional)",
  "documentationUrl": "string (optional)",
  "demoUrl": "string (optional)",
  "license": "string (default 'MIT')"
}
```

#### PUT /api/skills/:id
更新技能（技能所有者或管理员可以更新）

**请求体:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "version": "string (optional)",
  "category": "string (optional)",
  "tags": ["string"] (optional),
  "repositoryUrl": "string (optional)",
  "documentationUrl": "string (optional)",
  "demoUrl": "string (optional)",
  "license": "string (optional)",
  "status": "string (only admin can change)"
}
```

#### DELETE /api/skills/:id
删除技能（技能所有者或管理员可以删除）

#### GET /api/skills/search
搜索技能

**查询参数:**
- `q`: 搜索词
- `category`: 分类过滤
- `tags`: 标签过滤（逗号分隔）
- `page`: 页码（默认1）
- `limit`: 每页数量（默认12）

#### GET /api/skills/popular
获取热门技能

**查询参数:**
- `limit`: 数量（默认6）

#### GET /api/skills/latest
获取最新技能

**查询参数:**
- `limit`: 数量（默认6）

### 管理员相关

#### GET /api/admin/dashboard
获取仪表板统计数据（需要管理员权限）

**响应:**
```json
{
  "stats": {
    "totalUsers": 0,
    "totalSkills": 0,
    "publishedSkills": 0,
    "pendingSkills": 0,
    "totalDownloads": 0
  }
}
```

#### GET /api/admin/users
获取所有用户（需要管理员权限）

#### GET /api/admin/skills
获取所有技能（需要管理员权限）

**查询参数:**
- `status`: 状态过滤（可选）

#### PUT /api/admin/skills/:id/status
更新技能状态（需要管理员权限）

**请求体:**
```json
{
  "status": "string (draft, published, archived, pending_review)"
}
```

#### PUT /api/admin/users/:id/role
更新用户角色（需要管理员权限）

**请求体:**
```json
{
  "role": "string (user, publisher, admin)"
}
```

#### GET /api/admin/settings
获取系统设置（需要管理员权限）

**响应:**
```json
{
  "success": true,
  "data": {
    "siteTitle": "string",
    "siteDescription": "string",
    "require2FA": false,
    "enableEmailVerification": false,
    "maxFileSize": 50,
    "allowedFileTypes": ".zip,.tar.gz,.js,.ts,.json",
    "maintenanceMode": false
  }
}
```

#### PUT /api/admin/settings
更新系统设置（需要管理员权限）

**请求体:**
```json
{
  "siteTitle": "string (optional)",
  "siteDescription": "string (optional)",
  "require2FA": "boolean (optional)",
  "enableEmailVerification": "boolean (optional)",
  "maxFileSize": "number (optional, MB)",
  "allowedFileTypes": "string (optional)",
  "maintenanceMode": "boolean (optional)"
}
```

## 错误响应

所有错误响应都采用以下格式：

```json
{
  "error": "error_message",
  "details": [...] // 可选，验证错误详情
}
```

## 状态码

- `200`: 成功
- `201`: 创建成功
- `400`: 请求错误（验证失败）
- `401`: 未认证
- `403`: 未授权
- `404`: 资源不存在
- `500`: 服务器内部错误