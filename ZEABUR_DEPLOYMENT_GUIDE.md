# Zeabur 部署环境梳理指南

## 项目概述

**项目名称**: 凤韩食品库存盘点系统  
**项目类型**: 全栈应用（React + Express + MySQL）  
**部署平台**: Zeabur  
**生成日期**: 2025-11-16

---

## 一、项目架构

### 1.1 技术栈

#### 前端
- **框架**: React 18.3.1
- **构建工具**: Vite 5.4.19
- **语言**: TypeScript 5.8.3
- **样式**: Tailwind CSS 3.4.17
- **UI库**: shadcn-ui (基于Radix UI)
- **路由**: React Router 6.30.1
- **状态管理**: React Query 5.83.0
- **表单**: React Hook Form 7.61.1
- **图表**: Recharts 2.15.4
- **导出**: XLSX 0.18.5

#### 后端
- **框架**: Express 4.21.1
- **语言**: TypeScript 5.8.3
- **ORM**: Prisma 5.22.0
- **数据库**: MySQL 8.0+
- **认证**: JWT (jsonwebtoken 9.0.2)
- **加密**: bcryptjs 2.4.3
- **文件上传**: Multer 1.4.5
- **API文档**: Swagger UI 5.0.1
- **测试**: Jest 30.2.0, Supertest 7.1.4

#### 数据库
- **类型**: MySQL 8.0+
- **托管**: Aliyun RDS (阿里云)
- **当前连接**: `mysql://chengguanjie:98321083Zab@rm-bp1u6fu1bnq01p3g7so.mysql.rds.aliyuncs.com:3306/fenghan_stock`

---

## 二、部署配置

### 2.1 前端配置

#### 构建配置
```
构建工具: Vite
输出目录: dist/
构建命令: npm run build
开发端口: 5173
生产环境: 需要配置API_BASE_URL
```

#### 环境变量
```
VITE_API_BASE_URL=<后端API地址>
```

#### Vite配置特点
- 使用SWC编译器加快构建速度
- 支持热模块更新(HMR)
- 路径别名: @/ 指向 src/

### 2.2 后端配置

#### 服务器配置
```
端口: 8080 (可通过PORT环境变量修改)
Node环境: development/production
启动命令: npm run start
开发命令: npm run dev
```

#### 必需的环境变量
```
# 数据库连接
DATABASE_URL="mysql://username:password@host:port/database_name"

# JWT配置
JWT_ACCESS_SECRET="your-access-token-secret-key-min-32-chars"
JWT_ACCESS_EXPIRY="2h"
JWT_REFRESH_SECRET="your-refresh-token-secret-key-min-32-chars"
JWT_REFRESH_EXPIRY="7d"

# 服务器
PORT=8080
NODE_ENV="production"

# 管理员初始化
ADMIN_INIT_KEY="your-secret-key-here"

# CORS配置
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

#### 后端特点
- Express.js服务器
- RESTful API设计
- Swagger API文档: `/api/docs`
- 完整的审计日志系统
- JWT双令牌认证机制
- CORS跨域支持

---

## 三、数据库架构

### 3.1 核心表结构

#### users - 用户表
- id: UUID主键
- email: 唯一邮箱
- passwordHash: 密码哈希值
- createdAt/updatedAt: 时间戳

#### profiles - 用户档案表
- id: UUID主键
- userId: 外键关联users
- name: 用户名
- workshop: 车间
- forcePasswordChange: 强制修改密码标志

#### user_roles - 用户角色表
- id: UUID主键
- userId: 外键
- role: 角色类型 (admin/viewer)

#### inventory_items - 库存物品表
- id: UUID主键
- name: 物品名称
- workshop: 车间
- area: 区域
- materialName: 物料名称
- materialCode: 物料代码
- unit: 单位
- uploadedBy: 上传者ID(外键)
- uploadDate: 上传日期

#### inventory_records - 库存记录表
- id: UUID主键
- userId: 用户ID(外键)
- inventoryItemId: 物品ID(外键)
- actualQuantity: 实际数量
- status: 状态 (draft/submitted)
- recordedAt/submittedAt: 时间戳

#### audit_logs - 审计日志表
- id: UUID主键
- userId: 用户ID(可为空)
- action: 操作类型
- resourceType: 资源类型
- resourceId: 资源ID
- details: JSON详情
- ipAddress: IP地址
- userAgent: 用户代理
- status: 状态 (success/failure/error)

#### password_history - 密码历史表
- id: UUID主键
- userId: 用户ID(外键)
- passwordHash: 历史密码哈希

### 3.2 数据库特性
- 完整的外键约束
- 级联删除配置
- 多个索引优化查询性能
- JSON字段支持(details)
- 时间戳自动管理

---

## 四、API端点列表

### 4.1 认证相关
```
POST   /api/auth/register          - 用户注册
POST   /api/auth/login             - 用户登录
POST   /api/auth/refresh           - 刷新令牌
POST   /api/auth/logout            - 登出
GET    /api/auth/profile           - 获取用户档案
```

### 4.2 用户管理
```
GET    /api/users                  - 获取用户列表(管理员)
POST   /api/users                  - 创建用户(管理员)
GET    /api/users/:id              - 获取用户详情
PUT    /api/users/:id              - 更新用户信息
DELETE /api/users/:id              - 删除用户(管理员)
```

### 4.3 库存管理
```
GET    /api/inventory              - 获取库存列表
POST   /api/inventory/upload       - 上传库存数据
GET    /api/inventory/:id          - 获取库存详情
PUT    /api/inventory/:id          - 更新库存信息
DELETE /api/inventory/:id          - 删除库存项
```

### 4.4 盘点记录
```
GET    /api/records                - 获取盘点记录列表
POST   /api/records                - 创建盘点记录
GET    /api/records/:id            - 获取记录详情
PUT    /api/records/:id            - 更新记录
DELETE /api/records/:id            - 删除记录
POST   /api/records/:id/submit     - 提交记录审核
```

### 4.5 统计与报表
```
GET    /api/summary                - 获取数据汇总
GET    /api/summary/export         - 导出Excel报表
GET    /api/stats/workshop         - 车间统计
GET    /api/stats/area             - 区域统计
```

### 4.6 审计日志
```
GET    /api/audit-logs             - 获取审计日志(管理员)
GET    /api/audit-logs/:id         - 获取日志详情
```

---

## 五、Zeabur部署步骤

### 5.1 前置准备

#### GitHub仓库准备
1. 创建GitHub仓库: `fenghan_stock_new`
2. 推送完整项目代码
3. 确保包含以下文件:
   - `package.json` (前端)
   - `backend/package.json` (后端)
   - `backend/prisma/schema.prisma` (数据库schema)
   - `.env.example` 和 `backend/.env.example`

#### 环境依赖检查
- Node.js 18+
- npm/yarn
- Git

### 5.2 部署前端

#### 步骤
1. 登录Zeabur控制台
2. 创建新项目
3. 连接GitHub仓库 `fenghan_stock_new`
4. 配置前端服务:
   - **Service Name**: `stock-deck-frontend`
   - **Root Directory**: `./` (项目根目录)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview` 或使用静态托管
   - **Port**: 5173 (开发) / 需配置静态托管

#### 环境变量
```
VITE_API_BASE_URL=https://<backend-domain>/api
```

#### 推荐配置
- **Runtime**: Node.js 18+
- **Memory**: 512MB
- **CPU**: 共享
- **自动部署**: 启用(main分支)

### 5.3 部署后端

#### 步骤
1. 在Zeabur项目中添加新服务
2. 连接GitHub仓库 `fenghan_stock_new`
3. 配置后端服务:
   - **Service Name**: `stock-deck-backend`
   - **Root Directory**: `./backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Port**: 8080

#### 必需环境变量
```
# 数据库 - 使用Zeabur MySQL或外部MySQL
DATABASE_URL="mysql://username:password@host:port/fenghan_stock"

# JWT密钥 - 生成强随机字符串(最少32个字符)
JWT_ACCESS_SECRET="<strong-random-string-32-chars-min>"
JWT_ACCESS_EXPIRY="2h"
JWT_REFRESH_SECRET="<strong-random-string-32-chars-min>"
JWT_REFRESH_EXPIRY="7d"

# 服务器
PORT=8080
NODE_ENV="production"

# 管理员初始化密钥
ADMIN_INIT_KEY="<secure-random-string>"

# CORS配置 - 前端地址
ALLOWED_ORIGINS="https://frontend-domain.com,https://www.frontend-domain.com"
```

#### 推荐配置
- **Runtime**: Node.js 18+
- **Memory**: 1GB
- **CPU**: 共享或专用
- **自动部署**: 启用(main分支)

### 5.4 部署数据库

#### 选项A: 使用Zeabur MySQL服务
1. 在Zeabur项目中添加MySQL服务
2. 获取连接字符串
3. 运行初始化迁移:
   ```bash
   DATABASE_URL="..." npx prisma db push
   npx prisma db seed
   ```

#### 选项B: 使用外部MySQL(推荐)
1. 使用现有的阿里云RDS或其他MySQL服务
2. 在后端环境变量中配置DATABASE_URL
3. 确保数据库网络可访问

### 5.5 域名配置

#### 前端域名
1. 在Zeabur中配置自定义域名
2. 配置DNS CNAME记录
3. 启用HTTPS(自动)

#### 后端域名
1. 配置独立的后端域名或子域名
2. 更新前端VITE_API_BASE_URL

#### CORS配置
更新后端ALLOWED_ORIGINS环境变量,包含前端地址

---

## 六、初始化流程

### 6.1 创建首个管理员

1. 前端访问初始化页面
2. 输入管理员密钥(ADMIN_INIT_KEY)
3. 创建初始管理员账户
4. 登录后系统可正常使用

### 6.2 导入库存数据

1. 以管理员身份登录
2. 进入库存管理页面
3. 上传Excel文件(库存清单)
4. 系统自动解析并存储

### 6.3 分配用户权限

1. 在用户管理中创建普通用户
2. 分配用户所属车间
3. 用户首次登录需修改密码

---

## 七、监控与维护

### 7.1 监控指标

- **前端**: 页面加载时间、错误率
- **后端**: API响应时间、错误率、日志
- **数据库**: 连接数、查询性能、存储空间

### 7.2 日志管理

- 后端日志: Zeabur控制台查看
- 审计日志: `/api/audit-logs` 端点
- 错误追踪: 检查前端控制台和后端日志

### 7.3 备份策略

- **数据库备份**: 定期备份MySQL数据
- **代码备份**: Git仓库自动管理
- **环境配置**: 妥善保管环境变量

---

## 八、常见问题

### Q1: 部署后无法连接后端API
**A**: 
- 检查CORS配置是否正确
- 验证ALLOWED_ORIGINS包含前端域名
- 检查API_BASE_URL是否正确

### Q2: 用户无法上传库存数据
**A**:
- 检查用户权限(需要admin或上传权限)
- 验证文件格式是否正确(xlsx/xls)
- 检查后端日志了解详细错误

### Q3: 数据库连接失败
**A**:
- 验证DATABASE_URL格式正确
- 检查数据库用户名/密码
- 确认数据库网络可访问
- 检查IP白名单配置

### Q4: 登录后出现404错误
**A**:
- 清除浏览器缓存
- 检查路由配置
- 验证ProtectedRoute组件工作正常

---

## 九、安全建议

### 9.1 环境变量安全
- 使用强随机字符串(32字符+)
- JWT密钥每个环境独立
- 不在代码中提交敏感信息
- 定期更新密钥

### 9.2 数据库安全
- 启用SSL连接
- 使用强密码
- 限制IP访问(白名单)
- 定期备份

### 9.3 API安全
- CORS严格限制
- 速率限制配置
- 输入验证和清理
- 错误信息不泄露敏感数据

### 9.4 部署安全
- 启用HTTPS/TLS
- 定期更新依赖
- 监控可疑活动
- 实施审计日志

---

## 十、部署检查清单

### 部署前检查
- [ ] GitHub仓库已创建并推送代码
- [ ] .env.example文件已准备
- [ ] package.json包含所有必需依赖
- [ ] 数据库schema已验证
- [ ] 所有API端点已测试
- [ ] 前端环境变量配置已准备

### 部署时检查
- [ ] Zeabur项目已创建
- [ ] GitHub连接已授权
- [ ] 前端服务部署成功
- [ ] 后端服务部署成功
- [ ] 数据库连接正常
- [ ] 环境变量已配置完整

### 部署后检查
- [ ] 前端能正常访问
- [ ] 后端API能正常响应
- [ ] 登录功能正常
- [ ] 库存数据能正常上传
- [ ] 审计日志正常记录
- [ ] 无错误日志

---

## 十一、联系与支持

- **项目仓库**: https://github.com/your-username/fenghan_stock_new
- **Zeabur文档**: https://zeabur.com/docs
- **Prisma文档**: https://www.prisma.io/docs
- **Express文档**: https://expressjs.com

---

**最后更新**: 2025-11-16  
**版本**: 1.0.0
