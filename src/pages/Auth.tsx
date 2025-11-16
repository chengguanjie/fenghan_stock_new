import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { sanitizeName, validateInputSecurity } from "@/utils/sanitize";
import { authService, User } from "@/lib/auth";

const Auth = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 检查是否已登录
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      checkUserRoleAndRedirect(currentUser);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUserRoleAndRedirect = (user: User) => {
    // 检查用户角色
    if (user.roles && user.roles.includes("admin")) {
      navigate("/console");
    } else {
      navigate("/record");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !password) {
      toast.error("请输入姓名和密码");
      return;
    }

    // 清理用户名输入
    const cleanName = sanitizeName(name);
    
    if (!cleanName) {
      toast.error("用户名包含非法字符");
      return;
    }

    // 安全性检查
    const nameValidation = validateInputSecurity(cleanName);
    if (!nameValidation.isValid) {
      toast.error("用户名" + nameValidation.error);
      return;
    }

    setLoading(true);

    try {
      // 调用后端 API 按姓名登录
      const response = await authService.loginByName({
        name: cleanName,
        password,
      });

      const { user } = response;

      // 根据角色跳转
      if (user.roles && Array.isArray(user.roles) && user.roles.includes("admin")) {
        navigate("/console");
      } else {
        navigate("/record");
      }

      toast.success("登录成功");
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      
      // 检查是否是认证错误(账号或密码错误)
      if (errorMessage.includes("认证失败") || errorMessage.includes("密码") || errorMessage.includes("账号") || errorMessage.includes("用户")) {
        toast.error("账号或密码错误");
      } else {
        toast.error("登录失败：" + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <p className="text-muted-foreground">正在跳转...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8">库存盘点系统</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">姓名</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入姓名"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">密码</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
