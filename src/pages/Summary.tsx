import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/lib/auth";
import { inventoryService, ItemWithRecordStatusDto } from "@/lib/inventory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Home, Play, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

type FilterStatus = "all" | "counted" | "uncounted";

const Summary = () => {
  const navigate = useNavigate();
  const [allItems, setAllItems] = useState<ItemWithRecordStatusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  useEffect(() => {
    loadAllItems();
  }, [navigate]);

  const loadAllItems = async () => {
    try {
      const user = authService.getCurrentUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      // 从后端 API 获取所有应盘点物料及其盘点状态
      const items = await inventoryService.getAllItemsWithStatus();

      if (!items || items.length === 0) {
        toast.error("没有找到应盘点的物料");
        navigate("/record");
        return;
      }

      setAllItems(items);
      setLoading(false);
    } catch (error: any) {
      console.error("加载数据失败:", error);
      toast.error("加载数据失败：" + error.message);
      setLoading(false);
      navigate("/record");
    }
  };

  // 根据筛选状态过滤数据
  const filteredItems = allItems.filter(item => {
    if (filterStatus === "counted") {
      return item.status === "submitted";
    } else if (filterStatus === "uncounted") {
      return item.status === null || item.status === "draft";
    }
    return true; // "all"
  });

  // 统计数据
  const countedCount = allItems.filter(item => item.status === "submitted").length;
  const uncountedCount = allItems.filter(item => item.status === null || item.status === "draft").length;

  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredItems.map((item, index) => ({
        序号: index + 1,
        姓名: item.userName,
        库存区域: item.area,
        物料编码: item.materialCode || '',
        物料名称: item.materialName,
        计量单位: item.unit,
        实际数量: item.actualQuantity || '',
        盘点状态: item.status === "submitted" ? "已盘点" : item.status === "draft" ? "草稿" : "未盘点",
        盘点日期: item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("zh-CN") : '',
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "盘点结果");
    const filename = filterStatus === "all"
      ? `库存盘点_全部_${new Date().toLocaleDateString()}.xlsx`
      : filterStatus === "counted"
      ? `库存盘点_已盘点_${new Date().toLocaleDateString()}.xlsx`
      : `库存盘点_未盘点_${new Date().toLocaleDateString()}.xlsx`;
    XLSX.writeFile(workbook, filename);
    toast.success("导出成功");
  };

  const handleNewCount = () => {
    navigate("/record");
  };

  const handleContinueCount = () => {
    // 找到第一个未盘点的物料
    const firstUncountedItem = allItems.find(
      item => item.status === null || item.status === "draft"
    );

    if (!firstUncountedItem) {
      toast.info("所有物料已完成盘点");
      return;
    }

    // 跳转到盘点页面
    navigate("/record");
    toast.success("继续盘点未完成物料");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block bg-accent/10 text-accent px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-semibold mb-3 sm:mb-4">
            📋 盘点汇总
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">盘点结果汇总</h1>
          <div className="flex justify-center gap-4 text-sm sm:text-base text-muted-foreground">
            <span>应盘点: <strong className="text-foreground">{allItems.length}</strong></span>
            <span className="text-green-600">已盘点: <strong>{countedCount}</strong></span>
            <span className="text-orange-600">未盘点: <strong>{uncountedCount}</strong></span>
          </div>
        </div>

        {/* 筛选按钮 */}
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            全部 ({allItems.length})
          </Button>
          <Button
            variant={filterStatus === "counted" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("counted")}
            className="gap-2"
          >
            ✓ 已盘点 ({countedCount})
          </Button>
          <Button
            variant={filterStatus === "uncounted" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("uncounted")}
            className="gap-2"
          >
            ⏳ 未盘点 ({uncountedCount})
          </Button>
        </div>

        <Card className="p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="overflow-x-auto overflow-y-auto max-h-[600px] -mx-3 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 sm:w-12 text-xs sm:text-sm">序号</TableHead>
                  <TableHead className="text-xs sm:text-sm min-w-[80px]">姓名</TableHead>
                  <TableHead className="text-xs sm:text-sm min-w-[80px]">库存区域</TableHead>
                  <TableHead className="text-xs sm:text-sm min-w-[100px]">物料编码</TableHead>
                  <TableHead className="text-xs sm:text-sm min-w-[120px]">物料名称</TableHead>
                  <TableHead className="text-xs sm:text-sm min-w-[80px]">计量单位</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm min-w-[80px]">实际数量</TableHead>
                  <TableHead className="text-xs sm:text-sm min-w-[80px]">盘点状态</TableHead>
                  <TableHead className="text-xs sm:text-sm min-w-[100px]">盘点日期</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => (
                  <TableRow key={item.itemId} className={item.status === null ? "bg-orange-50/50 dark:bg-orange-950/20" : ""}>
                    <TableCell className="font-medium text-xs sm:text-sm">{index + 1}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{item.userName}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{item.area}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{item.materialCode || '-'}</TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm">{item.materialName}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{item.unit}</TableCell>
                    <TableCell className="text-right font-semibold text-xs sm:text-sm">
                      {item.actualQuantity !== null ? item.actualQuantity : '-'}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {item.status === "submitted" ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ✓ 已盘点
                        </span>
                      ) : item.status === "draft" ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          草稿
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          未盘点
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("zh-CN") : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button onClick={handleDownload} size="lg" className="gap-2 w-full sm:w-auto">
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            导出Excel
          </Button>
          {uncountedCount > 0 && (
            <Button onClick={handleContinueCount} variant="default" size="lg" className="gap-2 w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              继续盘点 ({uncountedCount}项未完成)
            </Button>
          )}
          <Button onClick={handleNewCount} variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            返回盘点页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Summary;
