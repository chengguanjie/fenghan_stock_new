/**
 * 测试环境设置
 */

import { prisma } from '../src/config/database';

// 测试前清理数据库
beforeAll(async () => {
  // 确保测试数据库连接
  await prisma.$connect();
});

// 每个测试后清理数据
afterEach(async () => {
  // 按依赖顺序删除数据
  await prisma.inventoryRecord.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.passwordHistory.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});
});

// 所有测试完成后断开连接
afterAll(async () => {
  await prisma.$disconnect();
});
