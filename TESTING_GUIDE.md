# 测试指南

本文档介绍如何在库存盘点系统中运行和编写测试。

## 📋 目录

- [测试概述](#测试概述)
- [快速开始](#快速开始)
- [前端测试](#前端测试)
- [后端测试](#后端测试)
- [CI/CD](#cicd)
- [编写测试](#编写测试)
- [最佳实践](#最佳实践)

## 🎯 测试概述

### 当前测试覆盖

- ✅ **前端单元测试**: Vitest + React Testing Library
- ✅ **后端单元测试**: Jest + Supertest
- ✅ **后端集成测试**: API端点测试
- ✅ **CI/CD**: GitHub Actions

### 测试统计

| 类型 | 框架 | 测试数量 | 覆盖率目标 |
|------|------|----------|-----------|
| 前端单元测试 | Vitest | 9 | >70% |
| 后端单元测试 | Jest | 31 | >80% |
| 后端集成测试 | Jest | 19 | >60% |

## 🚀 快速开始

### 运行所有测试

```bash
# 前端测试
npm test

# 后端测试
cd backend && npm test
```

### 查看测试覆盖率

```bash
# 前端
npm run test:coverage

# 后端
cd backend && npm test
```

## 🎨 前端测试

### 技术栈

- **测试框架**: [Vitest](https://vitest.dev/)
- **组件测试**: [React Testing Library](https://testing-library.com/react)
- **断言库**: Vitest (兼容Jest API)

### 运行前端测试

```bash
# 运行测试（监听模式）
npm test

# 运行一次
npm test -- --run

# 带UI界面
npm run test:ui

# 生成覆盖率报告
npm run test:coverage
```

### 前端测试示例

#### 组件测试

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('应该正确渲染按钮文本', () => {
    render(<Button>点击我</Button>);

    const button = screen.getByRole('button', { name: '点击我' });
    expect(button).toBeInTheDocument();
  });

  it('应该在点击时调用onClick处理函数', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>点击我</Button>);

    const button = screen.getByRole('button', { name: '点击我' });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### 工具函数测试

```typescript
import { describe, it, expect } from 'vitest';

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('应该接受有效的邮箱地址', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('应该拒绝无效的邮箱地址', () => {
      expect(isValidEmail('invalid')).toBe(false);
    });
  });
});
```

### 前端测试文件位置

```
src/
├── components/
│   └── __tests__/
│       └── Button.test.tsx
└── utils/
    └── __tests__/
        └── validation.test.ts
```

## 🔧 后端测试

### 技术栈

- **测试框架**: [Jest](https://jestjs.io/)
- **API测试**: [Supertest](https://github.com/visionmedia/supertest)
- **数据库**: Prisma (测试模式)

### 运行后端测试

```bash
cd backend

# 运行所有测试
npm test

# 运行单元测试
npm test -- --testPathPatterns="src/utils"

# 运行集成测试
npm run test:integration

# 监听模式
npm run test:watch
```

### 后端测试示例

#### 单元测试

```typescript
import { hashPassword, verifyPassword } from '../password';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('应该正确哈希密码', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });
  });

  describe('verifyPassword', () => {
    it('应该正确验证匹配的密码', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      const isMatch = await verifyPassword(password, hash);

      expect(isMatch).toBe(true);
    });
  });
});
```

#### 集成测试

```typescript
import request from 'supertest';
import app from '../../src/app';

describe('Authentication API', () => {
  it('应该成功登录', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'user123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });
});
```

### 后端测试文件位置

```
backend/
├── src/
│   ├── utils/
│   │   └── __tests__/
│   │       ├── jwt.test.ts
│   │       ├── password.test.ts
│   │       └── sanitize.test.ts
│   └── services/
│       └── __tests__/
│           └── (待添加)
└── __tests__/
    ├── setup.ts
    └── integration/
        └── api.test.ts
```

## 🔄 CI/CD

### GitHub Actions

项目配置了自动化测试流程，每次push或PR时自动运行：

- ✅ 前端测试
- ✅ 后端测试
- ✅ 代码构建检查
- ✅ 多Node.js版本测试 (18.x, 20.x)

### 查看CI/CD状态

在GitHub仓库的Actions标签页查看测试结果。

### 本地模拟CI/CD

```bash
# 前端
npm ci
npm run lint
npm test -- --run
npm run build

# 后端
cd backend
npm ci
npm run build
npm test
```

## ✍️ 编写测试

### 测试文件命名规范

- 单元测试: `*.test.ts` 或 `*.test.tsx`
- 测试目录: `__tests__/`
- 位置: 与被测试文件同目录或在`__tests__`目录中

### 测试结构

```typescript
describe('功能模块名称', () => {
  describe('子功能1', () => {
    it('应该做某事', () => {
      // Arrange (准备)
      const input = 'test';

      // Act (执行)
      const result = someFunction(input);

      // Assert (断言)
      expect(result).toBe('expected');
    });
  });
});
```

### 常用断言

```typescript
// 相等性
expect(value).toBe(expected);
expect(value).toEqual(expected);

// 真假性
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// 数字
expect(number).toBeGreaterThan(3);
expect(number).toBeLessThan(5);

// 字符串
expect(string).toContain('substring');
expect(string).toMatch(/pattern/);

// 数组
expect(array).toHaveLength(3);
expect(array).toContain(item);

// 对象
expect(object).toHaveProperty('key');
expect(object).toMatchObject({ key: value });

// 异步
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

## 📝 最佳实践

### 1. 测试命名

使用描述性的测试名称，使用"应该"开头：

```typescript
it('应该在密码错误时返回401', async () => {
  // ...
});
```

### 2. AAA模式

遵循 Arrange-Act-Assert 模式：

```typescript
it('应该正确计算总和', () => {
  // Arrange
  const a = 1;
  const b = 2;

  // Act
  const sum = add(a, b);

  // Assert
  expect(sum).toBe(3);
});
```

### 3. 测试隔离

每个测试应该独立运行，不依赖其他测试：

```typescript
beforeEach(() => {
  // 每个测试前重置状态
});

afterEach(() => {
  // 每个测试后清理
});
```

### 4. Mock外部依赖

```typescript
// Vitest
vi.mock('../api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'mocked' }))
}));

// Jest
jest.mock('../api', () => ({
  fetchData: jest.fn(() => Promise.resolve({ data: 'mocked' }))
}));
```

### 5. 测试覆盖率

- 目标: 后端 >80%, 前端 >70%
- 重点测试核心业务逻辑
- 不必追求100%覆盖率

### 6. 测试性能

- 单元测试应该快速 (<5秒)
- 集成测试可以稍慢 (<30秒)
- 使用并行运行加速测试

## 🐛 调试测试

### 前端

```bash
# 在浏览器中调试
npm run test:ui

# 查看详细输出
npm test -- --reporter=verbose
```

### 后端

```bash
# 查看详细输出
npm test -- --verbose

# 只运行特定测试
npm test -- --testNamePattern="应该成功登录"
```

## 📚 参考资源

- [Vitest文档](https://vitest.dev/)
- [React Testing Library文档](https://testing-library.com/react)
- [Jest文档](https://jestjs.io/)
- [Supertest文档](https://github.com/visionmedia/supertest)

## 🤝 贡献

添加新功能时，请同时添加相应的测试：

1. 编写测试用例
2. 运行测试确保通过
3. 检查代码覆盖率
4. 提交PR

## 📞 联系

如有测试相关问题，请联系开发团队或提交Issue。

---

**最后更新**: 2025-11-16
**维护者**: 开发团队
