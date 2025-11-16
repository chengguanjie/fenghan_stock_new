/**
 * 检查数据库中的用户账号
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('检查数据库中的用户账号...\n');

    const users = await prisma.user.findMany({
      include: {
        profile: true,
        roles: true,
      },
    });

    if (users.length === 0) {
      console.log('❌ 数据库中没有用户账号！');
      console.log('\n需要创建管理员账号。请运行: npm run seed');
      return;
    }

    console.log(`✓ 找到 ${users.length} 个用户账号:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. 用户信息:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   姓名: ${user.profile?.name || '未设置'}`);
      console.log(`   车间: ${user.profile?.workshop || '未设置'}`);
      console.log(`   角色: ${user.roles.map(r => r.role).join(', ') || '无角色'}`);
      console.log(`   需要修改密码: ${user.profile?.forcePasswordChange ? '是' : '否'}`);
      console.log('');
    });

    console.log('\n登录提示:');
    console.log('- 使用 "姓名" 字段作为用户名登录');
    console.log('- 如果是首次登录或忘记密码,请联系管理员重置');
  } catch (error) {
    console.error('检查失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers()
  .catch((error) => {
    console.error('执行失败:', error);
    process.exit(1);
  });
