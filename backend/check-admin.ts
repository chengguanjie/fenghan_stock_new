import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('查询所有用户和角色...\n');
    
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        roles: true,
      },
    });

    if (users.length === 0) {
      console.log('⚠️  数据库中没有任何用户！');
      return;
    }

    console.log(`找到 ${users.length} 个用户：\n`);

    users.forEach((user) => {
      console.log('-------------------');
      console.log(`用户ID: ${user.id}`);
      console.log(`邮箱: ${user.email}`);
      console.log(`姓名: ${user.profile?.name || '(无)'}`);
      console.log(`车间: ${user.profile?.workshop || '(无)'}`);
      console.log(`角色: ${user.roles.map(r => r.role).join(', ') || '(无)'}`);
      console.log(`强制修改密码: ${user.profile?.forcePasswordChange ? '是' : '否'}`);
      console.log(`创建时间: ${user.createdAt}`);
    });

    console.log('\n-------------------');
    const adminUsers = users.filter(u => u.roles.some(r => r.role === 'admin'));
    console.log(`\n✅ 管理员账号数量: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log('\n管理员账号信息：');
      adminUsers.forEach(admin => {
        console.log(`  - 姓名: ${admin.profile?.name}, 邮箱: ${admin.email}`);
      });
    }

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
