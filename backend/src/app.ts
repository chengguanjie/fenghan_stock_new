/**
 * Express 应用配置
 */

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { securityConfig } from './config/security';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import inventoryRoutes from './routes/inventory.routes';
import reportRoutes from './routes/report.routes';

const app = express();

// 中间件
app.use(cors(securityConfig.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger API 文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '凤韩食品库存盘点系统 API 文档',
}));

// 健康检查
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: '凤韩食品库存盘点系统 API 运行正常',
    timestamp: new Date().toISOString(),
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);

// 404 处理
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
  });
});

// 错误处理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;
