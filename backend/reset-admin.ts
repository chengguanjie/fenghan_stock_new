import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdmin() {
  try {
    const adminEmail = 'admin';
    const adminPassword = 'admin123456';
    
    console.log('\n重置管理员账号...\n');
    
    // 查找是否存在该邮箱的用户
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      include: {
        profile: true,
        roles: true,
      },
    });
    
    // 生成密码哈希
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    if (adminUser) {
      // 更新现有管理员账号
      console.log('找到现有管理员账号，正在更新...');
      
      // 更新密码
      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          passwordHash: passwordHash,
        },
      });
      
      // 更新或创建 Profile
      if (adminUser.profile) {
        await prisma.profile.update({
          where: { userId: adminUser.id },
          data: {
            name: 'admin',
            workshop: '管理部门',
            forcePasswordChange: false,
          },
        });
      } else {
        await prisma.profile.create({
          data: {
            userId: adminUser.id,
            name: 'admin',
            workshop: '管理部门',
            forcePasswordChange: false,
          },
        });
      }
      
      // 确保有admin角色
      const hasAdminRole = adminUser.roles.some(r => r.role === 'admin');
      if (!hasAdminRole) {
        await prisma.userRole.create({
          data: {
            userId: adminUser.id,
            role: 'admin',
          },
        });
      }
      
      console.log('✅ 管理员账号已更新');
    } else {
      // 创建新的管理员账号
      console.log('创建新的管理员账号...');
      
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash: passwordHash,
          profile: {
            create: {
              name: 'admin',
              workshop: '管理部门',
              forcePasswordChange: false,
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
      
      console.log('✅ 管理员账号已创建');
    }
    
    console.log('\n管理员登录信息:');
    console.log('  邮箱: admin');
    console.log('  密码: admin123456');
    console.log(`  用户ID: ${adminUser.id}`);
    console.log(`  姓名: ${adminUser.profile?.name}`);
    console.log(`  车间: ${adminUser.profile?.workshop}`);
    console.log(`  角色: ${adminUser.roles.map(r => r.role).join(', ')}`);
    console.log('\n✅ 管理员账号已准备就绪！\n');
    
  } catch (error) {
    console.error('重置失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdmin();
