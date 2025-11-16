import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/lib/auth";
import { inventoryService } from "@/lib/inventory";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

interface RecordItem {
  id: string;
  actualQuantity: number;
  area: string;
  name: string;
  unit: string;
  inventoryItemId: string;
}

const Review = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<RecordItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const hasRestoredEdits = useRef(false);

  useEffect(() => {
    loadRecordsFromDB();
  }, [navigate]);

  // 从localStorage恢复未保存的编辑
  useEffect(() => {
    if (hasRestoredEdits.current || items.length === 0) return;

    const savedEdits = localStorage.getItem('review-unsaved-edits');
    if (savedEdits) {
      try {
        const edits = JSON.parse(savedEdits);
        const updatedItems = [...items];
        let hasChanges = false;

        // 只恢复仍然存在于当前items中的记录（即draft状态的记录）
        edits.forEach((edit: { id: string; actualQuantity: number }) => {
          const index = updatedItems.findIndex(item => item.id === edit.id);
          if (index !== -1 && updatedItems[index].actualQuantity !== edit.actualQuantity) {
            updatedItems[index].actualQuantity = edit.actualQuantity;
            hasChanges = true;
          }
        });

        if (hasChanges) {
          setItems(updatedItems);
          toast.info("已恢复未保存的修改");
        }

        // 清理localStorage中已不存在的记录
        const validEdits = edits.filter((edit: { id: string }) =>
          updatedItems.some(item => item.id === edit.id)
        );
        if (validEdits.length !== edits.length) {
          localStorage.setItem('review-unsaved-edits', JSON.stringify(validEdits));
        }

        hasRestoredEdits.current = true;
      } catch (error) {
        console.error("恢复编辑失败:", error);
        // 如果恢复失败，清除localStorage
        localStorage.removeItem('review-unsaved-edits');
      }
    } else {
      hasRestoredEdits.current = true;
    }
  }, [items]);

  // 保存未提交的编辑到localStorage
  useEffect(() => {
    if (items.length > 0) {
      const edits = items.map(item => ({
        id: item.id,
        actualQuantity: item.actualQuantity
      }));
      localStorage.setItem('review-unsaved-edits', JSON.stringify(edits));
    }
  }, [items]);

  const loadRecordsFromDB = async () => {
    try {
      const user = authService.getCurrentUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);

      // 从后端 API 获取草稿状态的记录
      const { records } = await inventoryService.getUserRecords('draft');

      if (!records || records.length === 0) {
        toast.error("没有找到盘点记录");
        navigate("/record");
        return;
      }

      const formattedItems: RecordItem[] = records.map((record) => ({
        id: record.id, // 盘点记录的ID，用于更新和提交
        actualQuantity: record.actualQuantity,
        area: record.inventoryItem.area,
        name: record.inventoryItem.materialName,
        unit: record.inventoryItem.unit,
        inventoryItemId: record.id // 保持为 record.id（盘点记录ID）
      }));

      console.log("加载的记录:", formattedItems);
      console.log("记录状态:", records.map(r => ({ id: r.id, status: r.status })));

      setItems(formattedItems);
      setLoading(false);
    } catch (error: any) {
      console.error("加载数据失败:", error);
      toast.error("加载数据失败：" + error.message);
      setLoading(false);
      navigate("/record");
    }
  };

  const handleEdit = (index: number, currentValue: number | undefined) => {
    setEditingIndex(index);
    setEditValue(currentValue?.toString() || "");
  };

  const handleSaveEdit = async (index: number) => {
    const value = parseFloat(editValue);
    if (isNaN(value)) {
      toast.error("请输入有效数字");
      return;
    }

    const item = items[index];
    
    try {
      // 使用后端 API 更新记录
      await inventoryService.updateRecord(item.id, value);

      // 更新本地状态
      const updatedItems = [...items];
      updatedItems[index].actualQuantity = value;
      setItems(updatedItems);
      
      setEditingIndex(null);
      toast.success("修改成功");
    } catch (error: any) {
      console.error("修改失败:", error);
      toast.error("修改失败：" + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const handleSubmitClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      // 收集所有记录的ID
      const recordIds = items.map(item => item.id);
      
      console.log("准备提交的记录ID:", recordIds);
      console.log("记录数量:", recordIds.length);
      
      // 使用后端 API 批量提交记录
      await inventoryService.submitMultipleRecords(recordIds);

      // 清除本地存储的编辑数据
      localStorage.removeItem('review-unsaved-edits');
      
      setShowConfirmDialog(false);
      toast.success("提交成功！");
      navigate("/summary");
    } catch (error: any) {
      console.error("提交失败详情:", error);
      console.error("错误消息:", error.message);
      toast.error("提交失败：" + error.message);
    }
  };

  const handleBack = () => {
    navigate("/record");
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
          <div className="inline-block bg-primary/10 text-primary px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-lg font-semibold mb-3 sm:mb-4">
            盘点校对
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">核对盘点数据</h1>
          <p className="text-sm sm:text-base text-muted-foreground">请仔细检查数据，确认无误后提交</p>
        </div>

        <Card className="p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="overflow-x-auto overflow-y-auto max-h-[600px] -mx-3 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 sm:w-12 text-xs sm:text-sm">序号</TableHead>
                  <TableHead className="text-xs sm:text-sm min-w-[80px]">库存区域</TableHead>
                  <TableHead className="text-xs sm:text-sm min-w-[120px]">物料名称</TableHead>
                  <TableHead className="text-xs sm:text-sm min-w-[80px]">计量单位</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm min-w-[80px]">实际数量</TableHead>
                  <TableHead className="text-center w-20 sm:w-24 text-xs sm:text-sm">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-xs sm:text-sm">{index + 1}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{item.area}</TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm">{item.name}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{item.unit}</TableCell>
                    <TableCell className="text-right text-xs sm:text-sm">
                      {editingIndex === index ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-20 sm:w-24 text-right text-xs sm:text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit(index);
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                        />
                      ) : (
                        <span className="font-semibold">
                          {item.actualQuantity}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingIndex === index ? (
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(index)}
                            className="text-xs px-2"
                          >
                            保存
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="text-xs px-2"
                          >
                            取消
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(index, item.actualQuantity)}
                          className="text-xs px-2"
                        >
                          修改
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleBack} variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="w-5 h-5" />
            返回记录
          </Button>
          <Button onClick={handleSubmitClick} size="lg" className="gap-2">
            <Send className="w-5 h-5" />
            点击提交
          </Button>
        </div>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认提交</AlertDialogTitle>
              <AlertDialogDescription>
                确定要提交盘点数据吗？提交后将生成最终报告。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmSubmit}>确认提交</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Review;
