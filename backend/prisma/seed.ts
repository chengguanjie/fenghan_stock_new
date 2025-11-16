import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * 数据库种子脚本
 * 用于初始化数据库数据
 */
async function main() {
  console.log('开始初始化数据库...');

  // 检查是否已有管理员账号
  const existingAdmin = await prisma.user.findFirst({
    include: {
      roles: true,
    },
  });

  if (existingAdmin?.roles.some((role) => role.role === 'admin')) {
    console.log('管理员账号已存在，跳过初始化');
    return;
  }

  // 创建初始管理员账号
  const adminName = process.env.ADMIN_NAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  const adminWorkshop = process.env.ADMIN_WORKSHOP || '管理部门';

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const email = `${adminName}@system.local`;

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: {
        create: {
          name: adminName,
          workshop: adminWorkshop,
          forcePasswordChange: false, // 初始管理员不强制修改密码
        },
      },
      roles: {
        create: {
          role: 'admin',
        },
      },
    },
    include: {
      profile: true,
      roles: true,
    },
  });

  console.log('✅ 管理员账号创建成功：');
  console.log(`   姓名: ${admin.profile?.name}`);
  console.log(`   邮箱: ${admin.email}`);
  console.log(`   密码: ${adminPassword}`);
  console.log(`   车间: ${admin.profile?.workshop}`);
  console.log('\n⚠️  请妥善保管管理员密码，建议首次登录后立即修改！');
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


