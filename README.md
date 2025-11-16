# 凤韩食品 - 库存盘点系统

## 项目简介

这是一个为凤韩食品开发的库存盘点管理系统，用于帮助企业高效地进行库存盘点、记录、审核和汇总工作。

## 项目功能

- **用户认证**：支持管理员和普通用户登录
- **库存盘点**：记录商品的实际库存数量
- **盘点审核**：管理员可以审核盘点记录
- **数据汇总**：自动生成盘点汇总报表
- **数据导出**：支持导出Excel格式的盘点数据

## 技术栈

本项目使用以下技术构建：

- **Vite** - 快速的前端构建工具
- **TypeScript** - 类型安全的JavaScript超集
- **React** - 用户界面框架
- **shadcn-ui** - 现代化UI组件库
- **Tailwind CSS** - 实用优先的CSS框架
- **MySQL** - 后端数据库

## 快速开始

### 前置要求

确保您的电脑已安装：
- Node.js（推荐使用 [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) 安装）
- npm（Node.js自带）

### 安装步骤

```sh
# 1. 进入项目目录（如果还没有在项目目录中）
cd stock-deck-main

# 2. 安装项目依赖（首次运行必须执行）
npm install

# 3. 启动开发服务器
npm run dev
```

### 可用命令

```sh
# 启动开发服务器（带热更新）
npm run dev

# 构建生产版本
npm run build

# 构建开发版本
npm run build:dev

# 代码检查
npm run lint

# 预览生产构建
npm run preview
```

## 常见问题

### ❌ 问题：运行 `npm run dev` 时出现 "command not found" 错误

**原因**：项目依赖还没有安装

**解决方案**：
```sh
npm install
```

### ❌ 问题：端口被占用

**解决方案**：
1. 关闭占用端口的程序
2. 或者在启动时指定其他端口：
```sh
npm run dev -- --port 3001
```


## 项目结构

```
stock-deck-main/
├── src/
│   ├── components/     # UI组件
│   │   └── ui/        # shadcn-ui组件
│   ├── pages/         # 页面组件
│   │   ├── Auth.tsx   # 登录页
│   │   ├── Console.tsx # 控制台
│   │   ├── Record.tsx # 盘点记录
│   │   ├── Review.tsx # 审核页面
│   │   └── Summary.tsx # 数据汇总
│   ├── data/          # 数据文件
│   ├── hooks/         # 自定义Hooks
│   ├── lib/           # 工具函数
│   └── integrations/  # 第三方集成
└── public/            # 静态资源
```

## 开发建议

### 代码规范
- 使用 TypeScript 编写代码，确保类型安全
- 遵循 ESLint 规则，保持代码一致性
- 组件使用函数式编程，优先使用 Hooks

### 提交规范
- 提交前运行 `npm run lint` 检查代码
- 使用清晰的提交信息描述更改内容

## 部署

项目可以通过 Lovable 平台一键部署：

1. 访问 [Lovable 项目](https://lovable.dev/projects/13fb73ae-814a-406f-8aa7-885b95617547)
2. 点击 Share -> Publish

## 安全特性

本系统实施了全面的安全措施，包括：

### 🔐 认证与授权
- **路由保护**：所有敏感页面都有权限验证，未授权用户无法访问
- **角色管理**：区分管理员和普通用户权限
- **强制密码修改**：首次登录强制修改默认密码
- **密码复杂度**：要求至少8位，包含大小写字母和数字
- **管理员创建保护**：初始管理员创建需要密钥验证

### 🛡️ 数据安全
- **输入清理**：所有用户输入都经过XSS和SQL注入防护
- **数据持久化**：盘点数据安全存储在数据库中，支持断点续传
- **Row Level Security (RLS)**：数据库层面的权限控制
- **环境变量验证**：启动时验证必需的配置项

### 📝 审计与监控
- **审计日志**：记录所有关键操作（登录、创建用户、数据上传等）
- **会话管理**：30分钟空闲自动登出
- **错误处理**：统一错误处理，防止敏感信息泄露
- **CORS保护**：严格的跨域请求控制

### 🔒 数据库安全
- **RLS策略**：用户只能访问自己的数据
- **外键约束**：保证数据完整性
- **字段验证**：数据库层面的类型和约束检查
- **索引优化**：提高查询性能同时保证安全

## 更新日志

### 2025-11-15 - 安全加固版本
- ✅ 修复InitAdmin页面安全漏洞，添加密钥验证
- ✅ 实现盘点数据数据库持久化
- ✅ 添加路由权限保护（ProtectedRoute & AdminRoute）
- ✅ 实现强制首次登录修改密码
- ✅ 添加密码复杂度验证（至少8位，大小写+数字）
- ✅ 实现环境变量验证和配置示例
- ✅ 添加用户输入清理和XSS防护
- ✅ 强化云函数CORS配置
- ✅ 实现完整的审计日志系统
- ✅ 添加会话超时和空闲检测
- ✅ 统一错误处理，防止信息泄露

### 2025-11-15 - 初始版本
- ✅ 修复依赖安装问题
- ✅ 添加中文README文档
- ✅ 完善项目结构说明
- ✅ 添加常见问题解决方案

---

## English Documentation

### Project Info

**URL**: https://lovable.dev/projects/13fb73ae-814a-406f-8aa7-885b95617547

### Quick Start

```sh
npm install
npm run dev
```

For detailed English documentation, please refer to the Quick Start section above.
