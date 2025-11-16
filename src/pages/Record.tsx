import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/lib/auth";
import { inventoryService, InventoryItemWithRecordDto } from "@/lib/inventory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Download, LogOut, ClipboardCheck, Key } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { type InventoryItem } from "@/data/inventoryData";
import { cn } from "@/lib/utils";

// 扩展 InventoryItem 类型以包含数据库相关字段
interface InventoryItemWithRecord extends InventoryItem {
  itemId?: string; // inventory_items 表的 ID
  recordId?: string; // inventory_records 表的 ID
  materialCode?: string; // 物料编码
  status?: "draft" | "submitted" | null; // 盘点状态
}

const Record = () => {
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [areas, setAreas] = useState<string[]>([]);
  const [allItems, setAllItems] = useState<InventoryItemWithRecord[]>([]); // 保存所有区域的数据
  const [items, setItems] = useState<InventoryItemWithRecord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  // 记住每个区域的当前索引位置
  const [areaIndexMap, setAreaIndexMap] = useState<Record<string, number>>({});
  // 跟踪上一次的索引,用于检测索引变化
  const prevIndexRef = useRef<number>(0);
  // 标记是否正在恢复数据,避免在恢复时触发保存
  const isRestoringRef = useRef<boolean>(false);
  // 存储当前正在编辑的 itemId,用于正确保存到 localStorage
  const currentItemIdRef = useRef<string | undefined>(undefined);

  // 定义currentItem
  const currentItem = items[currentIndex];

  useEffect(() => {
    checkAuthAndLoadData();
    
    // 开发环境下,如果URL包含 ?cleardata=true,清除所有 localStorage 数据
    if (import.meta.env.DEV && window.location.search.includes('cleardata=true')) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('record-input-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('已清除所有 localStorage 数据');
      toast.info('已清除本地缓存数据');
    }
  }, []);

  // 保存当前输入到localStorage
  // 注意: 只在用户主动输入时保存,恢复数据时不保存
  // 使用 ref 存储的 itemId,避免在索引切换时保存到错误的 item
  useEffect(() => {
    // 如果正在恢复数据,不保存
    if (isRestoringRef.current) {
      return;
    }
    
    // 使用 ref 中存储的 itemId,而不是当前索引的 item
    const itemId = currentItemIdRef.current;
    if (itemId && quantity && userId) {
      const key = `record-input-${userId}-${itemId}`;
      localStorage.setItem(key, quantity);
    }
  }, [quantity, userId]);

  // 恢复当前项的输入
  useEffect(() => {
    // 只在索引真正改变时才更新 quantity
    if (currentIndex !== prevIndexRef.current) {
      prevIndexRef.current = currentIndex;
      
      // 标记正在恢复数据
      isRestoringRef.current = true;
      
      const item = items[currentIndex];
      if (item && userId) {
        // 更新当前正在编辑的 itemId
        currentItemIdRef.current = item.itemId;
        
        // 优先显示已保存到数据库的数量
        if (item.actualQuantity !== undefined && item.actualQuantity !== null) {
          setQuantity(item.actualQuantity.toString());
        } else {
          // 如果没有保存的数量,尝试从 localStorage 恢复未提交的输入
          const key = `record-input-${userId}-${item.itemId}`;
          const savedQuantity = localStorage.getItem(key);
          if (savedQuantity) {
            setQuantity(savedQuantity);
          } else {
            // 如果都没有,清空输入框
            setQuantity("");
          }
        }
      } else {
        // 如果没有item或userId,清空输入框和当前itemId
        currentItemIdRef.current = undefined;
        setQuantity("");
      }
      
      // 恢复完成后,重置标记(使用 setTimeout 确保 setQuantity 完成)
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 0);
    }
  }, [currentIndex, items, userId]);

  const checkAuthAndLoadData = async () => {
    // 使用前端 authService 做登录检查
    const currentUser = authService.getCurrentUser();

    if (!currentUser) {
      setLoading(false);
      navigate("/auth");
      return;
    }

    setUserId(currentUser.id);
    setUserName(currentUser.name);

    try {
      // 从后端获取与当前用户相关的物料及其盘点记录
      const itemsWithRecords: InventoryItemWithRecordDto[] = await inventoryService.getUserItemsWithRecords();

      if (!itemsWithRecords || itemsWithRecords.length === 0) {
        toast.error("暂无库存数据");
        setLoading(false);
        return;
      }

      // 转换所有数据并保存到 allItems
      const allItemsData: InventoryItemWithRecord[] = itemsWithRecords.map(item => ({
        name: item.materialName,
        unit: item.unit,
        area: item.area,
        materialCode: item.materialCode ?? undefined,
        itemId: item.itemId,
        recordId: item.recordId ?? undefined,
        actualQuantity: item.actualQuantity ?? undefined,
        status: item.status ?? null,
      }));
      setAllItems(allItemsData);

      // 计算区域列表
      const uniqueAreas = Array.from(new Set(itemsWithRecords.map(item => item.area)));
      setAreas(uniqueAreas);
      const initialArea = uniqueAreas[0];
      setSelectedArea(initialArea);

      // 初始化第一个区域的数据
      const areaItems = allItemsData.filter(item => item.area === initialArea);

      setItems(areaItems);
      setCurrentIndex(0);
      
      // 设置初始的 currentItemIdRef
      if (areaItems.length > 0 && areaItems[0].itemId) {
        currentItemIdRef.current = areaItems[0].itemId;
      }
      
      setQuantity("");
    } catch (error: any) {
      console.error("加载库存数据失败:", error);
      toast.error("加载库存数据失败：" + (error.message || "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  const initializeInventoryFromDB = async (area: string) => {
    // 从 allItems 中过滤出指定区域的数据
    const areaItems: InventoryItemWithRecord[] = allItems
      .filter(item => item.area === area);

    setItems(areaItems);
    
    // 恢复该区域上次的索引位置,如果没有则从0开始
    const savedIndex = areaIndexMap[area] ?? 0;
    const validIndex = Math.min(savedIndex, areaItems.length - 1);
    const targetIndex = validIndex >= 0 ? validIndex : 0;
    
    // 标记正在恢复数据
    isRestoringRef.current = true;
    
    // 先设置索引
    setCurrentIndex(targetIndex);
    
    // 然后立即恢复该项的数量
    const targetItem = areaItems[targetIndex];
    if (targetItem && userId) {
      // 更新当前正在编辑的 itemId
      currentItemIdRef.current = targetItem.itemId;
      
      // 优先显示已保存到数据库的数量
      if (targetItem.actualQuantity !== undefined && targetItem.actualQuantity !== null) {
        setQuantity(targetItem.actualQuantity.toString());
      } else {
        // 如果没有保存的数量,尝试从 localStorage 恢复未提交的输入
        const key = `record-input-${userId}-${targetItem.itemId}`;
        const savedQuantity = localStorage.getItem(key);
        if (savedQuantity) {
          setQuantity(savedQuantity);
        } else {
          // 如果都没有,清空输入框
          setQuantity("");
        }
      }
    } else {
      currentItemIdRef.current = undefined;
      setQuantity("");
    }
    
    // 恢复完成后,重置标记
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 0);
  };

  const handleAreaChange = async (area: string) => {
    // 保存当前区域的索引位置
    if (selectedArea) {
      setAreaIndexMap(prev => ({
        ...prev,
        [selectedArea]: currentIndex
      }));
    }
    
    setSelectedArea(area);
    await initializeInventoryFromDB(area);
  };

  const handleLogout = async () => {
    // 使用前端 authService 登出并清理 token
    await authService.logout();
    navigate("/auth");
    toast.success("已退出登录");
  };

  // 保存单个记录到数据库
  const saveRecordToDB = async (itemIndex: number, actualQuantity: number) => {
    const item = items[itemIndex];
    if (!item.itemId) {
      console.error("Item ID not found");
      return;
    }

    setSaving(true);
    try {
      // 调用后端创建或更新盘点记录
      const record = await inventoryService.saveRecord(item.itemId, actualQuantity);

      // 更新本地 state 中的 recordId 和 actualQuantity
      const updatedItems = [...items];
      updatedItems[itemIndex].recordId = record.id;
      updatedItems[itemIndex].actualQuantity = record.actualQuantity;
      setItems(updatedItems);

      // 同时更新 allItems 中的对应项
      const updatedAllItems = allItems.map(allItem => 
        allItem.itemId === item.itemId 
          ? { ...allItem, recordId: record.id, actualQuantity: record.actualQuantity }
          : allItem
      );
      setAllItems(updatedAllItems);
    } catch (error: any) {
      console.error("保存记录失败:", error);
      toast.error("保存失败：" + (error.message || "未知错误"));
    } finally {
      setSaving(false);
    }
  };

  const filledCount = items.filter(item => item.actualQuantity !== undefined).length;
  // Progress shows current position, not filled count
  const progress = items.length > 0 ? ((currentIndex + 1) / items.length) * 100 : 0;

  const handleNext = () => {
    // 保存当前项的信息到变量,避免状态更新后丢失
    const currentItemToSave = currentItem;
    const currentIndexToSave = currentIndex;
    const quantityToSave = quantity.trim();
    
    // 如果有输入数量，则保存到数据库；否则跳过
    if (quantityToSave) {
      const quantityValue = parseFloat(quantityToSave);
      const currentItemId = currentItemToSave.itemId;
      
      // 使用 itemId 更新 items,而不是使用 index
      setItems(prevItems => 
        prevItems.map(item => 
          item.itemId === currentItemId 
            ? { ...item, actualQuantity: quantityValue }
            : item
        )
      );
      
      // 立即同步更新 allItems,确保切换区域时数据一致
      setAllItems(prevAllItems => 
        prevAllItems.map(allItem => 
          allItem.itemId === currentItemId 
            ? { ...allItem, actualQuantity: quantityValue }
            : allItem
        )
      );
      
      // 异步保存到数据库,不阻塞 UI
      // 使用保存的变量而不是 state
      if (currentItemToSave.itemId) {
        inventoryService.saveRecord(currentItemToSave.itemId, quantityValue)
          .then(record => {
            // 更新 recordId
            setItems(prevItems =>
              prevItems.map(item =>
                item.itemId === currentItemId
                  ? { ...item, recordId: record.id }
                  : item
              )
            );
            setAllItems(prevAllItems =>
              prevAllItems.map(allItem =>
                allItem.itemId === currentItemId
                  ? { ...allItem, recordId: record.id }
                  : allItem
              )
            );
          })
          .catch(error => {
            console.error("后台保存失败:", error);
            // 静默失败,不打断用户操作
          });
      }
      
      // 清除localStorage中的临时输入
      if (currentItemToSave && userId) {
        const key = `record-input-${userId}-${currentItemToSave.itemId}`;
        localStorage.removeItem(key);
      }
    }

    if (currentIndexToSave < items.length - 1) {
      const nextIndex = currentIndexToSave + 1;
      
      // 更新索引,useEffect 会自动处理 quantity 的更新
      setCurrentIndex(nextIndex);
      
      // 保存当前区域的索引位置
      if (selectedArea) {
        setAreaIndexMap(prev => ({
          ...prev,
          [selectedArea]: nextIndex
        }));
      }
    } else {
      // At last item - don't clear quantity
      // Check if all items are filled
      setItems(prevItems => {
        const allFilled = prevItems.every(item => item.actualQuantity !== undefined);
        if (allFilled) {
          toast.success("本区域记录完成！");
        } else {
          toast.info("已到最后一项，还有未填写的项目");
        }
        return prevItems;
      });
      // Don't clear quantity at last item
    }
  };

  const handleReview = () => {
    navigate("/review");
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      
      // 保存当前区域的索引位置
      if (selectedArea) {
        setAreaIndexMap(prev => ({
          ...prev,
          [selectedArea]: prevIndex
        }));
      }
      // quantity will be restored by useEffect
    }
  };

  const handleExportClick = () => {
    // 设置默认为当天
    const today = new Date().toISOString().split('T')[0];
    setExportStartDate(today);
    setExportEndDate(today);
    setExportDialogOpen(true);
  };

  const handleExport = async () => {
    try {
      // 从数据库获取指定日期范围的记录
      const options: any = {};
      if (exportStartDate) {
        options.startDate = exportStartDate;
      }
      if (exportEndDate) {
        options.endDate = exportEndDate;
      }
      
      const { records } = await inventoryService.getUserRecords(options);

      if (!records || records.length === 0) {
        toast.error("该日期范围内暂无已记录的数据");
        return;
      }

      // 导出数据包含导入Excel的所有列，加上盘点日期和实际数量
      const exportData = records.map((record) => ({
        盘点日期: new Date(record.recordedAt).toLocaleDateString("zh-CN"),
        姓名: record.inventoryItem.name,
        车间: record.inventoryItem.workshop,
        库存区域: record.inventoryItem.area,
        物料编码: record.inventoryItem.materialCode || '',
        物料名称: record.inventoryItem.materialName,
        计量单位: record.inventoryItem.unit,
        实际数量: record.actualQuantity
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "盘点记录");
      
      const dateRange = exportStartDate === exportEndDate 
        ? exportStartDate 
        : `${exportStartDate}_${exportEndDate}`;
      XLSX.writeFile(workbook, `库存盘点_${dateRange}.xlsx`);
      
      toast.success(`成功导出 ${records.length} 条记录`);
      setExportDialogOpen(false);
    } catch (error: any) {
      console.error("导出失败:", error);
      toast.error("导出失败：" + error.message);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="p-8 text-center">
          <p className="text-lg mb-4">暂无库存数据</p>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* 顶部用户信息和操作按钮 - 移动端优化 */}
      <div className="w-full bg-background/95 backdrop-blur-sm border-b px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sticky top-0 z-20">
        <span className="text-sm text-muted-foreground">欢迎，{userName}</span>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleExportClick} size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">导出</span>
          </Button>
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>导出盘点记录</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    开始日期
                  </label>
                  <Input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    结束日期
                  </label>
                  <Input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  默认只导出当天的盘点记录，您可以选择不同的日期范围。
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleExport}>
                    确认导出
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => navigate("/change-password")} variant="outline" size="sm">
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline sm:ml-2">修改密码</span>
          </Button>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline sm:ml-2">退出登录</span>
          </Button>
        </div>
      </div>

      {/* 主内容区域 - 添加 pb-safe 确保底部安全区域,添加 scroll-smooth 平滑滚动 */}
      <div className="flex-1 flex items-start justify-center p-4 pb-20 overflow-y-auto scroll-smooth">

        <div className="w-full max-w-2xl">
          {/* 进度条 */}
          <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">
              进度：{currentIndex + 1} / {items.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% · 已填写 {filledCount} 项
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

          {/* 主卡片 - 响应式布局,添加 touch-manipulation 防止双击缩放 */}
          <Card className="p-4 sm:p-6 md:p-8 shadow-lg touch-manipulation mb-4">
            <div className="mb-4">
              <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                第 {currentIndex + 1} 项
              </div>
            </div>

            {/* 响应式布局：移动端纵向，桌面端横向 */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* 左侧：物料编码、物料名称和计量单位 */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {currentItem.materialCode && (
                    <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded text-sm font-mono">
                      编码: {currentItem.materialCode}
                    </span>
                  )}
                  {currentItem.status === "submitted" && (
                    <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded text-sm font-semibold">
                      ✓ 已盘点
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                  {currentItem.name}
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground">
                  计量单位：<span className="font-semibold text-lg sm:text-xl">{currentItem.unit}</span>
                </p>
              </div>

              {/* 右侧：数字填入框和按钮 */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    实际数量
                  </label>
                  <Input
                    type="number"
                    placeholder="请输入实际数量"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="text-xl sm:text-2xl h-14 sm:h-16 text-center font-semibold"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleNext();
                      }
                    }}
                    onFocus={(e) => {
                      // 移动端键盘弹出时,滚动到输入框位置
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 300);
                    }}
                  />
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                    <span className="hidden sm:inline">上一页</span>
                  </Button>
                  <Button
                    onClick={handleNext}
                    size="lg"
                    className="flex-1"
                    disabled={currentIndex === items.length - 1 && items[currentIndex].actualQuantity !== undefined}
                  >
                    <span className="hidden sm:inline">下一页</span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 sm:ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* 最终确认按钮 */}
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleReview}
              size="lg"
              variant="outline"
              className="gap-2 w-full sm:w-auto sm:min-w-[200px]"
            >
              <ClipboardCheck className="w-5 h-5" />
              最终确认
            </Button>
          </div>

          {/* 区域选择 - 响应式网格 - 移到最终确认按钮下方 */}
          <div className="mt-8 mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              库存区域
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {areas.map((area) => (
              <Card
                key={area}
                onClick={() => handleAreaChange(area)}
                className={cn(
                  "p-4 text-center cursor-pointer transition-all duration-200 hover:scale-105",
                  selectedArea === area
                    ? "bg-primary text-primary-foreground shadow-lg border-primary"
                    : "hover:border-primary/50"
                )}
              >
                <div className="font-semibold">{area}</div>
              </Card>
            ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Record;
