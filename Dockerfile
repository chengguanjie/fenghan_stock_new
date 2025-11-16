# 前端Dockerfile
# 构建React应用

FROM node:22-alpine AS builder

WORKDIR /app

# 复制前端源代码
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY eslint.config.js ./
COPY src ./src
COPY public ./public

# 安装依赖并构建
RUN npm ci
RUN npm run build

# 生产阶段 - 使用轻量级的Node镜像提供静态文件
FROM node:22-alpine

WORKDIR /app

# 安装静态文件服务器
RUN npm install -g serve

# 从构建阶段复制构建输出
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 5173

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5173', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# 启动应用
CMD ["serve", "-s", "dist", "-l", "5173"]
