import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserItems() {
  try {
    const userName = '薛劲松';
    
    console.log(`\n查询用户 "${userName}" 的数据...\n`);
    
    // 1. 查找用户
    const user = await prisma.user.findFirst({
      where: {
        profile: {
          name: userName
        }
      },
      include: {
        profile: true,
        roles: true,
      }
    });
    
    if (!user) {
      console.log(`❌ 未找到用户: ${userName}`);
      return;
    }
    
    console.log('✅ 找到用户:');
    console.log(`  ID: ${user.id}`);
    console.log(`  邮箱: ${user.email}`);
    console.log(`  姓名: ${user.profile?.name}`);
    console.log(`  车间: ${user.profile?.workshop}`);
    console.log(`  角色: ${user.roles.map(r => r.role).join(', ')}`);
    
    // 2. 获取当天日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`\n当前日期: ${today.toISOString().split('T')[0]}`);
    
    // 3. 查找该用户名对应的当天物料
    const items = await prisma.inventoryItem.findMany({
      where: {
        name: userName,
        uploadDate: today,
      },
      orderBy: [{ area: 'asc' }, { materialName: 'asc' }],
    });
    
    console.log(`\n📦 当天物料数量: ${items.length}`);
    
    if (items.length === 0) {
      console.log(`\n⚠️  没有找到姓名为 "${userName}" 且上传日期为当天的物料数据!`);
      
      // 查找该用户名对应的所有日期的物料
      const allItems = await prisma.inventoryItem.findMany({
        where: {
          name: userName,
        },
        orderBy: [{ uploadDate: 'desc' }],
        take: 10,
      });
      
      console.log(`\n该用户名在其他日期的物料数量: ${allItems.length}`);
      if (allItems.length > 0) {
        console.log('\n最近的物料记录:');
        allItems.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.materialName} - 上传日期: ${item.uploadDate.toISOString().split('T')[0]}`);
        });
      }
      
      // 查找当天所有的物料(不限姓名)
      const todayItems = await prisma.inventoryItem.findMany({
        where: {
          uploadDate: today,
        },
        select: {
          name: true,
        },
        distinct: ['name'],
      });
      
      console.log(`\n当天上传的物料对应的姓名列表 (共${todayItems.length}个):`);
      todayItems.forEach(item => {
        console.log(`  - ${item.name}`);
      });
      
    } else {
      console.log('\n前5条物料:');
      items.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. 区域: ${item.area}, 物料: ${item.materialName}, 单位: ${item.unit}`);
      });
      
      // 4. 查找用户的盘点记录
      const records = await prisma.inventoryRecord.findMany({
        where: {
          userId: user.id,
        },
      });
      
      console.log(`\n📝 该用户的盘点记录数量: ${records.length}`);
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserItems();
