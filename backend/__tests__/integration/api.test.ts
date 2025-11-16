/**
 * API 集成测试
 */

import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../../src/utils/jwt';
import { AppRole } from '@prisma/client';

describe('API Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let inventoryItemId: string;

  // 测试前创建测试用户
  beforeAll(async () => {
    // 清理数据库以确保干净的测试环境
    await prisma.inventoryRecord.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.passwordHistory.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.user.deleteMany({});

    // 创建管理员用户
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        passwordHash: adminPasswordHash,
        profile: {
          create: {
            name: '测试管理员',
            workshop: '管理部门',
          },
        },
        roles: {
          create: {
            role: 'admin',
          },
        },
      },
    });

    // 创建普通用户
    const userPasswordHash = await bcrypt.hash('user123', 10);
    await prisma.user.create({
      data: {
        email: 'user@test.com',
        passwordHash: userPasswordHash,
        profile: {
          create: {
            name: '测试用户',
            workshop: '生产车间',
          },
        },
        roles: {
          create: {
            role: 'viewer',
          },
        },
      },
    });

    // 直接生成token以避免HTTP请求导致的超时
    adminToken = generateAccessToken({
      userId: admin.id,
      email: admin.email,
      name: '测试管理员',
      roles: ['admin'] as AppRole[],
    });

    const user = await prisma.user.findUnique({
      where: { email: 'user@test.com' },
    });

    userToken = generateAccessToken({
      userId: user!.id,
      email: user!.email,
      name: '测试用户',
      roles: ['viewer'] as AppRole[],
    });

    // 创建测试物料
    const item = await prisma.inventoryItem.create({
      data: {
        name: '张三',
        workshop: '生产车间',
        area: 'A区',
        materialName: '原料A',
        unit: 'kg',
        uploadedBy: admin.id,
        uploadDate: new Date(),
      },
    });
    inventoryItemId = item.id;
  });

  describe('Health Check', () => {
    it('应该返回健康状态', async () => {
      const res = await request(app).get('/health');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('运行正常');
    });
  });

  describe('Authentication', () => {
    it('应该成功登录', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'user123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    });

    it('应该拒绝错误的密码', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('应该成功修改密码', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ oldPassword: 'user123', newPassword: 'Newpassword123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // 恢复密码以便后续测试
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ oldPassword: 'Newpassword123', newPassword: 'user123' });
    });
  });

  describe('Inventory Records', () => {
    let recordId: string;

    it('应该创建盘点记录', async () => {
      const res = await request(app)
        .post('/api/inventory/records')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          inventoryItemId,
          actualQuantity: 100,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(Number(res.body.data.actualQuantity)).toBe(100);
      expect(res.body.data.status).toBe('draft');
      
      recordId = res.body.data.id;
    });

    it('应该获取盘点记录列表', async () => {
      const res = await request(app)
        .get('/api/inventory/records')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('应该获取单个盘点记录详情', async () => {
      const res = await request(app)
        .get(`/api/inventory/records/${recordId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(recordId);
    });

    it('应该更新盘点记录', async () => {
      const res = await request(app)
        .put(`/api/inventory/records/${recordId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ actualQuantity: 150 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Number(res.body.data.actualQuantity)).toBe(150);
    });

    it('应该提交盘点记录', async () => {
      const res = await request(app)
        .post(`/api/inventory/records/${recordId}/submit`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('submitted');
      expect(res.body.data.submittedAt).toBeDefined();
    });

    it('不应该修改已提交的记录', async () => {
      const res = await request(app)
        .put(`/api/inventory/records/${recordId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ actualQuantity: 200 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('管理员应该能删除已提交的记录', async () => {
      const res = await request(app)
        .delete(`/api/inventory/records/${recordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Batch Operations', () => {
    it('应该批量提交盘点记录', async () => {
      // 创建多个草稿记录
      const record1 = await request(app)
        .post('/api/inventory/records')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ inventoryItemId, actualQuantity: 50 });

      const record2 = await request(app)
        .post('/api/inventory/records')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ inventoryItemId, actualQuantity: 75 });

      const recordIds = [record1.body.data.id, record2.body.data.id];

      // 批量提交
      const res = await request(app)
        .post('/api/inventory/records/batch/submit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ recordIds });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // 由于同一物料的草稿记录会被更新而不是创建新记录，所以实际只有1条记录
      expect(res.body.data.count).toBe(1);
    });
  });

  describe('User Management (Admin Only)', () => {
    it('管理员应该能获取用户列表', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('普通用户不应该能获取用户列表', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('管理员应该能创建新管理员', async () => {
      const res = await request(app)
        .post('/api/users/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newadmin@test.com',
          password: 'admin123',
          name: '新管理员',
          workshop: '管理部门',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roles).toContain('admin');
    });
  });

  describe('Reports', () => {
    it('应该获取统计报表', async () => {
      const res = await request(app)
        .get('/api/reports/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRecords).toBeDefined();
      expect(res.body.data.draftRecords).toBeDefined();
      expect(res.body.data.submittedRecords).toBeDefined();
    });
  });

  describe('Authorization', () => {
    it('未认证请求应该被拒绝', async () => {
      const res = await request(app).get('/api/inventory/records');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('无效token应该被拒绝', async () => {
      const res = await request(app)
        .get('/api/inventory/records')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('API Documentation', () => {
    it('应该能访问Swagger文档', async () => {
      const res = await request(app).get('/api-docs/');

      expect(res.status).toBe(200);
    });
  });
});
