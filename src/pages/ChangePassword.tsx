import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Lock } from "lucide-react";

const ChangePassword = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const checkAuth = async () => {
    const user = authService.getCurrentUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证当前密码
    if (!currentPassword.trim()) {
      toast.error("请提供当前密码");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("请填写新密码和确认密码");
      return;
    }

    // 简单验证：密码必须匹配
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }

    setLoading(true);

    try {
      // 调用后端 API 修改密码
      await authService.changePassword(currentPassword, newPassword);

      toast.success("密码修改成功");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // 返回上一页
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "密码修改失败";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-3 sm:p-4">
      <div className="container max-w-md mx-auto py-4 sm:py-8">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
            <h1 className="text-xl sm:text-2xl font-bold">修改密码</h1>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">当前密码</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="请输入当前密码"
                disabled={loading}
                autoComplete="current-password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">新密码</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
                disabled={loading}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground mt-1">
                密码要求：至少8位,包含大小写字母和数字
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">确认新密码</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "修改中..." : "确认修改"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ChangePassword;
