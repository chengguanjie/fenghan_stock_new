import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecords() {
  const recordIds = ["86180bb9-bf66-4872-82f7-b25c5b2c1b92", "ba4bd9bd-a369-40e2-a224-0557a3e64dcf"];
  
  console.log('检查记录状态...');
  
  const records = await prisma.inventoryRecord.findMany({
    where: {
      id: { in: recordIds }
    },
    include: {
      inventoryItem: true,
      user: {
        include: { profile: true }
      }
    }
  });
  
  console.log(`\n找到 ${records.length} 条记录:`);
  records.forEach(r => {
    console.log(`\nID: ${r.id}`);
    console.log(`物料: ${r.inventoryItem.materialName}`);
    console.log(`用户: ${r.user.profile?.name}`);
    console.log(`数量: ${r.actualQuantity}`);
    console.log(`状态: ${r.status}`);
    console.log(`创建时间: ${r.createdAt}`);
    console.log(`提交时间: ${r.submittedAt}`);
  });
  
  // 检查是否有草稿状态的记录
  const draftRecords = await prisma.inventoryRecord.findMany({
    where: {
      id: { in: recordIds },
      status: 'draft'
    }
  });
  
  console.log(`\n草稿状态记录数: ${draftRecords.length}`);
}

checkRecords()
  .catch((e) => {
    console.error('❌ 检查失败：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
