import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  console.log('创建测试用户...');

  const name = '薛劲松';
  const password = '123456';
  const workshop = '测试车间';

  // 检查用户是否已存在
  const existingUser = await prisma.user.findFirst({
    where: {
      profile: {
        name: name
      }
    }
  });

  if (existingUser) {
    console.log('用户已存在，删除旧用户...');
    await prisma.user.delete({
      where: { id: existingUser.id }
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const email = `${name}@test.local`;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: {
        create: {
          name,
          workshop,
          forcePasswordChange: false,
        },
      },
      roles: {
        create: {
          role: 'viewer',
        },
      },
    },
    include: {
      profile: true,
      roles: true,
    },
  });

  console.log('✅ 测试用户创建成功：');
  console.log(`   姓名: ${user.profile?.name}`);
  console.log(`   邮箱: ${user.email}`);
  console.log(`   密码: ${password}`);
  console.log(`   车间: ${user.profile?.workshop}`);
}

createTestUser()
  .catch((e) => {
    console.error('❌ 创建失败：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
