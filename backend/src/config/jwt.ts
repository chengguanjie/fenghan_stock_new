/**
 * JWT 配置
 */

export const jwtConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-token-secret-key',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-key',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '2h',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
};
