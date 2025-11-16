import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { inventoryService, ItemWithRecordStatusDto } from "@/lib/inventory";
import { AuditLogger, AuditEventType } from "../../opensec/audit-logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Upload, UserPlus, Users, Trash2, Search, Calendar, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { sanitizeName, sanitizeWorkshop, sanitizeMaterialName, validateInputSecurity } from "@/utils/sanitize";

interface User {
  id: string;
  name: string;
  workshop: string;
  roles: string[];
  createdAt: string;
}

const Console = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Register user states
  const [newUserName, setNewUserName] = useState("");
  const [newUserWorkshop, setNewUserWorkshop] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  // Upload Excel states
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  // User list states
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Query records states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [queryItems, setQueryItems] = useState<ItemWithRecordStatusDto[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      // 使用 authService 获取当前用户
      const user = authService.getCurrentUser();
      
      if (!user) {
        await AuditLogger.logPermissionDenied('', '', '访问控制台', '未登录');
        navigate("/auth");
        setLoading(false);
        return;
      }

      // 检查用户角色是否为管理员
      const hasAdminRole = user.roles && user.roles.includes("admin");

      if (!hasAdminRole) {
        await AuditLogger.logPermissionDenied(user.id, user.name, '访问控制台', '非管理员用户');
        toast.error("无权限访问控制台");
        navigate("/record");
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    } catch (error) {
      console.error('检查管理员状态失败:', error);
      toast.error('权限检查失败');
      navigate("/auth");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const user = authService.getCurrentUser();
    if (user) {
      await AuditLogger.logLogout(user.id, user.name);
    }
    await authService.logout();
    navigate("/auth");
    toast.success("已退出登录");
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await apiClient.get('/users');
      if (response.success && response.data) {
        setUsers(response.data as User[]);
      }
    } catch (error) {
      toast.error('获取用户列表失败');
      console.error('获取用户列表失败:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    // 确认删除
    if (!confirm(`确定要删除用户 "${userName}" 吗？此操作无法撤销。`)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/users/${userId}`);
      if (response.success) {
        toast.success(`用户 "${userName}" 已删除`);
        // 刷新用户列表
        fetchUsers();
      } else {
        throw new Error(response.error || '删除失败');
      }
    } catch (error: any) {
      toast.error('删除失败：' + error.message);
      console.error('删除用户失败:', error);
    }
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUserName || !newUserWorkshop) {
      toast.error("请填写所有字段");
      return;
    }

    // 清理输入
    const cleanName = sanitizeName(newUserName);
    const cleanWorkshop = sanitizeWorkshop(newUserWorkshop);

    // 验证清理后的输入
    if (!cleanName || !cleanWorkshop) {
      toast.error("输入包含非法字符,请重新输入");
      return;
    }

    // 安全性检查
    const nameValidation = validateInputSecurity(cleanName);
    const workshopValidation = validateInputSecurity(cleanWorkshop);

    if (!nameValidation.isValid) {
      toast.error("姓名" + nameValidation.error);
      return;
    }

    if (!workshopValidation.isValid) {
      toast.error("车间" + workshopValidation.error);
      return;
    }

    setRegisterLoading(true);

    try {
      // 调用后端 API 注册用户
      const response = await apiClient.post('/users', {
        name: cleanName,
        workshop: cleanWorkshop,
      });

      if (!response.success) {
        throw new Error(response.error || '注册失败');
      }

      toast.success(`用户注册成功！登录名：${cleanName}，默认密码：123456`);
      setNewUserName("");
      setNewUserWorkshop("");
      // 刷新用户列表
      fetchUsers();
    } catch (error: any) {
      toast.error("注册失败：" + error.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleQueryRecords = async () => {
    if (!startDate || !endDate) {
      toast.error("请选择开始日期和结束日期");
      return;
    }

    setQueryLoading(true);
    try {
      // 使用新的API获取所有物料及其盘点状态
      const items = await inventoryService.getAllItemsWithStatus({
        startDate,
        endDate,
      });

      setQueryItems(items);

      // 统计信息
      const totalItems = items.length;
      const countedItems = items.filter(item => item.status === 'submitted').length;
      const uncountedItems = items.filter(item => item.status === null || item.status === 'draft').length;

      toast.success(`查询成功，共 ${totalItems} 项物料 (已盘点: ${countedItems}, 未盘点: ${uncountedItems})`);
    } catch (error) {
      toast.error('查询失败');
      console.error('查询记录失败:', error);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleExportQueryResults = () => {
    if (queryItems.length === 0) {
      toast.error("没有数据可导出");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      queryItems.map((item: ItemWithRecordStatusDto, index: number) => ({
        序号: index + 1,
        姓名: item.userName,
        库存区域: item.area,
        物料编码: item.materialCode || '',
        物料名称: item.materialName,
        计量单位: item.unit,
        实际数量: item.actualQuantity !== null ? item.actualQuantity : '',
        盘点状态: item.status === 'submitted' ? '已盘点' : item.status === 'draft' ? '草稿' : '未盘点',
        盘点日期: item.submittedAt
          ? new Date(item.submittedAt).toLocaleDateString("zh-CN")
          : '',
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "查询结果");
    XLSX.writeFile(workbook, `库存盘点查询_${startDate}_至_${endDate}.xlsx`);
    toast.success("导出成功");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setUploading(true);

    try {
      // 创建 FormData 对象
      const formData = new FormData();
      formData.append('file', file);

      // 调用后端 API 上传文件
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/inventory/items/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '上传失败');
      }

      toast.success(result.message || '上传成功');
      
      // Reset file input to allow uploading again
      if (e.target) {
        e.target.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败';
      toast.error("上传失败：" + errorMessage);
      setSelectedFileName("");
      // Reset file input on error too
      if (e.target) {
        e.target.value = '';
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-3 sm:p-4">
      <div className="container max-w-4xl mx-auto py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">控制台</h1>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </div>

        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="register" className="text-xs sm:text-sm py-2">注册用户</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm py-2" onClick={fetchUsers}>用户清单</TabsTrigger>
            <TabsTrigger value="upload" className="text-xs sm:text-sm py-2">上传Excel</TabsTrigger>
            <TabsTrigger value="query" className="text-xs sm:text-sm py-2">数据查询</TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                注册新用户
              </h2>
              <form onSubmit={handleRegisterUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">姓名（用于登录）</label>
                  <Input
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="请输入姓名"
                    disabled={registerLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">车间</label>
                  <Input
                    value={newUserWorkshop}
                    onChange={(e) => setNewUserWorkshop(e.target.value)}
                    placeholder="请输入车间"
                    disabled={registerLoading}
                  />
                </div>

                <div className="bg-muted p-3 rounded text-sm text-muted-foreground">
                  <p>默认密码：<strong className="text-foreground">123456</strong></p>
                  <p className="text-xs mt-1">用户登录后可自行修改密码</p>
                </div>

                <Button type="submit" className="w-full" disabled={registerLoading}>
                  {registerLoading ? "注册中..." : "注册用户"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                已注册用户清单
              </h2>
              {usersLoading ? (
                <p className="text-center text-muted-foreground py-8">加载中...</p>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无用户</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium">姓名</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">车间</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">角色</th>
                        <th className="text-left py-3 px-2 text-sm font-medium">注册时间</th>
                        <th className="text-center py-3 px-2 text-sm font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">{user.name}</td>
                          <td className="py-3 px-2 text-sm">{user.workshop}</td>
                          <td className="py-3 px-2 text-sm">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              user.roles.includes('admin') 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {user.roles.includes('admin') ? '管理员' : '普通用户'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                上传Excel表
              </h2>
              <div className="space-y-4">
                {/* 字段规范说明 */}
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    📋 Excel 文件字段规范
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">必填字段：</p>
                    <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1">
                      <li><strong>姓名</strong> (或"名称"、"负责人")</li>
                      <li><strong>车间</strong> (或"工作间")</li>
                      <li><strong>库存区域</strong> (或"区域"、"存储区域"、"仓库区域")</li>
                      <li><strong>物料名称</strong> (或"材料名称"、"物品名称")</li>
                      <li><strong>计量单位</strong> (或"单位"、"单位名称")</li>
                      <li><strong>物料编码</strong> (或"编码"、"物料代码"、"代码")</li>
                    </ul>
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        💡 <strong>提示：</strong>系统支持多种列名格式,括号内的名称都可以识别。请确保 Excel 文件第一行为列名。
                      </p>
                    </div>
                  </div>
                </div>

                {/* 文件上传区域 */}
                <div>
                  <label className="block text-sm font-medium mb-2">选择文件</label>
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    key={selectedFileName} // Force re-render to reset input
                  />
                </div>

                {selectedFileName && (
                  <div className="text-sm p-3 bg-muted rounded-md">
                    <p className="text-foreground">
                      <strong>已选择文件：</strong>{selectedFileName}
                    </p>
                    {!uploading && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ✓ 文件已成功上传并处理
                      </p>
                    )}
                  </div>
                )}
                {uploading && (
                  <p className="text-sm text-muted-foreground">上传中...</p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="query">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                数据查询
              </h2>
              <div className="space-y-4">
                {/* 日期范围选择 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      开始日期
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={queryLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      结束日期
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={queryLoading}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleQueryRecords}
                  className="w-full"
                  disabled={queryLoading}
                >
                  {queryLoading ? "查询中..." : "查询数据"}
                </Button>

                {/* 查询结果展示 */}
                {queryItems.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex flex-wrap gap-3 text-sm text-blue-700 dark:text-blue-300">
                      <span>应盘点: <strong>{queryItems.length}</strong></span>
                      <span className="text-green-700 dark:text-green-300">已盘点: <strong>{queryItems.filter(item => item.status === 'submitted').length}</strong></span>
                      <span className="text-orange-700 dark:text-orange-300">未盘点: <strong>{queryItems.filter(item => item.status === null || item.status === 'draft').length}</strong></span>
                    </div>
                  </div>
                )}

                {queryItems.length > 0 && (
                  <>
                    <div className="flex justify-end mb-2">
                      <Button
                        onClick={handleExportQueryResults}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        导出Excel
                      </Button>
                    </div>
                    <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium">序号</th>
                            <th className="text-left py-2 px-3 font-medium">姓名</th>
                            <th className="text-left py-2 px-3 font-medium">库存区域</th>
                            <th className="text-left py-2 px-3 font-medium">物料编码</th>
                            <th className="text-left py-2 px-3 font-medium">物料名称</th>
                            <th className="text-left py-2 px-3 font-medium">计量单位</th>
                            <th className="text-right py-2 px-3 font-medium">实际数量</th>
                            <th className="text-left py-2 px-3 font-medium">盘点状态</th>
                            <th className="text-left py-2 px-3 font-medium">盘点日期</th>
                          </tr>
                        </thead>
                        <tbody>
                          {queryItems.map((item: ItemWithRecordStatusDto, index: number) => (
                            <tr key={item.itemId} className={`border-b hover:bg-muted/50 ${item.status === null ? 'bg-orange-50/50 dark:bg-orange-950/20' : ''}`}>
                              <td className="py-2 px-3 font-medium">{index + 1}</td>
                              <td className="py-2 px-3">{item.userName}</td>
                              <td className="py-2 px-3">{item.area}</td>
                              <td className="py-2 px-3">{item.materialCode || '-'}</td>
                              <td className="py-2 px-3">{item.materialName}</td>
                              <td className="py-2 px-3">{item.unit}</td>
                              <td className="py-2 px-3 text-right font-medium">{item.actualQuantity !== null ? item.actualQuantity : '-'}</td>
                              <td className="py-2 px-3">
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
                              </td>
                              <td className="py-2 px-3 text-muted-foreground">
                                {item.submittedAt
                                  ? new Date(item.submittedAt).toLocaleDateString('zh-CN')
                                  : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {!queryLoading && queryItems.length === 0 && startDate && endDate && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>所选日期范围内没有找到数据</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Console;
