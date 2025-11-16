/**
 * 测试服务器 - 用于演示API自动化测试
 * 不依赖数据库，使用内存数据
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

// 中间件
app.use(cors());
app.use(express.json());

// 内存数据存储
let users = [];
let inventoryRecords = [];
let currentUserId = 1;
let currentRecordId = 1;

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '凤韩食品库存盘点系统 API 运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0-test'
  });
});

// 用户注册
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, workshop } = req.body;
  
  if (!email || !password || !name || !workshop) {
    return res.status(400).json({
      success: false,
      error: '缺少必需字段'
    });
  }
  
  // 检查邮箱是否已存在
  if (users.find(u => u.email === email)) {
    return res.status(400).json({
      success: false,
      error: '邮箱已被注册'
    });
  }
  
  const user = {
    id: currentUserId++,
    email,
    name,
    workshop,
    roles: ['viewer'],
    createdAt: new Date().toISOString()
  };
  
  users.push(user);
  
  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      user,
      accessToken: `test-token-${user.id}`,
      refreshToken: `refresh-token-${user.id}`
    }
  });
});

// 用户登录
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: '缺少邮箱或密码'
    });
  }
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: '邮箱或密码错误'
    });
  }
  
  res.json({
    success: true,
    message: '登录成功',
    data: {
      user,
      accessToken: `test-token-${user.id}`,
      refreshToken: `refresh-token-${user.id}`
    }
  });
});

// 获取用户列表
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: users,
    pagination: {
      page: 1,
      pageSize: 20,
      total: users.length,
      totalPages: 1
    }
  });
});

// 创建盘点记录
app.post('/api/inventory/records', (req, res) => {
  const { inventoryItemId, actualQuantity } = req.body;
  
  if (!inventoryItemId || actualQuantity === undefined) {
    return res.status(400).json({
      success: false,
      error: '缺少必需字段'
    });
  }
  
  const record = {
    id: currentRecordId++,
    inventoryItemId,
    actualQuantity,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  inventoryRecords.push(record);
  
  res.status(201).json({
    success: true,
    message: '盘点记录创建成功',
    data: record
  });
});

// 获取盘点记录列表
app.get('/api/inventory/records', (req, res) => {
  res.json({
    success: true,
    data: inventoryRecords,
    pagination: {
      page: 1,
      pageSize: 20,
      total: inventoryRecords.length,
      totalPages: 1
    }
  });
});

// 提交盘点记录
app.post('/api/inventory/records/:id/submit', (req, res) => {
  const { id } = req.params;
  const record = inventoryRecords.find(r => r.id === parseInt(id));
  
  if (!record) {
    return res.status(404).json({
      success: false,
      error: '记录不存在'
    });
  }
  
  record.status = 'submitted';
  record.submittedAt = new Date().toISOString();
  
  res.json({
    success: true,
    message: '记录提交成功',
    data: record
  });
});

// 获取汇总数据
app.get('/api/reports/summary', (req, res) => {
  const totalRecords = inventoryRecords.length;
  const submittedRecords = inventoryRecords.filter(r => r.status === 'submitted').length;
  const draftRecords = totalRecords - submittedRecords;
  
  res.json({
    success: true,
    data: {
      overview: {
        totalRecords,
        draftRecords,
        submittedRecords,
        totalUsers: users.length,
        completionRate: totalRecords > 0 
          ? ((submittedRecords / totalRecords) * 100).toFixed(2) + '%'
          : '0%'
      }
    }
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 测试服务器运行在端口 ${PORT}`);
  console.log(`📍 健康检查: http://localhost:${PORT}/health`);
  console.log(`📍 API 基础路径: http://localhost:${PORT}/api`);
  console.log('\n✅ 准备就绪，可以开始自动化测试！\n');
});
