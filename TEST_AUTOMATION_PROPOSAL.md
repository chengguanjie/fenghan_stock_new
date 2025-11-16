# 库存盘点系统自动化测试方案

## 1. 项目测试现状分析

### 1.1 当前状态
- ✅ 后端已配置 Jest 测试框架
- ✅ 后端有基础集成测试 (19个测试用例)
- ✅ 代码覆盖率: 20.61% (目标: >80%)
- ❌ 前端无测试框架
- ❌ 无单元测试
- ❌ 无E2E测试
- ❌ 无CI/CD自动化

### 1.2 测试失败分析
当前有14个测试失败，主要问题:
- JWT认证中间件问题 (返回401而非预期的200/403)
- 需要修复认证逻辑和测试用例

## 2. 测试策略

### 2.1 测试金字塔
```
        /\
       /  \  E2E Tests (5%)
      /____\
     /      \  Integration Tests (25%)
    /________\
   /          \  Unit Tests (70%)
  /____________\
```

### 2.2 测试层级
1. **单元测试** (70%) - 快速、隔离、大量
2. **集成测试** (25%) - API端点、数据库交互
3. **E2E测试** (5%) - 关键业务流程

## 3. 技术栈选型

### 3.1 前端测试
- **测试框架**: Vitest (与Vite完美集成)
- **组件测试**: React Testing Library
- **E2E测试**: Playwright
- **Mock工具**: MSW (Mock Service Worker)

### 3.2 后端测试
- **测试框架**: Jest (已配置)
- **API测试**: Supertest (已配置)
- **数据库**: SQLite (测试环境)
- **Mock工具**: Jest Mocks

## 4. 测试覆盖范围

### 4.1 后端单元测试
```
backend/src/
├── utils/
│   ├── __tests__/
│   │   ├── jwt.test.ts
│   │   ├── password.test.ts
│   │   ├── sanitize.test.ts
│   │   └── response.test.ts
├── services/
│   ├── __tests__/
│   │   ├── auth.service.test.ts
│   │   ├── inventory.service.test.ts
│   │   ├── user.service.test.ts
│   │   └── report.service.test.ts
└── middleware/
    ├── __tests__/
    │   ├── auth.middleware.test.ts
    │   ├── rbac.middleware.test.ts
    │   └── validator.middleware.test.ts
```

### 4.2 后端集成测试
```
backend/__tests__/integration/
├── auth.api.test.ts          # 认证相关API
├── inventory.api.test.ts     # 库存管理API
├── user.api.test.ts          # 用户管理API
├── report.api.test.ts        # 报表API
└── upload.api.test.ts        # 文件上传API
```

### 4.3 前端单元测试
```
src/
├── components/
│   ├── __tests__/
│   │   ├── InventoryTable.test.tsx
│   │   ├── UserForm.test.tsx
│   │   └── ReportChart.test.tsx
├── hooks/
│   ├── __tests__/
│   │   ├── useAuth.test.ts
│   │   └── useInventory.test.ts
└── utils/
    ├── __tests__/
    │   ├── validation.test.ts
    │   └── formatting.test.ts
```

### 4.4 E2E测试
```
e2e/
├── auth.spec.ts              # 登录/登出流程
├── inventory-crud.spec.ts    # 库存CRUD操作
├── report-generation.spec.ts # 报表生成
└── user-management.spec.ts   # 用户管理流程
```

## 5. 实施计划

### 阶段1: 基础设施 (1-2天)
- [ ] 为前端添加Vitest配置
- [ ] 配置React Testing Library
- [ ] 设置测试数据库 (SQLite)
- [ ] 创建测试工具函数

### 阶段2: 后端单元测试 (2-3天)
- [ ] Utils层单元测试
- [ ] Services层单元测试
- [ ] Middleware层单元测试
- [ ] 目标覆盖率: >80%

### 阶段3: 后端集成测试 (2-3天)
- [ ] 修复现有集成测试
- [ ] 扩展API集成测试
- [ ] 测试数据库交互
- [ ] 测试文件上传

### 阶段4: 前端测试 (3-4天)
- [ ] 组件单元测试
- [ ] Hooks测试
- [ ] Utils测试
- [ ] 目标覆盖率: >70%

### 阶段5: E2E测试 (2-3天)
- [ ] 安装配置Playwright
- [ ] 关键业务流程测试
- [ ] 跨浏览器测试

### 阶段6: CI/CD集成 (1-2天)
- [ ] GitHub Actions配置
- [ ] 自动化测试流程
- [ ] 代码覆盖率报告
- [ ] PR检查集成

## 6. 质量目标

### 6.1 代码覆盖率目标
- 后端总体: >80%
- 前端总体: >70%
- 关键业务逻辑: >90%

### 6.2 性能目标
- 单元测试: <5秒
- 集成测试: <30秒
- E2E测试: <5分钟
- 总测试时间: <10分钟

### 6.3 质量指标
- 测试通过率: 100%
- PR必须通过所有测试
- 代码覆盖率不能下降
- 关键路径E2E测试必须通过

## 7. CI/CD配置

### 7.1 GitHub Actions工作流
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Run backend tests
        run: cd backend && npm test
      - name: Run frontend tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 7.2 Pre-commit钩子
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:changed",
      "pre-push": "npm test"
    }
  }
}
```

## 8. 测试最佳实践

### 8.1 测试命名规范
```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('应该创建新用户并返回用户信息', async () => {
      // 测试代码
    });

    it('当邮箱已存在时应该抛出错误', async () => {
      // 测试代码
    });
  });
});
```

### 8.2 AAA模式
```typescript
it('应该正确计算库存总量', () => {
  // Arrange (准备)
  const items = [{ quantity: 10 }, { quantity: 20 }];

  // Act (执行)
  const total = calculateTotal(items);

  // Assert (断言)
  expect(total).toBe(30);
});
```

### 8.3 测试隔离
- 每个测试独立运行
- 使用beforeEach清理状态
- 不依赖测试执行顺序
- Mock外部依赖

## 9. 风险与挑战

### 9.1 潜在风险
- 测试编写时间较长
- 可能影响开发速度
- 测试维护成本
- 数据库测试复杂性

### 9.2 应对策略
- 渐进式实施
- 优先关键功能
- 持续重构测试代码
- 使用测试工具函数

## 10. 成功标准

### 10.1 短期目标 (1-2周)
- ✅ 后端代码覆盖率 >60%
- ✅ 修复所有现有测试
- ✅ 前端测试框架就绪
- ✅ 基本单元测试覆盖

### 10.2 中期目标 (1个月)
- ✅ 后端代码覆盖率 >80%
- ✅ 前端代码覆盖率 >70%
- ✅ E2E测试覆盖关键流程
- ✅ CI/CD自动化完成

### 10.3 长期目标 (持续)
- ✅ 保持高覆盖率
- ✅ 所有PR必须有测试
- ✅ 测试文档完善
- ✅ 测试文化建立

## 11. 资源需求

### 11.1 工具
- GitHub Actions (免费)
- Codecov (开源免费)
- Playwright (免费)

### 11.2 时间
- 初始设置: 1-2天
- 测试编写: 10-15天
- 持续维护: 每周2-3小时

## 12. 下一步行动

1. ✅ 修复现有测试的TypeScript错误
2. ⏳ 为前端添加Vitest
3. ⏳ 编写后端单元测试
4. ⏳ 扩展集成测试
5. ⏳ 添加E2E测试
6. ⏳ 配置CI/CD

---

**文档版本**: 1.0
**创建日期**: 2025-11-16
**最后更新**: 2025-11-16
**负责人**: 开发团队
