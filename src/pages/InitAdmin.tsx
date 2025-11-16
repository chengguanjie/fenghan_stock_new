import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

const InitAdmin = () => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [initKey, setInitKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const createAdminAccount = async () => {
    setCreating(true);

    try {
      // 调用后端 API 注册管理员账号
      const response = await apiClient.post('/auth/register', {
        email: 'admin@inventory.local',
        password: '123456',
        name: 'admin',
        workshop: '管理部门',
        role: 'admin'
      });

      if (!response.success) {
        throw new Error(response.error || '创建失败');
      }

      toast.success('管理员账号创建成功！');
      toast.success('登录名：admin，密码：123456');
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建失败';
      console.error('Error:', error);
      toast.error('创建失败：' + errorMessage);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-4">初始化管理员账号</h1>
          <p className="text-sm text-muted-foreground">
            {showKeyInput ? '系统已有管理员，需要提供初始化密钥' : '点击下方按钮创建默认管理员账号'}
          </p>
        </div>

        {showKeyInput && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-semibold mb-1">安全提示</p>
                <p>系统检测到已存在管理员账号。如需创建额外的管理员账号，请提供初始化密钥。</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4 mb-6 text-left bg-muted p-4 rounded-lg">
          <p className="text-sm">
            <strong>登录名：</strong>admin
          </p>
          <p className="text-sm">
            <strong>密码：</strong>123456
          </p>
        </div>

        {showKeyInput && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">初始化密钥</label>
            <Input
              type="password"
              value={initKey}
              onChange={(e) => setInitKey(e.target.value)}
              placeholder="请输入初始化密钥"
              disabled={creating}
            />
          </div>
        )}

        <Button
          onClick={createAdminAccount}
          disabled={creating || (showKeyInput && !initKey)}
          className="w-full"
        >
          {creating ? "创建中..." : "创建管理员账号"}
        </Button>
        <Button
          onClick={() => navigate('/auth')}
          variant="outline"
          className="w-full mt-4"
        >
          返回登录页
        </Button>
      </Card>
    </div>
  );
};

export default InitAdmin;
