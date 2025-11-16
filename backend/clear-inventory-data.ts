/**
 * 清除库存数据脚本
 * 用于清空 inventory_items 和 inventory_records 表的数据
 * 保留用户账号和其他系统数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearInventoryData() {
  try {
    console.log('开始清除库存数据...');

    // 1. 清除盘点记录
    const deletedRecords = await prisma.inventoryRecord.deleteMany({});
    console.log(`✓ 已删除 ${deletedRecords.count} 条盘点记录`);

    // 2. 清除库存物料
    const deletedItems = await prisma.inventoryItem.deleteMany({});
    console.log(`✓ 已删除 ${deletedItems.count} 条库存物料`);

    console.log('\n清除完成！数据库已准备好重新上传 Excel 数据。');
    console.log('用户账号和其他系统数据已保留。');
  } catch (error) {
    console.error('清除数据失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行清除
clearInventoryData()
  .catch((error) => {
    console.error('执行失败:', error);
    process.exit(1);
  });
