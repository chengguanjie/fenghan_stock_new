# 后端Dockerfile
# 构建Express服务器

FROM node:18-alpine AS builder

WORKDIR /app

# 复制后端源代码
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

# 安装依赖并构建TypeScript
RUN npm ci
RUN npm run build

# 生产阶段
FROM node:18-alpine

WORKDIR /app

# 安装生产依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制Prisma客户端
COPY prisma ./prisma
RUN npx prisma generate

# 从构建阶段复制编译后的JavaScript
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 8080

# 环境变量
ENV NODE_ENV=production
ENV PORT=8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# 启动应用
CMD ["node", "dist/index.js"]
