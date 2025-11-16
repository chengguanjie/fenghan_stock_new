/**
 * 输入验证中间件 - 基于 OpenSEC 规范
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * 通用验证中间件
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: '输入验证失败',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: '验证过程发生错误',
      });
    }
  };
}

// 用户注册验证 schema
export const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z
    .string()
    .min(8, '密码至少8位')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/\d/, '密码必须包含数字'),
  name: z.string().min(1, '姓名不能为空').max(100, '姓名过长'),
  workshop: z.string().min(1, '车间不能为空').max(100, '车间名称过长'),
});

// 用户登录验证 schema
export const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
});

// 按姓名登录验证 schema
export const loginByNameSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

// 修改密码验证 schema
export const changePasswordSchema = z.object({
  oldPassword: z.string().optional(), // 首次登录时可以为空
  newPassword: z
    .string()
    .min(8, '新密码至少8位')
    .regex(/[a-z]/, '新密码必须包含小写字母')
    .regex(/[A-Z]/, '新密码必须包含大写字母')
    .regex(/\d/, '新密码必须包含数字'),
});

// 创建盘点记录验证 schema
export const createInventoryRecordSchema = z.object({
  inventoryItemId: z.string().uuid('无效的物料ID'),
  actualQuantity: z.number().min(0, '数量不能为负数'),
});

// 更新盘点记录验证 schema
export const updateInventoryRecordSchema = z.object({
  actualQuantity: z.number().min(0, '数量不能为负数').optional(),
  status: z.enum(['draft', 'submitted']).optional(),
});
