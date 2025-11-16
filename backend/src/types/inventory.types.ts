/**
 * 库存相关类型定义
 */

import { RecordStatus } from '@prisma/client';

export interface CreateInventoryRecordRequest {
  inventoryItemId: string;
  actualQuantity: number;
}

export interface UpdateInventoryRecordRequest {
  actualQuantity?: number;
  status?: RecordStatus;
}

export interface InventoryRecordQuery {
  status?: RecordStatus;
  userId?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface InventoryItemQuery {
  workshop?: string;
  name?: string;
  page?: number;
  limit?: number;
}
