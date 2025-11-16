# 后端 Dockerfile - Node.js Express + Prisma
FROM node:22 AS builder

WORKDIR /app

# 安装构建依赖
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# 复制后端依赖文件（必须先复制 package.json）
COPY package*.json ./
COPY tsconfig*.json ./

# 安装所有依赖（包括 devDependencies，需要 TypeScript）
RUN npm install --legacy-peer-deps

# 复制 Prisma schema
COPY prisma ./prisma

# 生成 Prisma 客户端（明确指定版本 5.22.0 以匹配 @prisma/client）
RUN npx prisma@5.22.0 generate

# 调试：检查 typescript 是否安装
RUN echo "=== Checking typescript installation ===" && \
    npm list typescript || echo "TypeScript not found in dependencies" && \
    ls -la node_modules/.bin/ | grep -E "tsc|typescript" || echo "No tsc binary found"

# 复制后端源代码
COPY src ./src

# 构建 TypeScript（直接使用 node_modules 中的 tsc）
RUN ./node_modules/.bin/tsc

# 生产阶段
FROM node:22-slim

WORKDIR /app

# 安装 OpenSSL (Prisma 需要)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 复制依赖和 package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.prisma ./.prisma

# 复制编译后的代码
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# 启动应用
CMD ["node", "dist/index.js"]
