/**
 * 报表统计服务
 */

import { prisma } from '../config/database';
import { RecordStatus } from '@prisma/client';
import * as XLSX from 'xlsx';

export class ReportService {
  /**
   * 获取汇总统计数据
   */
  static async getSummary(userId?: string) {
    const whereClause = userId ? { userId } : {};

    const [
      totalRecords,
      draftRecords,
      submittedRecords,
      totalUsers,
      totalItems,
    ] = await Promise.all([
      prisma.inventoryRecord.count({ where: whereClause }),
      prisma.inventoryRecord.count({
        where: { ...whereClause, status: RecordStatus.draft },
      }),
      prisma.inventoryRecord.count({
        where: { ...whereClause, status: RecordStatus.submitted },
      }),
      prisma.user.count(),
      prisma.inventoryItem.count(),
    ]);

    // 按车间统计
    const workshopStats = await prisma.inventoryRecord.groupBy({
      by: ['userId'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // 获取用户车间信息
    const userIds = workshopStats.map(stat => stat.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { profile: true },
    });

    const workshopData = workshopStats.map(stat => {
      const user = users.find(u => u.id === stat.userId);
      return {
        workshop: user?.profile?.workshop || '未知',
        count: stat._count.id,
      };
    });

    // 合并相同车间的数据
    const workshopMap = new Map<string, number>();
    workshopData.forEach(item => {
      const current = workshopMap.get(item.workshop) || 0;
      workshopMap.set(item.workshop, current + item.count);
    });

    const workshopSummary = Array.from(workshopMap.entries()).map(([workshop, count]) => ({
      workshop,
      count,
    }));

    return {
      overview: {
        totalRecords,
        draftRecords,
        submittedRecords,
        totalUsers,
        totalItems,
        completionRate: totalRecords > 0 
          ? ((submittedRecords / totalRecords) * 100).toFixed(2) + '%'
          : '0%',
      },
      workshopSummary,
    };
  }

  /**
   * 获取盘点进度统计
   */
  static async getProgress() {
    // 获取所有用户及其盘点进度
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        inventoryRecords: {
          select: {
            status: true,
          },
        },
      },
    });

    const progress = users.map(user => {
      const total = user.inventoryRecords.length;
      const submitted = user.inventoryRecords.filter(
        r => r.status === RecordStatus.submitted
      ).length;
      const draft = total - submitted;

      return {
        userId: user.id,
        name: user.profile?.name || '未知',
        workshop: user.profile?.workshop || '未知',
        total,
        submitted,
        draft,
        completionRate: total > 0 
          ? ((submitted / total) * 100).toFixed(2) + '%'
          : '0%',
      };
    });

    // 按车间分组
    const workshopProgress = new Map<string, {
      workshop: string;
      users: number;
      totalRecords: number;
      submittedRecords: number;
      completionRate: string;
    }>();

    progress.forEach(item => {
      const existing = workshopProgress.get(item.workshop);
      if (existing) {
        existing.users += 1;
        existing.totalRecords += item.total;
        existing.submittedRecords += item.submitted;
      } else {
        workshopProgress.set(item.workshop, {
          workshop: item.workshop,
          users: 1,
          totalRecords: item.total,
          submittedRecords: item.submitted,
          completionRate: '0%',
        });
      }
    });

    // 计算车间完成率
    const workshopData = Array.from(workshopProgress.values()).map(item => ({
      ...item,
      completionRate: item.totalRecords > 0
        ? ((item.submittedRecords / item.totalRecords) * 100).toFixed(2) + '%'
        : '0%',
    }));

    return {
      userProgress: progress,
      workshopProgress: workshopData,
    };
  }

  /**
   * 导出盘点数据为Excel
   */
  static async exportToExcel(userId?: string) {
    const whereClause = userId ? { userId } : {};

    const records = await prisma.inventoryRecord.findMany({
      where: whereClause,
      include: {
        inventoryItem: true,
        user: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 准备Excel数据
    const data = records.map(record => ({
      '盘点人': record.user.profile?.name || '未知',
      '车间': record.user.profile?.workshop || '未知',
      '物料名称': record.inventoryItem.materialName,
      '区域': record.inventoryItem.area,
      '单位': record.inventoryItem.unit,
      '实际数量': record.actualQuantity.toString(),
      '状态': record.status === RecordStatus.submitted ? '已提交' : '草稿',
      '记录时间': record.recordedAt.toLocaleString('zh-CN'),
      '提交时间': record.submittedAt?.toLocaleString('zh-CN') || '未提交',
    }));

    // 创建工作簿
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '盘点记录');

    // 设置列宽
    const colWidths = [
      { wch: 10 }, // 盘点人
      { wch: 15 }, // 车间
      { wch: 30 }, // 物料名称
      { wch: 15 }, // 区域
      { wch: 8 },  // 单位
      { wch: 12 }, // 实际数量
      { wch: 10 }, // 状态
      { wch: 20 }, // 记录时间
      { wch: 20 }, // 提交时间
    ];
    worksheet['!cols'] = colWidths;

    // 生成Excel buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return buffer;
  }
}
