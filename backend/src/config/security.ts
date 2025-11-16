/**
 * 安全策略配置 - 基于 OpenSEC 规范
 */

export const securityConfig = {
  // 密码策略
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    passwordExpiryDays: 90,
    passwordHistoryCount: 5,
  },

  // 登录安全
  login: {
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
  },

  // 会话管理
  session: {
    timeoutMinutes: 120,
    idleTimeoutMinutes: 30,
    maxConcurrentSessions: 3,
  },

  // CORS 配置
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },

  // 速率限制
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 100, // 最多 100 个请求
    loginMax: 5, // 登录最多 5 次
  },
};
