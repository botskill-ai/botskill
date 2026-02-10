# 发布技能

## 发布方式

BotSkill 支持两种发布方式：

- **Web 端**：登录后进入个人资料 → 我的技能 → 发布技能，可上传文件或从 URL 导入
- **CLI**：使用 `skm push` 或 `skm publish` 从本地发布

## 技能格式（SKILL.md）

技能使用 SKILL.md 文件定义元数据，采用 YAML frontmatter + Markdown 文档：

```yaml
---
name: my-skill
description: 技能简短描述
category: ai
tags: [nlp, translation]
license: MIT
metadata:
  version: 1.0.0
  author: your-username
---

# 技能文档

详细使用说明、示例代码等...
```

支持格式：`.zip`、`.tar.gz` 压缩包（需包含 SKILL.md），或单独的 `SKILL.md` 文件。

## CLI 发布流程

1. 初始化项目：`skm init --name my-skill --description "描述"`
2. 编辑 `skill.config.json` 或创建 `SKILL.md`
3. 登录：`skm login`
4. 发布：`skm push` 或 `skm publish`

## 项目结构示例

```
my-skill/
├── SKILL.md           # 技能元数据与文档（必需）
├── skill.config.json  # CLI 配置（skm init 生成）
├── index.js           # 主入口（可选）
├── package.json       # 依赖（可选）
└── examples/         # 示例（可选）
```

## 分类与版本

- **分类**：ai, data, web, devops, security, tools
- **版本**：使用语义化版本 X.Y.Z
- 发布者需拥有 **publisher** 或 **admin** 角色
