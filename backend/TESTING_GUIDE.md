# 测试指南

## 概述

本项目使用 **Jest** 和 **Supertest** 进行集成测试，确保API的正确性和稳定性。

## 测试环境配置

### 1. 安装依赖

```bash
npm install
```

### 2. 配置测试数据库

创建测试环境变量文件 `.env.test`:

```env
DATABASE_URL="mysql://root:password@localhost:3306/stock_deck_test"
JWT_SECRET="test_jwt_secret_key"
NODE_ENV="test"
```

### 3. 初始化测试数据库

```bash
# 生成Prisma Client
npm run prisma:generate

# 推送数据库schema
npm run prisma:push
```

## 运行测试

### 运行所有测试

```bash
npm test
```

### 运行测试并生成覆盖率报告

```bash
npm test -- --coverage
```

### 监听模式（开发时使用）

```bash
npm run test:watch
```

### 只运行集成测试

```bash
npm run test:integration
```

## 测试结构

```
backend/
├── __tests__/
│   ├── setup.ts              # 测试环境设置
│   └── integration/
│       └── api.test.ts       # API集成测试
├── jest.config.js            # Jest配置
└── package.json
```

## 测试覆盖的功能模块

### 1. 认证模块
- ✅ 用户登录
- ✅ 密码验证
- ✅ 修改密码
- ✅ Token认证

### 2. 盘点记录管理
- ✅ 创建盘点记录
- ✅ 获取记录列表（分页）
- ✅ 获取单个记录详情
- ✅ 更新记录
- ✅ 删除记录
- ✅ 提交记录
- ✅ 批量提交

### 3. 用户管理（管理员）
- ✅ 获取用户列表
- ✅ 创建管理员
- ✅ 权限控制

### 4. 报表统计
- ✅ 获取统计数据

### 5. 授权控制
- ✅ 未认证请求拒绝
- ✅ 无效Token拒绝
- ✅ 角色权限验证

### 6. API文档
- ✅ Swagger文档访问

## 测试最佳实践

### 1. 测试隔离

每个测试用例应该独立运行，不依赖其他测试的状态：

```typescript
afterEach(async () => {
  // 清理测试数据
  await prisma.inventoryRecord.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  // ...
});
```

### 2. 使用描述性测试名称

```typescript
it('应该成功创建盘点记录', async () => {
  // 测试代码
});

it('不应该修改已提交的记录', async () => {
  // 测试代码
});
```

### 3. 测试正常流程和异常情况

```typescript
// 正常流程
it('应该成功登录', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user@test.com', password: 'user123' });
  
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
});

// 异常情况
it('应该拒绝错误的密码', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user@test.com', password: 'wrongpassword' });
  
  expect(res.status).toBe(401);
  expect(res.body.success).toBe(false);
});
```

### 4. 使用beforeAll和afterAll管理测试数据

```typescript
beforeAll(async () => {
  // 创建测试所需的基础数据
  await createTestUsers();
  await createTestItems();
});

afterAll(async () => {
  // 清理并断开数据库连接
  await prisma.$disconnect();
});
```

## 添加新测试

### 1. 创建测试文件

在 `__tests__/integration/` 目录下创建新的测试文件：

```typescript
// __tests__/integration/new-feature.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('New Feature Tests', () => {
  it('应该测试新功能', async () => {
    const res = await request(app).get('/api/new-feature');
    expect(res.status).toBe(200);
  });
});
```

### 2. 运行新测试

```bash
npm test -- new-feature.test.ts
```

## 持续集成 (CI)

项目配置了GitHub Actions自动运行测试：

- **触发条件**: Push到main/develop分支或创建Pull Request
- **测试环境**: Ubuntu + MySQL 8.0
- **测试步骤**:
  1. 安装依赖
  2. 生成Prisma Client
  3. 运行数据库迁移
  4. 执行测试套件
  5. 上传覆盖率报告

查看CI配置: `.github/workflows/test.yml`

## 测试覆盖率

### 查看覆盖率报告

运行测试后，覆盖率报告会生成在 `coverage/` 目录：

```bash
# 在浏览器中查看HTML报告
open coverage/lcov-report/index.html
```

### 覆盖率目标

- **语句覆盖率**: ≥ 80%
- **分支覆盖率**: ≥ 75%
- **函数覆盖率**: ≥ 80%
- **行覆盖率**: ≥ 80%

## 常见问题

### 1. 数据库连接失败

**问题**: `Error: Can't reach database server`

**解决方案**:
- 确保MySQL服务正在运行
- 检查 `.env.test` 中的数据库连接字符串
- 确认测试数据库已创建

### 2. Prisma Client未生成

**问题**: `Cannot find module '@prisma/client'`

**解决方案**:
```bash
npm run prisma:generate
```

### 3. 测试超时

**问题**: `Timeout - Async callback was not invoked within the 5000 ms timeout`

**解决方案**:
- 增加Jest配置中的超时时间（`jest.config.js`）
- 检查是否有未关闭的数据库连接
- 确保异步操作正确使用 `async/await`

### 4. 端口冲突

**问题**: 测试时端口被占用

**解决方案**:
- 测试使用的是内存中的Express应用，不需要启动实际服务器
- 如果仍有问题，检查是否有其他进程占用端口

## 调试测试

### 使用VSCode调试

在 `.vscode/launch.json` 中添加配置：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/backend/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### 查看详细输出

```bash
npm test -- --verbose
```

### 只运行特定测试

```bash
# 运行包含特定描述的测试
npm test -- -t "应该成功登录"

# 运行特定文件
npm test -- api.test.ts
```

## 性能测试

虽然当前主要关注功能测试，但也可以添加性能测试：

```typescript
it('应该在合理时间内处理大量请求', async () => {
  const startTime = Date.now();
  
  const promises = Array(100).fill(null).map(() =>
    request(app)
      .get('/api/inventory/records')
      .set('Authorization', `Bearer ${token}`)
  );
  
  await Promise.all(promises);
  
  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(5000); // 5秒内完成
});
```

## 贡献指南

添加新功能时，请确保：

1. ✅ 为新API端点编写测试
2. ✅ 测试覆盖正常和异常情况
3. ✅ 所有测试通过后再提交代码
4. ✅ 保持测试覆盖率不低于80%

## 参考资源

- [Jest官方文档](https://jestjs.io/docs/getting-started)
- [Supertest文档](https://github.com/visionmedia/supertest)
- [Prisma测试指南](https://www.prisma.io/docs/guides/testing)
- [GitHub Actions文档](https://docs.github.com/en/actions)
