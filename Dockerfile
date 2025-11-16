# 前端Dockerfile
# 构建React应用

FROM node:22 AS builder

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
COPY opensec ./opensec

# 安装依赖
RUN npm install --legacy-peer-deps

# 构建应用
RUN npm run build

# 生产阶段 - 使用轻量级的Node镜像提供静态文件
FROM node:22-slim

WORKDIR /app

# 安装静态文件服务器
RUN npm install -g serve

# 从构建阶段复制构建输出
COPY --from=builder /app/dist ./dist

# 暴露端口 (Zeabur 会使用 PORT 环境变量)
EXPOSE 8080
ENV PORT=8080

# 启动应用 - 使用 PORT 环境变量,监听所有网络接口
CMD sh -c "serve -s dist -l tcp://0.0.0.0:${PORT}"
