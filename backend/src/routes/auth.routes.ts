/**
 * 认证路由
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate, registerSchema, loginSchema, changePasswordSchema, loginByNameSchema } from '../middleware/validator.middleware';

const router = Router();

// 公开路由
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/login-by-name', validate(loginByNameSchema), AuthController.loginByName);

// 需要认证的路由
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/change-password', authenticateToken, validate(changePasswordSchema), AuthController.changePassword);
router.post('/refresh', AuthController.refreshToken);

export default router;
