# 凤韩食品库存盘点系统 - 后端 API

基于 OpenSEC 安全规范的 RESTful API 服务

## 技术栈

- **Node.js** + **TypeScript**
- **Express.js** - Web 框架
- **Prisma** - ORM
- **MySQL** - 数据库
- **JWT** - 身份认证
- **Zod** - 输入验证
- **bcrypt** - 密码加密
- **Jest** + **Supertest** - 测试框架
- **Swagger** - API 文档

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```env
# 数据库配置
DATABASE_URL="mysql://用户名:密码@localhost:3306/stock_deck"

# JWT 配置
JWT_ACCESS_SECRET="your-access-token-secret-key-change-this"
JWT_REFRESH_SECRET="your-refresh-token-secret-key-change-this"
JWT_ACCESS_EXPIRY="2h"
JWT_REFRESH_EXPIRY="7d"

# 服务器配置
PORT=8080
NODE_ENV="development"

# CORS 配置
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 推送数据库 schema
npm run prisma:push

# 或者运行迁移
npm run prisma:migrate

# (可选) 填充测试数据
npm run seed
```

### 4. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

服务器将在 `http://localhost:8080` 启动

## API 文档

### Swagger 文档

启动服务器后，访问 `http://localhost:8080/api-docs` 查看完整的交互式API文档。

### 详细文档

查看 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) 了解完整的API规范，包括：
- 请求/响应格式
- 认证方式
- 错误码说明
- 使用示例

## API 端点概览

### 认证模块

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/refresh` - 刷新令牌
- `POST /api/auth/change-password` - 修改密码

### 用户管理

- `GET /api/users` - 获取用户列表 (管理员)
- `GET /api/users/:id` - 获取用户详情
- `POST /api/users` - 创建用户 (管理员)
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户 (管理员)

### 盘点记录

- `GET /api/inventory/records` - 获取盘点记录列表
- `GET /api/inventory/records/:id` - 获取记录详情
- `POST /api/inventory/records` - 创建盘点记录
- `PUT /api/inventory/records/:id` - 更新记录
- `DELETE /api/inventory/records/:id` - 删除记录
- `POST /api/inventory/records/:id/submit` - 提交记录

### 报表统计

- `GET /api/reports/summary` - 获取汇总数据
- `GET /api/reports/export` - 导出数据 (Excel)
- `GET /api/reports/progress` - 盘点进度统计

## OpenSEC 安全特性

### 1. 认证安全

- JWT 双令牌机制 (Access Token + Refresh Token)
- 密码加密 (bcrypt)
- 密码策略验证 (8位+大小写+数字)
- 首次登录强制修改密码

### 2. 授权控制

- 基于角色的访问控制 (RBAC)
- 两个角色：`admin` (管理员) 和 `viewer` (查看者)
- 资源级权限检查

### 3. 输入验证

- Zod schema 验证
- XSS 防护
- SQL 注入防护 (Prisma 自动处理)

### 4. 审计日志

- 所有敏感操作记录
- 登录/登出跟踪
- 数据变更追踪

### 5. API 安全

- CORS 配置
- 安全响应头
- 错误处理

## 数据库 Schema

### 核心表

- **users** - 用户表
- **profiles** - 用户资料
- **user_roles** - 用户角色
- **inventory_items** - 库存物料
- **inventory_records** - 盘点记录
- **audit_logs** - 审计日志
- **password_history** - 密码历史

## 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm test -- --coverage

# 监听模式（开发时使用）
npm run test:watch

# 只运行集成测试
npm run test:integration
```

### 测试文档

查看 [TESTING_GUIDE.md](./TESTING_GUIDE.md) 了解：
- 测试环境配置
- 如何编写测试
- 测试最佳实践
- CI/CD集成

## 开发命令

```bash
# 开发模式 (热重载)
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 测试命令
npm test                  # 运行所有测试
npm run test:watch        # 监听模式
npm run test:integration  # 集成测试

# Prisma 命令
npm run prisma:generate  # 生成 Prisma Client
npm run prisma:migrate   # 运行迁移
npm run prisma:push      # 推送 schema
npm run prisma:studio    # 打开 Prisma Studio

# 填充测试数据
npm run seed
```

## 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   │   ├── database.ts  # 数据库配置
│   │   ├── jwt.ts       # JWT 配置
│   │   └── security.ts  # 安全策略
│   ├── middleware/      # 中间件
│   │   ├── auth.middleware.ts      # JWT 认证
│   │   ├── rbac.middleware.ts      # 权限控制
│   │   └── validator.middleware.ts # 输入验证
│   ├── controllers/     # 控制器
│   ├── services/        # 业务逻辑
│   │   └── auth.service.ts
│   ├── routes/          # 路由
│   ├── utils/           # 工具函数
│   │   ├── password.ts  # 密码加密
│   │   ├── jwt.ts       # JWT 工具
│   │   └── auditLog.ts  # 审计日志
│   ├── types/           # 类型定义
│   ├── app.ts           # Express 应用
│   └── index.ts         # 服务器入口
├── prisma/
│   ├── schema.prisma    # 数据模型
│   └── seed.ts          # 测试数据
├── .env                 # 环境变量 (需手动配置)
├── .env.example         # 环境变量示例
├── package.json
├── tsconfig.json
└── README.md
```

## 环境要求

- Node.js >= 18
- MySQL >= 8.0
- npm >= 9

## 注意事项

1. **首次使用前必须配置 `.env` 文件**
2. **JWT 密钥必须修改为强密码**
3. **生产环境请使用 HTTPS**
4. **定期备份数据库**
5. **查看审计日志监控异常行为**

## 故障排查

### 数据库连接失败

检查 `.env` 中的 `DATABASE_URL` 配置是否正确

### Prisma Client 未生成

运行 `npm run prisma:generate`

### 端口被占用

修改 `.env` 中的 `PORT` 配置

## 安全建议

1. 定期更新依赖包
2. 使用强密码策略
3. 启用 HTTPS
4. 配置防火墙
5. 定期审查审计日志
6. 备份数据库

## 支持

如有问题请联系技术团队
