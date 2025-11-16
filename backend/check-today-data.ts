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

async function checkTodayData() {
  try {
    // 获取北京时间的今天日期
    const today = getBeijingToday();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`\n检查今天 (${todayStr}) 上传的所有物料数据\n`);
    
    // 查找今天所有的物料
    const items = await prisma.inventoryItem.findMany({
      where: {
        uploadDate: today,
      },
      select: {
        name: true,
        workshop: true,
        area: true,
        materialName: true,
        uploadedAt: true,
      },
      orderBy: [{ name: 'asc' }, { area: 'asc' }],
    });
    
    if (items.length === 0) {
      console.log('❌ 今天没有上传任何物料数据！');
      console.log('\n可能的原因:');
      console.log('  1. Excel文件上传失败');
      console.log('  2. 后端API报错');
      console.log('  3. 服务器时区问题');
      
      // 检查最近的上传记录
      const recentItems = await prisma.inventoryItem.findMany({
        orderBy: { uploadedAt: 'desc' },
        take: 5,
        select: {
          name: true,
          uploadDate: true,
          uploadedAt: true,
        },
      });
      
      console.log('\n最近5条上传记录:');
      recentItems.forEach((item, index) => {
        console.log(`  ${index + 1}. 姓名: ${item.name}, uploadDate: ${item.uploadDate.toISOString().split('T')[0]}, uploadedAt: ${item.uploadedAt.toISOString()}`);
      });
    } else {
      console.log(`✅ 今天共有 ${items.length} 条物料数据\n`);
      
      // 按姓名分组统计
      const nameGroups = new Map<string, number>();
      items.forEach(item => {
        const count = nameGroups.get(item.name) || 0;
        nameGroups.set(item.name, count + 1);
      });
      
      console.log('按姓名分组统计:');
      Array.from(nameGroups.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, count]) => {
          console.log(`  - ${name}: ${count} 条`);
        });
      
      console.log('\n前10条数据详情:');
      items.slice(0, 10).forEach((item, index) => {
        console.log(`  ${index + 1}. 姓名: ${item.name} | 车间: ${item.workshop} | 区域: ${item.area} | 物料: ${item.materialName}`);
      });
      
      // 检查是否有"薛劲松"
      const hasXue = Array.from(nameGroups.keys()).includes('薛劲松');
      if (!hasXue) {
        console.log('\n⚠️  今天的数据中没有"薛劲松"！');
        console.log('Excel中的姓名列可能不是"薛劲松"，或者上传的Excel不包含该用户。');
      }
    }
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTodayData();
