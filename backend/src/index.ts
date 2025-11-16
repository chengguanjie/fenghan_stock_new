/**
 * 服务器入口文件
 */

import dotenv from 'dotenv';
import app from './app';
import { prisma } from './config/database';

// 加载环境变量
dotenv.config();

const PORT = process.env.PORT || 8080;

// 启动服务器
async function start() {
  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📍 健康检查: http://localhost:${PORT}/health`);
      console.log(`📍 API 基础路径: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

start();
