import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkInventory() {
  console.log('检查库存数据...\n');
  
  // 检查库存项目总数
  const itemCount = await prisma.inventoryItem.count();
  console.log(`库存项目总数: ${itemCount}`);
  
  // 检查用户的盘点记录
  const user = await prisma.user.findFirst({
    where: {
      profile: {
        name: '薛劲松'
      }
    },
    include: {
      profile: true
    }
  });
  
  if (!user) {
    console.log('用户不存在');
    return;
  }
  
  console.log(`\n用户ID: ${user.id}`);
  console.log(`用户名: ${user.profile?.name}`);
  
  // 检查该用户的所有记录
  const allRecords = await prisma.inventoryRecord.findMany({
    where: {
      userId: user.id
    },
    include: {
      inventoryItem: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`\n用户的盘点记录总数: ${allRecords.length}`);
  
  // 按状态分组
  const draftRecords = allRecords.filter(r => r.status === 'draft');
  const submittedRecords = allRecords.filter(r => r.status === 'submitted');
  
  console.log(`草稿状态: ${draftRecords.length}`);
  console.log(`已提交状态: ${submittedRecords.length}`);
  
  if (draftRecords.length > 0) {
    console.log('\n草稿记录:');
    draftRecords.slice(0, 5).forEach(r => {
      console.log(`  - ${r.inventoryItem.materialName}: ${r.actualQuantity} (${r.id})`);
    });
  }
  
  if (submittedRecords.length > 0) {
    console.log('\n已提交记录:');
    submittedRecords.slice(0, 5).forEach(r => {
      console.log(`  - ${r.inventoryItem.materialName}: ${r.actualQuantity} (${r.id})`);
    });
  }
}

checkInventory()
  .catch((e) => {
    console.error('❌ 检查失败：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
