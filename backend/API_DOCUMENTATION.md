# API 文档规范

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **版本**: v1.0.0
- **认证方式**: JWT Bearer Token

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "message": "操作成功描述",
  "data": {} // 或 []
}
```

### 分页响应

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误信息描述"
}
```

## HTTP 状态码规范

| 状态码 | 说明 | 使用场景 |
|--------|------|----------|
| 200 | OK | 成功获取资源 |
| 201 | Created | 成功创建资源 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证或token无效 |
| 403 | Forbidden | 无权限访问 |
| 404 | Not Found | 资源不存在 |
| 500 | Internal Server Error | 服务器内部错误 |

---

## 认证接口

### 1. 用户注册

**端点**: `POST /api/auth/register`

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "string (3-20字符)",
  "password": "string (6-50字符)",
  "fullName": "string (可选)"
}
```

**成功响应** (201):
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "createdAt": "ISO8601 timestamp"
    },
    "token": "JWT token string"
  }
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "用户名已存在"
}
```

---

### 2. 用户登录

**端点**: `POST /api/auth/login`

**请求头**:
```
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "roles": ["user"] // 或 ["admin"]
    },
    "token": "JWT token string"
  }
}
```

**错误响应** (401):
```json
{
  "success": false,
  "error": "用户名或密码错误"
}
```

---

### 3. 修改密码

**端点**: `POST /api/auth/change-password`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "oldPassword": "string",
  "newPassword": "string (6-50字符)"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

---

## 用户管理接口

### 1. 获取用户列表 (仅管理员)

**端点**: `GET /api/users`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
- `page`: number (可选，默认1)
- `pageSize`: number (可选，默认20)

**成功响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "string",
      "profile": {
        "fullName": "string"
      },
      "createdAt": "ISO8601 timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### 2. 创建管理员 (仅管理员)

**端点**: `POST /api/users/admin`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "string (3-20字符)",
  "password": "string (6-50字符)",
  "fullName": "string (可选)"
}
```

**成功响应** (201):
```json
{
  "success": true,
  "message": "管理员创建成功",
  "data": {
    "id": "uuid",
    "username": "string",
    "roles": ["admin"]
  }
}
```

---

## 盘点记录接口

### 1. 创建盘点记录

**端点**: `POST /api/inventory/records`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "inventoryItemId": "uuid",
  "actualQuantity": number
}
```

**成功响应** (201):
```json
{
  "success": true,
  "message": "盘点记录创建成功",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "inventoryItemId": "uuid",
    "actualQuantity": number,
    "status": "draft",
    "inventoryItem": {
      "id": "uuid",
      "name": "string",
      "workshop": "string",
      "area": "string",
      "materialName": "string",
      "unit": "string"
    },
    "createdAt": "ISO8601 timestamp",
    "updatedAt": "ISO8601 timestamp"
  }
}
```

---

### 2. 获取盘点记录列表

**端点**: `GET /api/inventory/records`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
- `userId`: string (可选，管理员可指定)
- `status`: "draft" | "submitted" (可选)
- `page`: number (可选，默认1)
- `pageSize`: number (可选，默认20)

**成功响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "inventoryItemId": "uuid",
      "actualQuantity": number,
      "status": "draft" | "submitted",
      "submittedAt": "ISO8601 timestamp | null",
      "inventoryItem": {
        "id": "uuid",
        "name": "string",
        "workshop": "string",
        "area": "string",
        "materialName": "string",
        "unit": "string"
      },
      "user": {
        "id": "uuid",
        "username": "string",
        "profile": {
          "fullName": "string"
        }
      },
      "createdAt": "ISO8601 timestamp",
      "updatedAt": "ISO8601 timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 3. 获取单个盘点记录详情

**端点**: `GET /api/inventory/records/:id`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:
- `id`: string (记录UUID)

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "inventoryItemId": "uuid",
    "actualQuantity": number,
    "status": "draft" | "submitted",
    "submittedAt": "ISO8601 timestamp | null",
    "inventoryItem": {
      "id": "uuid",
      "name": "string",
      "workshop": "string",
      "area": "string",
      "materialName": "string",
      "unit": "string"
    },
    "user": {
      "id": "uuid",
      "username": "string",
      "profile": {
        "fullName": "string"
      }
    },
    "createdAt": "ISO8601 timestamp",
    "updatedAt": "ISO8601 timestamp"
  }
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "记录不存在"
}
```

---

### 4. 更新盘点记录

**端点**: `PUT /api/inventory/records/:id`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
- `id`: string (记录UUID)

**请求体**:
```json
{
  "actualQuantity": number,
  "status": "draft" | "submitted" (可选)
}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "记录更新成功",
  "data": {
    // 同获取单个记录的响应格式
  }
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "已提交的记录不能修改"
}
```

---

### 5. 删除盘点记录

**端点**: `DELETE /api/inventory/records/:id`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:
- `id`: string (记录UUID)

**成功响应** (200):
```json
{
  "success": true,
  "message": "记录删除成功"
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "已提交的记录不能删除"
}
```

---

### 6. 提交单个盘点记录

**端点**: `POST /api/inventory/records/:id/submit`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:
- `id`: string (记录UUID)

**成功响应** (200):
```json
{
  "success": true,
  "message": "记录提交成功",
  "data": {
    // 同获取单个记录的响应格式
    "status": "submitted",
    "submittedAt": "ISO8601 timestamp"
  }
}
```

---

### 7. 批量提交盘点记录

**端点**: `POST /api/inventory/records/batch/submit`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "recordIds": ["uuid1", "uuid2", "uuid3"]
}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "成功提交 3 条记录",
  "data": {
    "success": true,
    "count": 3
  }
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "部分记录不存在或已提交"
}
```

---

### 8. 上传物料Excel文件

**端点**: `POST /api/inventory/items/upload`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求体** (FormData):
- `file`: File (Excel文件，.xlsx或.xls格式)

**Excel文件格式要求**:
| 姓名 | 车间 | 区域 | 物料名称 | 单位 |
|------|------|------|----------|------|
| 张三 | 生产车间 | A区 | 原料A | kg |

**成功响应** (201):
```json
{
  "success": true,
  "message": "成功上传 10 条物料数据",
  "data": {
    "success": true,
    "count": 10,
    "items": [
      {
        "id": "uuid",
        "name": "张三",
        "workshop": "生产车间",
        "area": "A区",
        "materialName": "原料A",
        "unit": "kg",
        "uploadedBy": "uuid",
        "createdAt": "ISO8601 timestamp"
      }
    ]
  }
}
```

**错误响应** (400):
```json
{
  "success": false,
  "error": "缺少必需字段: 姓名, 车间"
}
```

---

## 报表统计接口

### 1. 获取盘点统计数据

**端点**: `GET /api/reports/statistics`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
- `startDate`: string (可选，ISO8601格式)
- `endDate`: string (可选，ISO8601格式)

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "totalRecords": number,
    "draftRecords": number,
    "submittedRecords": number,
    "totalUsers": number,
    "activeUsers": number
  }
}
```

---

## 审计日志接口

### 1. 获取审计日志 (仅管理员)

**端点**: `GET /api/audit/logs`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
- `userId`: string (可选)
- `action`: string (可选)
- `resourceType`: string (可选)
- `startDate`: string (可选，ISO8601格式)
- `endDate`: string (可选，ISO8601格式)
- `page`: number (可选，默认1)
- `pageSize`: number (可选，默认20)

**成功响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "action": "string",
      "resourceType": "string",
      "resourceId": "string",
      "details": {},
      "ipAddress": "string",
      "userAgent": "string",
      "createdAt": "ISO8601 timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 数据模型

### User (用户)

```typescript
{
  id: string;              // UUID
  username: string;        // 用户名，唯一
  passwordHash: string;    // 密码哈希
  roles: string[];         // 角色数组 ["user"] 或 ["admin"]
  forcePasswordChange: boolean; // 是否强制修改密码
  createdAt: Date;
  updatedAt: Date;
}
```

### UserProfile (用户资料)

```typescript
{
  id: string;              // UUID
  userId: string;          // 关联用户ID
  fullName: string | null; // 全名
  createdAt: Date;
  updatedAt: Date;
}
```

### InventoryItem (物料)

```typescript
{
  id: string;              // UUID
  name: string;            // 姓名
  workshop: string;        // 车间
  area: string;            // 区域
  materialName: string;    // 物料名称
  unit: string;            // 单位
  uploadedBy: string;      // 上传者用户ID
  createdAt: Date;
  updatedAt: Date;
}
```

### InventoryRecord (盘点记录)

```typescript
{
  id: string;              // UUID
  userId: string;          // 盘点用户ID
  inventoryItemId: string; // 物料ID
  actualQuantity: number;  // 实际数量
  status: "draft" | "submitted"; // 状态
  submittedAt: Date | null; // 提交时间
  createdAt: Date;
  updatedAt: Date;
}
```

### AuditLog (审计日志)

```typescript
{
  id: string;              // UUID
  userId: string;          // 操作用户ID
  action: string;          // 操作类型
  resourceType: string;    // 资源类型
  resourceId: string | null; // 资源ID
  details: object;         // 详细信息
  ipAddress: string | null; // IP地址
  userAgent: string | null; // 用户代理
  createdAt: Date;
}
```

---

## 错误码说明

| 错误信息 | 说明 | 解决方案 |
|----------|------|----------|
| 未认证 | Token缺失或无效 | 重新登录获取新token |
| 无权访问 | 权限不足 | 联系管理员授权 |
| 用户名已存在 | 注册时用户名重复 | 更换用户名 |
| 用户名或密码错误 | 登录凭证错误 | 检查输入 |
| 记录不存在 | 请求的资源不存在 | 检查ID是否正确 |
| 已提交的记录不能修改 | 尝试修改已提交的记录 | 只能修改草稿状态的记录 |
| 物料不存在 | 创建记录时物料ID无效 | 先上传物料数据 |
| Excel文件为空 | 上传的Excel无数据 | 检查文件内容 |
| 缺少必需字段 | Excel缺少必需列 | 按照模板格式填写 |

---

## 最佳实践

### 1. 认证流程

```javascript
// 1. 登录获取token
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
const { data } = await loginResponse.json();
const token = data.token;

// 2. 使用token访问受保护的接口
const response = await fetch('/api/inventory/records', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 2. 错误处理

```javascript
try {
  const response = await fetch('/api/inventory/records', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const result = await response.json();
  
  if (!result.success) {
    // 处理业务错误
    console.error(result.error);
  } else {
    // 处理成功响应
    console.log(result.data);
  }
} catch (error) {
  // 处理网络错误
  console.error('网络请求失败', error);
}
```

### 3. 分页处理

```javascript
async function fetchAllRecords() {
  let page = 1;
  let allRecords = [];
  
  while (true) {
    const response = await fetch(
      `/api/inventory/records?page=${page}&pageSize=20`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const result = await response.json();
    allRecords = [...allRecords, ...result.data];
    
    if (page >= result.pagination.totalPages) {
      break;
    }
    page++;
  }
  
  return allRecords;
}
```

---

## 版本历史

- **v1.0.0** (2025-11-15): 初始版本，包含基础认证、用户管理、盘点记录、报表统计功能
