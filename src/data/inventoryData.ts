export interface InventoryItem {
  name: string;
  unit: string;
  area: string;
  actualQuantity?: number;
}

export const INVENTORY_DATA: Record<string, { name: string; unit: string }[]> = {
  "酱油区": [
    { name: "海天", unit: "kg" },
    { name: "厨邦", unit: "包" },
    { name: "李锦记", unit: "kg" }
  ],
  "辣椒区": [
    { name: "红辣椒", unit: "箱" },
    { name: "干辣椒", unit: "kg" },
    { name: "朝天椒", unit: "包" }
  ],
  "盐区": [
    { name: "加碘盐", unit: "kg" },
    { name: "不加碘盐", unit: "箱" }
  ]
};

export const AREAS = Object.keys(INVENTORY_DATA);
