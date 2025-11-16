/**
 * 用户管理路由
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';
import { UserController } from '../controllers/user.controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取用户列表（仅管理员）
router.get('/', requireAdmin, UserController.getUsers);

// 创建管理员（仅管理员）- 必须在通用创建路由之前
router.post('/admin', requireAdmin, UserController.createAdmin);

// 获取用户详情
router.get('/:id', UserController.getUserById);

// 创建用户（仅管理员）
router.post('/', requireAdmin, UserController.createUser);

// 更新用户信息
router.put('/:id', UserController.updateUser);

// 删除用户（仅管理员）
router.delete('/:id', requireAdmin, UserController.deleteUser);

export default router;
