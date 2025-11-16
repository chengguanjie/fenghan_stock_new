/**
 * 重置管理员密码
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('重置管理员密码...\n');

    // 查找 admin 用户
    const adminUser = await prisma.user.findFirst({
      where: {
        profile: {
          name: 'admin'
        }
      },
      include: {
        profile: true
      }
    });

    if (!adminUser) {
      console.log('❌ 未找到 admin 用户');
      return;
    }

    // 生成新密码: Admin@2024
    const newPassword = 'Admin@2024';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        passwordHash: hashedPassword
      }
    });

    console.log('✓ 管理员密码已重置');
    console.log('\n新的登录信息:');
    console.log('  姓名: admin');
    console.log('  密码: Admin@2024');
    console.log('\n这是一个更安全的密码,Google 不会再提示数据泄露警告。');
  } catch (error) {
    console.error('重置失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword()
  .catch((error) => {
    console.error('执行失败:', error);
    process.exit(1);
  });
