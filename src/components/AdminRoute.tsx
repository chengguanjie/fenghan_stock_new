import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "@/lib/auth";
import { AuditLogger } from "../../opensec/audit-logger";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * 管理员路由组件
 * 确保只有管理员用户才能访问
 */
export const AdminRoute = ({ children }: AdminRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const authenticated = authService.isAuthenticated();
      const user = authService.getCurrentUser();
      
      if (!authenticated || !user) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setLoading(false);
        await AuditLogger.log({
          event_type: 'permission_denied' as any,
          action: '访问管理员路由',
          status: 'failure' as any,
          error_message: '未登录',
        });
        return;
      }

      setIsAuthenticated(true);

      // 检查用户是否为管理员
      if (user.roles && user.roles.includes("admin")) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        await AuditLogger.logPermissionDenied(
          user.id,
          user.name,
          '访问管理员路由',
          '非管理员用户'
        );
      }
    } catch (error) {
      console.error("权限检查异常:", error);
      setIsAuthenticated(false);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">验证权限中...</p>
        </div>
      </div>
    );
  }

  // 未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // 已登录但不是管理员，重定向到记录页
  if (!isAdmin) {
    return <Navigate to="/record" replace />;
  }

  return <>{children}</>;
};

