import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkInventoryStats() {
  try {
    console.log('\n检查盘点记录统计信息...\n');

    // 获取所有物料
    const allItems = await prisma.inventoryItem.findMany({
      orderBy: { uploadDate: 'desc' },
    });

    console.log(`总物料数: ${allItems.length}\n`);

    // 获取所有盘点记录
    const allRecords = await prisma.inventoryRecord.findMany({
      include: {
        inventoryItem: true,
        user: {
          include: { profile: true },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });

    console.log(`总盘点记录数: ${allRecords.length}\n`);

    // 按状态统计
    const draftRecords = allRecords.filter((r) => r.status === 'draft');
    const submittedRecords = allRecords.filter((r) => r.status === 'submitted');

    console.log(`草稿记录数: ${draftRecords.length}`);
    console.log(`已提交记录数: ${submittedRecords.length}\n`);

    // 按用户统计
    const recordsByUser = new Map<string, { draft: number; submitted: number }>();
    for (const record of allRecords) {
      const userName = record.user.profile?.name || 'Unknown';
      if (!recordsByUser.has(userName)) {
        recordsByUser.set(userName, { draft: 0, submitted: 0 });
      }
      const stats = recordsByUser.get(userName)!;
      if (record.status === 'draft') {
        stats.draft++;
      } else {
        stats.submitted++;
      }
    }

    console.log('按用户统计:');
    for (const [userName, stats] of recordsByUser.entries()) {
      console.log(
        `  ${userName}: 草稿 ${stats.draft} 条, 已提交 ${stats.submitted} 条`
      );
    }

    // 检查重复记录(同一个物料有多条记录)
    console.log('\n检查重复记录...');
    const recordsByItem = new Map<string, typeof allRecords>();
    for (const record of allRecords) {
      const itemId = record.inventoryItemId;
      if (!recordsByItem.has(itemId)) {
        recordsByItem.set(itemId, []);
      }
      recordsByItem.get(itemId)!.push(record);
    }

    let duplicateCount = 0;
    for (const [itemId, records] of recordsByItem.entries()) {
      if (records.length > 1) {
        duplicateCount++;
        const item = records[0].inventoryItem;
        console.log(
          `\n  物料 "${item.materialName}" (${item.materialCode}) 有 ${records.length} 条记录:`
        );
        for (const record of records) {
          console.log(
            `    - 状态: ${record.status}, 数量: ${record.actualQuantity}, 记录时间: ${record.recordedAt.toLocaleString('zh-CN')}, 提交时间: ${record.submittedAt?.toLocaleString('zh-CN') || '未提交'}, 用户: ${record.user.profile?.name}`
          );
        }
      }
    }

    if (duplicateCount === 0) {
      console.log('  没有发现重复记录');
    } else {
      console.log(`\n  共发现 ${duplicateCount} 个物料有多条记录`);
    }

    // 统计唯一物料的盘点情况
    console.log('\n统计唯一物料的盘点情况...');
    let countedItems = 0;
    let uncountedItems = 0;

    for (const item of allItems) {
      const records = recordsByItem.get(item.id) || [];
      const hasSubmitted = records.some((r) => r.status === 'submitted');
      if (hasSubmitted) {
        countedItems++;
      } else {
        uncountedItems++;
      }
    }

    console.log(`已盘点物料: ${countedItems}`);
    console.log(`未盘点物料: ${uncountedItems}`);

    console.log('\n检查完成!');
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInventoryStats();
