/**
 * 会话超时检测 Hook
 * 监听用户活动，空闲超时后自动登出
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';
import { logLogout } from '@/utils/auditLog';

// 配置
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30分钟无操作自动登出
const WARNING_TIMEOUT = 28 * 60 * 1000; // 28分钟时显示警告

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = () => {
    lastActivityRef.current = Date.now();

    // 清除现有定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // 设置警告定时器
    warningRef.current = setTimeout(() => {
      toast.warning('您已经长时间未操作，即将自动登出', {
        duration: 5000,
      });
    }, WARNING_TIMEOUT);

    // 设置登出定时器
    timeoutRef.current = setTimeout(async () => {
      try {
        // 记录登出日志
        await logLogout();
        
        // 登出
        await authService.logout();
        
        toast.info('由于长时间未操作，您已被自动登出');
        navigate('/auth');
      } catch (error) {
        console.error('自动登出失败:', error);
      }
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    // 监听用户活动事件
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // 绑定事件监听器
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // 初始化定时器
    resetTimer();

    // 清理函数
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [navigate]);

  return { resetTimer };
};

