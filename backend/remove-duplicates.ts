import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 清理数据库中的重复物料项
 * 基于 (name, area, materialCode) 组合识别重复项
 * 保留最早创建的记录,删除其他重复项
 */
async function removeDuplicates() {
  try {
    console.log('开始查找重复的物料项...');

    // 获取所有物料项
    const allItems = await prisma.inventoryItem.findMany({
      orderBy: { uploadedAt: 'asc' }, // 按上传时间升序,保留最早的
    });

    console.log(`总共有 ${allItems.length} 条物料记录`);

    // 使用 Map 来识别重复项
    const uniqueItems = new Map<string, string>(); // key -> id
    const duplicateIds: string[] = [];

    for (const item of allItems) {
      const key = `${item.name}|${item.area}|${item.materialCode}`;
      
      if (uniqueItems.has(key)) {
        // 这是重复项,记录其 ID
        duplicateIds.push(item.id);
        console.log(`发现重复: ${item.name} - ${item.area} - ${item.materialCode} (ID: ${item.id})`);
      } else {
        // 这是第一次出现,保留它
        uniqueItems.set(key, item.id);
      }
    }

    console.log(`\n找到 ${duplicateIds.length} 条重复记录`);

    if (duplicateIds.length === 0) {
      console.log('没有重复数据,无需清理');
      return;
    }

    // 确认是否要删除
    console.log('\n准备删除以下重复记录的 ID:');
    console.log(duplicateIds.join(', '));
    
    // 删除重复项(先删除关联的盘点记录)
    console.log('\n开始删除关联的盘点记录...');
    const deletedRecords = await prisma.inventoryRecord.deleteMany({
      where: {
        inventoryItemId: {
          in: duplicateIds,
        },
      },
    });
    console.log(`已删除 ${deletedRecords.count} 条关联的盘点记录`);

    // 删除重复的物料项
    console.log('\n开始删除重复的物料项...');
    const deletedItems = await prisma.inventoryItem.deleteMany({
      where: {
        id: {
          in: duplicateIds,
        },
      },
    });
    console.log(`已删除 ${deletedItems.count} 条重复的物料项`);

    console.log('\n✅ 清理完成!');
    console.log(`保留了 ${uniqueItems.size} 条唯一记录`);
  } catch (error) {
    console.error('清理失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行清理脚本
removeDuplicates()
  .then(() => {
    console.log('脚本执行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
