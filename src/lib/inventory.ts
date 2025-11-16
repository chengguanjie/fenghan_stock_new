import { apiClient } from "./api";

export interface InventoryItemWithRecordDto {
  itemId: string;
  area: string;
  materialCode?: string | null;
  materialName: string;
  unit: string;
  recordId?: string | null;
  actualQuantity?: number | null;
  status?: "draft" | "submitted" | null;
}

export interface InventoryRecordDto {
  id: string;
  actualQuantity: number;
  status: "draft" | "submitted";
  recordedAt: string;
  submittedAt: string | null;
  inventoryItem: {
    name: string;
    workshop: string;
    area: string;
    materialCode?: string | null;
    materialName: string;
    unit: string;
    uploadDate?: string | null;
  };
}

export interface ItemWithRecordStatusDto {
  itemId: string;
  name: string;
  workshop: string;
  area: string;
  materialCode: string | null;
  materialName: string;
  unit: string;
  uploadDate: string | null;
  recordId: string | null;
  actualQuantity: number | null;
  status: "draft" | "submitted" | null;
  recordedAt: string | null;
  submittedAt: string | null;
  userName: string;
}

export const inventoryService = {
  async getUserItemsWithRecords(): Promise<InventoryItemWithRecordDto[]> {
    const response = await apiClient.get<InventoryItemWithRecordDto[]>("/inventory/user-items");

    if (!response.success || !response.data) {
      throw new Error(response.error || "加载库存数据失败");
    }

    return response.data;
  },

  async saveRecord(inventoryItemId: string, actualQuantity: number) {
    const response = await apiClient.post<InventoryRecordDto>("/inventory/records", {
      inventoryItemId,
      actualQuantity,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || "保存盘点记录失败");
    }

    return response.data;
  },

  async getUserRecords(options?: { 
    status?: 'draft' | 'submitted';
    startDate?: string;
    endDate?: string;
  }) {
    const params = new URLSearchParams();
    if (options?.status) {
      params.append('status', options.status);
    }
    if (options?.startDate) {
      params.append('startDate', options.startDate);
    }
    if (options?.endDate) {
      params.append('endDate', options.endDate);
    }
    params.append('pageSize', '10000');
    
    const response = await apiClient.get<InventoryRecordDto[]>(`/inventory/records?${params.toString()}`);

    if (!response.success || !response.data) {
      throw new Error(response.error || "加载盘点记录失败");
    }

    return {
      records: response.data,
      pagination: (response as any).pagination ?? undefined,
    };
  },

  async updateRecord(recordId: string, actualQuantity: number) {
    const response = await apiClient.put<InventoryRecordDto>(`/inventory/records/${recordId}`, {
      actualQuantity,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || "更新盘点记录失败");
    }

    return response.data;
  },

  async submitMultipleRecords(recordIds: string[]) {
    const response = await apiClient.post("/inventory/records/batch/submit", {
      recordIds,
    });

    if (!response.success) {
      throw new Error(response.error || "提交盘点记录失败");
    }

    return response.data;
  },

  async getAllItemsWithStatus(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ItemWithRecordStatusDto[]> {
    const params = new URLSearchParams();
    if (options?.startDate) {
      params.append('startDate', options.startDate);
    }
    if (options?.endDate) {
      params.append('endDate', options.endDate);
    }

    const response = await apiClient.get<ItemWithRecordStatusDto[]>(
      `/inventory/items-with-status${params.toString() ? '?' + params.toString() : ''}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || "加载物料数据失败");
    }

    return response.data;
  },
};
