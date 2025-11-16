# Supabase 到 MySQL 迁移说明

## 问题描述

登录时出现 "Failed to send a request to the Edge Function" 错误,这是因为系统已经从 Supabase 迁移到了 MySQL + Express 后端,但前端仍在尝试调用 Supabase Edge Function。

## 已完成的修复

### 1. 创建 API 客户端 (`src/lib/api.ts`)
- 实现了统一的 HTTP 请求客户端
- 支持 JWT token 管理
- 提供 GET、POST、PUT、DELETE 方法

### 2. 创建认证服务 (`src/lib/auth.ts`)
- `loginByName()` - 按姓名登录
- `logout()` - 登出
- `getCurrentUser()` - 获取当前用户
- `isAuthenticated()` - 检查登录状态
- `changePassword()` - 修改密码

### 3. 更新登录页面 (`src/pages/Auth.tsx`)
- 移除 Supabase 依赖
- 使用新的认证服务调用后端 API
- 保持原有的用户体验和功能

### 4. 更新环境变量 (`.env`)
- 添加 `VITE_API_BASE_URL` 配置后端 API 地址
- 默认值: `http://localhost:8080/api`

## 后端 API 端点

系统现在使用以下后端 API:

- `POST /api/auth/login-by-name` - 按姓名登录
- `POST /api/auth/logout` - 登出
- `POST /api/auth/change-password` - 修改密码
- `POST /api/auth/refresh` - 刷新 token

## 启动说明

### 1. 启动后端服务器

```bash
cd backend
npm install
npm run dev
```

后端将运行在 `http://localhost:8080`

### 2. 启动前端开发服务器

```bash
npm install
npm run dev
```

前端将运行在 `http://localhost:5173`

## 数据库配置

确保后端 `.env` 文件配置正确:

```env
DATABASE_URL="mysql://root:password@localhost:3306/stock_deck"
JWT_ACCESS_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
PORT=8080
```

## 测试登录

1. 确保后端服务器正在运行
2. 确保 MySQL 数据库已启动并包含用户数据
3. 访问 `http://localhost:5173`
4. 使用姓名和密码登录

## 注意事项

- Supabase 相关配置已废弃但保留用于兼容性
- 所有认证现在通过 JWT token 管理
- Token 存储在 localStorage 中
- 后端需要先运行才能登录成功
