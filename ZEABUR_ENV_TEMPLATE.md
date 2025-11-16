# Zeabur 生产环境变量模板
# 请根据实际情况复制到Zeabur控制面板

# ========== 后端服务环境变量 ==========

# 数据库连接字符串
# 格式: mysql://username:password@host:port/database_name
DATABASE_URL=mysql://username:password@your-mysql-host:3306/fenghan_stock

# JWT访问令牌秘钥(最少32个字符)
# 生成命令: openssl rand -hex 32
JWT_ACCESS_SECRET=generate-strong-random-string-32-chars-minimum

# JWT访问令牌过期时间
JWT_ACCESS_EXPIRY=2h

# JWT刷新令牌秘钥(最少32个字符)
# 生成命令: openssl rand -hex 32
JWT_REFRESH_SECRET=generate-strong-random-string-32-chars-minimum

# JWT刷新令牌过期时间
JWT_REFRESH_EXPIRY=7d

# 服务器端口
PORT=8080

# Node环境
NODE_ENV=production

# 管理员初始化密钥(用于首次创建管理员)
# 生成命令: openssl rand -hex 16
ADMIN_INIT_KEY=generate-strong-random-string

# CORS允许的来源(逗号分隔)
# 示例: https://yourdomain.com,https://www.yourdomain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# ========== 前端服务环境变量 ==========

# 后端API基础地址
# 例: https://your-backend-domain.com/api 或 https://api.yourdomain.com/api
VITE_API_BASE_URL=https://your-backend-domain.com/api

# 可选: 管理员初始化密钥(前端显示使用)
# VITE_ADMIN_INIT_KEY=your-init-key-if-needed

# ========== 数据库服务环境变量(如使用Zeabur MySQL) ==========

# MySQL根密码
MYSQL_ROOT_PASSWORD=your-strong-root-password

# MySQL普通用户
MYSQL_USER=stock_user

# MySQL普通用户密码
MYSQL_PASSWORD=your-strong-user-password

# MySQL数据库名
MYSQL_DATABASE=fenghan_stock

# ========== 可选的监控和日志 ==========

# 日志级别 (debug, info, warn, error)
LOG_LEVEL=info

# Sentry错误追踪(可选)
# SENTRY_DSN=https://your-sentry-dsn

# 应用名称
APP_NAME=stock-deck-backend

# ========= 环境说明 ==========
# 
# 1. 生成强随机字符串:
#    openssl rand -hex 32
#
# 2. JWT_ACCESS_EXPIRY 和 JWT_REFRESH_EXPIRY 支持的格式:
#    - 毫秒: 3600000
#    - 秒: "2h", "7d", "10s"
#
# 3. ALLOWED_ORIGINS:
#    - 多个域名用逗号分隔
#    - 包含协议(http://, https://)
#    - 不包含末尾斜杠
#
# 4. DATABASE_URL:
#    - 确保数据库用户有创建表的权限
#    - 支持SSL: mysql+ssl://...
#    - 支持IPv6: mysql://user:pass@[::1]:3306/db
#
# 5. VITE_API_BASE_URL:
#    - 必须与后端实际部署的域名一致
#    - 路径末尾无斜杠
#
# ========= 部署检查清单 ==========
#
# [ ] DATABASE_URL 已设置且格式正确
# [ ] JWT_ACCESS_SECRET 和 JWT_REFRESH_SECRET 已生成强密钥
# [ ] ADMIN_INIT_KEY 已设置
# [ ] ALLOWED_ORIGINS 已正确配置前端域名
# [ ] VITE_API_BASE_URL 已正确配置后端域名
# [ ] 所有必需的环境变量已填写(不留空)
# [ ] 敏感信息已妥善保管(密钥、密码)
# [ ] 前后端域名已在Zeabur配置
# [ ] HTTPS已启用
# [ ] 数据库已初始化(prisma db push)
