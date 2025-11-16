/**
 * 清除所有盘点记录的脚本
 * 
 * 使用方法:
 * 1. 在 backend 目录下运行: npx tsx clear-records.ts
 * 2. 或者: node -r esbuild-register clear-records.ts
 * 
 * 警告: 这会删除所有盘点记录,但保留库存物料数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllRecords() {
  try {
    console.log('开始清除所有盘点记录...');
    
    // 删除所有盘点记录
    const result = await prisma.inventoryRecord.deleteMany({});
    
    console.log(`✅ 成功清除 ${result.count} 条盘点记录`);
    console.log('库存物料数据保持不变');
    
  } catch (error) {
    console.error('❌ 清除失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行清除
clearAllRecords()
  .then(() => {
    console.log('\n清除完成!现在可以重新开始盘点。');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n清除失败:', error);
    process.exit(1);
  });
