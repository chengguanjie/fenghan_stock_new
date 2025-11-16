/**
 * 盘点记录服务
 */

import { prisma } from '../config/database';
import { RecordStatus } from '@prisma/client';
import { logAudit } from '../utils/auditLog';
import * as XLSX from 'xlsx';

/**
 * 获取北京时间的当前日期(零点)
 * 北京时间 = UTC+8
 */
function getBeijingToday(): Date {
  const now = new Date();
  // 获取UTC时间戳
  const utcTime = now.getTime();
  // 加8小时得到北京时间
  const beijingTime = new Date(utcTime + 8 * 60 * 60 * 1000);
  // 提取年月日，构造零点时刻的Date对象
  return new Date(Date.UTC(
    beijingTime.getUTCFullYear(),
    beijingTime.getUTCMonth(),
    beijingTime.getUTCDate(),
    0, 0, 0, 0
  ));
}

export interface CreateInventoryRecordData {
  inventoryItemId: string;
  actualQuantity: number;
}

export interface UpdateInventoryRecordData {
  actualQuantity?: number;
  status?: RecordStatus;
}

export interface InventoryRecordQuery {
  userId?: string;
  status?: RecordStatus;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

export class InventoryService {
  /**
   * 创建盘点记录
   */
  static async createRecord(userId: string, data: CreateInventoryRecordData) {
    // 验证物料是否存在
    const item = await prisma.inventoryItem.findUnique({
      where: { id: data.inventoryItemId },
    });

    if (!item) {
      throw new Error('物料不存在');
    }

    // 检查是否已有该物料的已提交记录
    const existingSubmitted = await prisma.inventoryRecord.findFirst({
      where: {
        userId,
        inventoryItemId: data.inventoryItemId,
        status: RecordStatus.submitted,
      },
    });

    if (existingSubmitted) {
      throw new Error('该物料已经盘点并提交过,不能重复盘点');
    }

    // 检查是否已有该物料的草稿记录
    const existingDraft = await prisma.inventoryRecord.findFirst({
      where: {
        userId,
        inventoryItemId: data.inventoryItemId,
        status: RecordStatus.draft,
      },
    });

    if (existingDraft) {
      // 更新现有草稿
      const updated = await prisma.inventoryRecord.update({
        where: { id: existingDraft.id },
        data: {
          actualQuantity: data.actualQuantity,
          updatedAt: new Date(),
        },
        include: {
          inventoryItem: true,
          user: {
            include: { profile: true },
          },
        },
      });

      await logAudit({
        userId,
        action: 'inventory_record_updated',
        resourceType: 'inventory_record',
        resourceId: updated.id,
        details: {
          inventoryItemId: data.inventoryItemId,
          actualQuantity: data.actualQuantity,
        },
      });

      return updated;
    }

    // 创建新记录
    const record = await prisma.inventoryRecord.create({
      data: {
        userId,
        inventoryItemId: data.inventoryItemId,
        actualQuantity: data.actualQuantity,
        status: RecordStatus.draft,
      },
      include: {
        inventoryItem: true,
        user: {
          include: { profile: true },
        },
      },
    });

    await logAudit({
      userId,
      action: 'inventory_record_created',
      resourceType: 'inventory_record',
      resourceId: record.id,
      details: {
        inventoryItemId: data.inventoryItemId,
        actualQuantity: data.actualQuantity,
      },
    });

    return record;
  }

  /**
   * 获取盘点记录列表
   */
  static async getRecords(query: InventoryRecordQuery) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    interface WhereClause {
      userId?: string;
      status?: RecordStatus;
      recordedAt?: {
        gte?: Date;
        lte?: Date;
      };
    }

    const where: WhereClause = {};
    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.status) {
      where.status = query.status;
    }
    
    // 添加日期范围过滤
    if (query.startDate || query.endDate) {
      where.recordedAt = {};
      if (query.startDate) {
        const startDate = new Date(query.startDate);
        startDate.setHours(0, 0, 0, 0);
        where.recordedAt.gte = startDate;
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.recordedAt.lte = endDate;
      }
    }

    const [records, total] = await Promise.all([
      prisma.inventoryRecord.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          inventoryItem: true,
          user: {
            include: { profile: true },
          },
        },
        orderBy: { recordedAt: 'desc' },
      }),
      prisma.inventoryRecord.count({ where }),
    ]);

    return {
      records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取当前用户的物料及其盘点记录
   * 用于前端 Record 页面按姓名加载库存项目
   */
  static async getUserItemsWithRecords(userId: string) {
    // 根据 userId 找到用户姓名
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('未找到用户资料');
    }

    // 获取北京时间的当天日期
    const today = getBeijingToday();
    
    // 查找该姓名对应的当天上传的所有物料
    const items = await prisma.inventoryItem.findMany({
      where: { 
        name: profile.name,
        uploadDate: today, // 只查询当天的数据
      },
      orderBy: [{ area: 'asc' }, { materialName: 'asc' }],
    });

    if (items.length === 0) {
      return [];
    }

    // 查找当前用户对这些物料已有的盘点记录
    const records = await prisma.inventoryRecord.findMany({
      where: {
        userId,
        inventoryItemId: { in: items.map((item) => item.id) },
      },
    });

    const recordMap = new Map<string, (typeof records)[number]>();
    records.forEach((record) => {
      recordMap.set(record.inventoryItemId, record);
    });

    // 组合返回结构，方便前端直接使用
    return items.map((item) => {
      const record = recordMap.get(item.id);
      return {
        itemId: item.id,
        area: item.area,
        materialCode: item.materialCode,
        materialName: item.materialName,
        unit: item.unit,
        recordId: record?.id ?? null,
        actualQuantity: record?.actualQuantity ?? null,
        status: record?.status ?? null,
      };
    });
  }

  /**
   * 获取单个盘点记录详情
   */
  static async getRecordById(id: string, userId?: string) {
    const record = await prisma.inventoryRecord.findUnique({
      where: { id },
      include: {
        inventoryItem: true,
        user: {
          include: { profile: true },
        },
      },
    });

    if (!record) {
      throw new Error('记录不存在');
    }

    // 非管理员只能查看自己的记录
    if (userId && record.userId !== userId) {
      throw new Error('无权访问此记录');
    }

    return record;
  }

  /**
   * 更新盘点记录
   */
  static async updateRecord(
    id: string,
    userId: string,
    data: UpdateInventoryRecordData
  ) {
    const record = await prisma.inventoryRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new Error('记录不存在');
    }

    if (record.userId !== userId) {
      throw new Error('无权修改此记录');
    }

    if (record.status === RecordStatus.submitted) {
      throw new Error('已提交的记录不能修改');
    }

    const updated = await prisma.inventoryRecord.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        inventoryItem: true,
        user: {
          include: { profile: true },
        },
      },
    });

    await logAudit({
      userId,
      action: 'inventory_record_updated',
      resourceType: 'inventory_record',
      resourceId: id,
      details: data,
    });

    return updated;
  }

  /**
   * 删除盘点记录
   */
  static async deleteRecord(id: string, userId: string, isAdmin: boolean) {
    const record = await prisma.inventoryRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new Error('记录不存在');
    }

    // 非管理员只能删除自己的草稿
    if (!isAdmin) {
      if (record.userId !== userId) {
        throw new Error('无权删除此记录');
      }
      if (record.status === RecordStatus.submitted) {
        throw new Error('已提交的记录不能删除');
      }
    }

    await prisma.inventoryRecord.delete({
      where: { id },
    });

    await logAudit({
      userId,
      action: 'inventory_record_deleted',
      resourceType: 'inventory_record',
      resourceId: id,
      details: { deletedRecordId: id },
    });

    return { success: true };
  }

  /**
   * 提交盘点记录
   */
  static async submitRecord(id: string, userId: string) {
    const record = await prisma.inventoryRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new Error('记录不存在');
    }

    if (record.userId !== userId) {
      throw new Error('无权提交此记录');
    }

    if (record.status === RecordStatus.submitted) {
      throw new Error('记录已提交');
    }

    const updated = await prisma.inventoryRecord.update({
      where: { id },
      data: {
        status: RecordStatus.submitted,
        submittedAt: new Date(),
      },
      include: {
        inventoryItem: true,
        user: {
          include: { profile: true },
        },
      },
    });

    await logAudit({
      userId,
      action: 'inventory_record_submitted',
      resourceType: 'inventory_record',
      resourceId: id,
      details: { submittedAt: updated.submittedAt },
    });

    return updated;
  }

  /**
   * 批量提交盘点记录
   */
  static async submitMultipleRecords(recordIds: string[], userId: string) {
    // 去重recordIds（防止用户重复选择同一条记录）
    const uniqueRecordIds = [...new Set(recordIds)];

    // 查找所有记录（不限制状态）
    const allRecords = await prisma.inventoryRecord.findMany({
      where: {
        id: { in: uniqueRecordIds },
        userId,
      },
    });

    // 分离草稿状态和已提交状态的记录
    const draftRecords = allRecords.filter(r => r.status === RecordStatus.draft);
    const submittedRecords = allRecords.filter(r => r.status === RecordStatus.submitted);

    // 检查是否有不存在或不属于用户的记录
    if (allRecords.length !== uniqueRecordIds.length) {
      const foundIds = allRecords.map(r => r.id);
      const missingIds = uniqueRecordIds.filter(id => !foundIds.includes(id));
      throw new Error(`找到 ${allRecords.length} 条记录，期望 ${uniqueRecordIds.length} 条。不存在的记录ID: ${missingIds.join(', ')}`);
    }

    // 如果所有记录都已提交，直接返回成功
    if (draftRecords.length === 0) {
      return {
        count: 0,
        alreadySubmitted: submittedRecords.length,
      };
    }

    // 只更新草稿状态的记录
    const draftRecordIds = draftRecords.map(r => r.id);
    await prisma.inventoryRecord.updateMany({
      where: {
        id: { in: draftRecordIds },
        status: RecordStatus.draft,
      },
      data: {
        status: RecordStatus.submitted,
        submittedAt: new Date(),
      },
    });

    await logAudit({
      userId,
      action: 'inventory_records_batch_submitted',
      resourceType: 'inventory_record',
      details: {
        recordIds: draftRecordIds,
        count: draftRecords.length,
        alreadySubmitted: submittedRecords.length,
      },
    });

    return {
      success: true,
      count: draftRecords.length,
      alreadySubmitted: submittedRecords.length,
    };
  }

  /**
   * 批量上传物料数据（Excel）
   */
  static async uploadItemsFromExcel(buffer: Buffer, userId: string) {
    try {
      // 解析Excel文件
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet) as Array<Record<string, unknown>>;

      if (data.length === 0) {
        throw new Error('Excel文件为空');
      }

      // 定义字段映射(支持多种列名格式)
      const fieldMappings = {
        name: ['姓名', '名称', '负责人'],
        workshop: ['车间', '工作间'],
        area: ['区域', '库存区域', '存储区域', '仓库区域'],
        materialCode: ['物料编码', '编码', '物料代码', '代码'],
        materialName: ['物料名称', '材料名称', '物品名称'],
        unit: ['单位', '计量单位', '单位名称']
      };

      // 获取实际的列名
      const firstRow = data[0];
      const columnNames = Object.keys(firstRow);

      // 查找每个字段对应的实际列名
      const getFieldValue = (row: Record<string, unknown>, fieldKey: keyof typeof fieldMappings): string => {
        const possibleNames = fieldMappings[fieldKey];
        for (const name of possibleNames) {
          if (name in row) {
            return String(row[name] || '');
          }
        }
        return '';
      };

      // 验证必需字段(物料编码现在也是必填)
      const requiredFieldKeys: Array<keyof typeof fieldMappings> = ['name', 'workshop', 'area', 'materialName', 'unit', 'materialCode'];
      const missingFields: string[] = [];

      for (const fieldKey of requiredFieldKeys) {
        const possibleNames = fieldMappings[fieldKey];
        const hasField = possibleNames.some(name => columnNames.includes(name));
        if (!hasField) {
          missingFields.push(`${possibleNames[0]} (或 ${possibleNames.slice(1).join('、')})`);
        }
      }

      if (missingFields.length > 0) {
        throw new Error(`缺少必需字段: ${missingFields.join(', ')}`);
      }

      // 获取北京时间的当天日期
      const today = getBeijingToday();
      
      // 先删除当天已上传的所有数据 (覆盖策略)
      const deleteResult = await prisma.inventoryItem.deleteMany({
        where: {
          uploadDate: today,
        }
      });
      
      console.log(`删除当天旧数据: ${deleteResult.count} 条`);
      
      // 先去重: 基于 (name, area, materialCode) 组合去重
      const uniqueItems = new Map<string, Record<string, unknown>>();
      for (const row of data) {
        const name = getFieldValue(row, 'name');
        const area = getFieldValue(row, 'area');
        const materialCode = getFieldValue(row, 'materialCode');
        
        // 验证物料编码不能为空
        if (!materialCode || materialCode.trim() === '') {
          throw new Error(`物料编码不能为空,请检查 Excel 数据`);
        }
        
        // 使用组合键去重 (Excel内部去重)
        const key = `${name}|${area}|${materialCode}`;
        if (!uniqueItems.has(key)) {
          uniqueItems.set(key, row);
        }
      }

      // 准备要创建的数据 (添加当天日期)
      const itemsToCreate = Array.from(uniqueItems.values()).map(row => ({
        name: getFieldValue(row, 'name'),
        workshop: getFieldValue(row, 'workshop'),
        area: getFieldValue(row, 'area'),
        materialCode: getFieldValue(row, 'materialCode'),
        materialName: getFieldValue(row, 'materialName'),
        unit: getFieldValue(row, 'unit'),
        uploadedBy: userId,
        uploadDate: today, // 记录上传日期
      }));

      // 直接批量创建 (因为已经删除了当天的旧数据)
      const result = await prisma.inventoryItem.createMany({
        data: itemsToCreate,
        skipDuplicates: true, // 跳过重复项(以防万一)
      });

      await logAudit({
        userId,
        action: 'inventory_items_uploaded',
        resourceType: 'inventory_item',
        details: { 
          totalRows: data.length,
          uniqueRows: itemsToCreate.length,
          newItems: result.count,
          deletedOldItems: deleteResult.count,
          uploadDate: today.toISOString().split('T')[0],
        },
      });

      return {
        success: true,
        count: result.count,
        totalRows: data.length,
        uniqueRows: itemsToCreate.length,
        deletedOldItems: deleteResult.count,
        uploadDate: today.toISOString().split('T')[0],
        message: deleteResult.count > 0
          ? `成功导入 ${result.count} 条数据,已覆盖当天旧数据 ${deleteResult.count} 条`
          : `成功导入 ${result.count} 条数据`,
      };
    } catch (error) {
      throw new Error(
        `Excel上传失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 获取所有物料及其盘点记录状态(用于Summary和Console查询)
   * 返回指定日期范围内上传的所有物料,包含其盘点记录状态
   */
  static async getAllItemsWithRecordStatus(query: {
    startDate?: string;
    endDate?: string;
    userId?: string; // 如果提供,只返回该用户负责的物料
  }) {
    // 构建日期范围条件
    interface WhereClause {
      uploadDate?: {
        gte?: Date;
        lte?: Date;
      };
      name?: string;
    }

    const where: WhereClause = {};

    // 如果提供了日期范围
    if (query.startDate || query.endDate) {
      where.uploadDate = {};
      if (query.startDate) {
        where.uploadDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        // 结束日期包含当天,需要加一天
        const endDate = new Date(query.endDate);
        endDate.setDate(endDate.getDate() + 1);
        where.uploadDate.lte = endDate;
      }
    } else {
      // 如果没有提供日期范围,默认查询当天
      const today = getBeijingToday();
      where.uploadDate = {
        gte: today,
        lte: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    // 如果提供了userId,只查询该用户负责的物料
    if (query.userId) {
      // 首先获取用户的姓名
      const userProfile = await prisma.profile.findUnique({
        where: { userId: query.userId },
      });

      if (!userProfile) {
        throw new Error('用户信息不存在');
      }

      where.name = userProfile.name;
    }

    // 获取所有符合条件的物料
    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: [
        { area: 'asc' },
        { materialName: 'asc' },
      ],
    });

    // 获取所有物料的盘点记录(无论状态)
    const itemIds = items.map(item => item.id);
    const records = await prisma.inventoryRecord.findMany({
      where: {
        inventoryItemId: { in: itemIds },
        ...(query.userId ? { userId: query.userId } : {}),
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
      // 按提交时间倒序排序,优先显示最新提交的记录
      orderBy: [
        { submittedAt: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    // 构建记录映射表
    // 优先选择submitted状态的记录,如果没有则选择draft状态的最新记录
    const recordMap = new Map<string, typeof records[0]>();
    for (const record of records) {
      const existing = recordMap.get(record.inventoryItemId);

      if (!existing) {
        // 如果该物料还没有记录,直接添加
        recordMap.set(record.inventoryItemId, record);
      } else {
        // 如果已有记录,优先保留submitted状态的记录
        if (record.status === RecordStatus.submitted && existing.status !== RecordStatus.submitted) {
          recordMap.set(record.inventoryItemId, record);
        } else if (record.status === existing.status && record.submittedAt && existing.submittedAt) {
          // 如果状态相同且都有提交时间,保留最新的
          if (record.submittedAt > existing.submittedAt) {
            recordMap.set(record.inventoryItemId, record);
          }
        }
      }
    }

    // 组合数据
    const result = items.map(item => {
      const record = recordMap.get(item.id);
      return {
        // 物料信息
        itemId: item.id,
        name: item.name,
        workshop: item.workshop,
        area: item.area,
        materialCode: item.materialCode,
        materialName: item.materialName,
        unit: item.unit,
        uploadDate: item.uploadDate,

        // 盘点记录信息(如果有)
        recordId: record?.id || null,
        actualQuantity: record?.actualQuantity || null,
        status: record?.status || null,
        recordedAt: record?.recordedAt || null,
        submittedAt: record?.submittedAt || null,

        // 用户信息(如果有记录)
        userName: record?.user?.profile?.name || item.name,
      };
    });

    return result;
  }
}
