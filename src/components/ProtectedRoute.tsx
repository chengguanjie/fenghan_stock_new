import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "@/lib/auth";
import { AuditLogger } from "../../opensec/audit-logger";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 受保护的路由组件
 * 确保只有已登录用户才能访问
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = authService.isAuthenticated();
      const user = authService.getCurrentUser();
      
      if (authenticated && user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (!user) {
          await AuditLogger.log({
            event_type: 'permission_denied' as any,
            action: '访问受保护路由',
            status: 'failure' as any,
            error_message: '未登录',
          });
        }
      }
    } catch (error) {
      console.error("认证检查异常:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">验证身份中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

