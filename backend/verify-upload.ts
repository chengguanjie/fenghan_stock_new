import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 获取北京时间的当前日期(零点)
 */
function getBeijingToday(): Date {
  const now = new Date();
  const utcTime = now.getTime();
  const beijingTime = new Date(utcTime + 8 * 60 * 60 * 1000);
  return new Date(Date.UTC(
    beijingTime.getUTCFullYear(),
    beijingTime.getUTCMonth(),
    beijingTime.getUTCDate(),
    0, 0, 0, 0
  ));
}

async function verifyUpload() {
  try {
    const userName = '薛劲松';
    
    // 获取北京时间的今天日期
    const today = getBeijingToday();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`\n验证用户 "${userName}" 的数据 (日期: ${todayStr})\n`);
    
    // 查找今天该用户名对应的物料
    const items = await prisma.inventoryItem.findMany({
      where: {
        name: userName,
        uploadDate: today,
      },
      orderBy: [{ area: 'asc' }, { materialName: 'asc' }],
    });
    
    if (items.length === 0) {
      console.log(`❌ 今天没有 "${userName}" 的物料数据`);
      console.log('\n请检查:');
      console.log('  1. Excel中的"姓名"列是否为"薛劲松"（注意空格和字符）');
      console.log('  2. 是否已成功上传Excel文件');
      console.log('  3. 上传后台是否有错误提示');
    } else {
      console.log(`✅ 找到 ${items.length} 条物料数据\n`);
      console.log('前10条数据:');
      items.slice(0, 10).forEach((item, index) => {
        console.log(`  ${index + 1}. 区域: ${item.area.padEnd(15)} | 物料: ${item.materialName.padEnd(20)} | 单位: ${item.unit}`);
      });
      
      if (items.length > 10) {
        console.log(`  ... 还有 ${items.length - 10} 条数据`);
      }
      
      console.log(`\n✅ "${userName}" 登录后将能看到这 ${items.length} 条物料`);
    }
    
  } catch (error) {
    console.error('验证失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUpload();
