# OpenSEC 规划驱动修复总结

## 问题描述

登录后前端一直停留在"加载中..."状态，无法跳转到任何页面。

## 根本原因分析

前端代码混用了两套认证体系：

1. **登录流程**：使用 `authService` 调用后端 MySQL 数据库的 API，返回 JWT token
2. **权限检查和数据加载**：部分页面仍在使用 `supabase.auth.getUser()`，期望从 Supabase 获取用户会话

由于后端实际使用 MySQL 而非 Supabase，所有 `supabase.auth` 调用都会失败或返回空，导致：
- 登录成功后，路由守卫无法获取用户信息，一直处于 loading 状态
- 业务页面无法加载数据，停留在"加载中..."

## OpenSEC 规划驱动的修复方案

按照 OpenSEC 框架的"规划-执行-审计"模式，统一认证体系：

### 1. 统一用户上下文源头

**修改文件：** `opensec/access-control.ts`

**变更内容：**
- 移除对 `supabase.auth.getUser()` 的依赖
- 改用 `authService.getCurrentUser()` 获取用户信息
- 将用户角色从 `user.roles[]` 映射到 OpenSEC 的 `Role` 枚举
- 添加审计日志记录用户上下文获取的成功/失败

### 2. 修改路由守卫

**修改文件：**
- `src/components/ProtectedRoute.tsx`
- `src/components/AdminRoute.tsx`

**变更内容：**
- 完全基于 `authService.isAuthenticated()` 和 `authService.getCurrentUser()` 进行权限检查
- 移除所有 Supabase 相关代码
- 添加 OpenSEC 审计日志，记录权限拒绝事件
- 确保 `loading` 状态在所有分支都能正确结束

### 3. 修改业务页面

**修改文件：**
- `src/pages/Console.tsx`
- `src/pages/Review.tsx`
- `src/pages/Summary.tsx`

**变更内容：**
- 移除 `supabase.auth.getUser()` 调用
- 改用 `authService.getCurrentUser()` 获取当前用户
- 数据加载改为调用后端 API（通过 `inventoryService`）
- 添加审计日志记录关键操作（登出、权限检查失败等）

### 4. 扩展后端 API 服务

**修改文件：** `src/lib/inventory.ts`

**新增方法：**
- `updateRecord(recordId, actualQuantity)` - 更新盘点记录
- `submitMultipleRecords()` - 批量提交盘点记录

**目的：** 让前端完全通过后端 API 操作数据，不再直接访问 Supabase

### 5. 添加审计日志

在以下关键点添加了 OpenSEC 审计日志：

- **认证检查：** 路由守卫检查用户登录状态
- **权限验证：** 管理员权限检查
- **用户操作：** 登出、访问受保护路由
- **失败事件：** 未登录访问、权限不足

## 修改后的认证流程

```
用户登录
  ↓
authService.loginByName() → 后端 MySQL API
  ↓
保存 JWT token 到 localStorage
  ↓
navigate() 跳转到目标页面
  ↓
路由守卫 (ProtectedRoute/AdminRoute)
  ↓
authService.isAuthenticated() + getCurrentUser()
  ↓
权限检查通过 → 渲染页面
  ↓
页面加载数据 → inventoryService → 后端 API → MySQL
```

## 已知问题（需要后续处理）

### Console 页面的 Supabase 依赖

`Console.tsx` 中的以下功能仍在使用 Supabase：

1. **注册用户** (line 97-117)
   - 调用 `supabase.functions.invoke('register-user')`
   - **建议：** 改为调用后端 `/auth/register` API

2. **上传 Excel** (line 209-264)
   - 直接操作 `supabase.from("inventory_items")`
   - **建议：** 使用后端已有的 `/inventory/items/upload` API

这些功能暂时保留 Supabase 调用，但不影响登录和基本页面访问。

## 验证步骤

1. **启动后端服务**
   ```bash
   cd backend
   npm run dev
   ```

2. **启动前端服务**
   ```bash
   npm run dev
   ```

3. **测试登录流程**
   - 访问登录页
   - 输入用户名和密码
   - 确认能正常跳转到对应页面（管理员 → `/console`，普通用户 → `/record`）
   - 确认不再停留在"加载中..."状态

4. **测试权限控制**
   - 普通用户访问 `/console` 应被重定向到 `/record`
   - 未登录用户访问受保护路由应被重定向到 `/auth`

5. **检查审计日志**
   - 打开浏览器控制台
   - 查看 `[AUDIT]` 开头的日志输出
   - 确认关键操作都有记录

## OpenSEC 安全增强

本次修复遵循 OpenSEC 框架的安全最佳实践：

1. **统一认证源** - 所有认证检查使用同一个 authService
2. **最小权限原则** - 路由守卫严格检查用户权限
3. **审计追踪** - 记录所有认证和权限相关事件
4. **失败安全** - 所有异常情况都有明确的处理分支
5. **规划驱动** - 按照明确的计划逐步修改，避免遗漏

## 后续优化建议

1. **完全移除 Supabase 依赖**
   - 将 Console 页面的注册用户和上传 Excel 功能改为调用后端 API
   - 移除 `src/integrations/supabase/client.ts`

2. **增强审计日志**
   - 将审计日志发送到后端持久化存储
   - 添加日志查询和分析功能

3. **完善错误处理**
   - 统一错误提示格式
   - 添加更详细的错误信息

4. **性能优化**
   - 减少不必要的 API 调用
   - 添加数据缓存机制

---

**修复完成时间：** 2025-11-16  
**修复方式：** OpenSEC 规划驱动  
**影响范围：** 前端认证体系统一，登录流程修复
