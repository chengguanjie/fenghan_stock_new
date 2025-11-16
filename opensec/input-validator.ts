/**
 * OpenSEC 输入验证器
 * 基于安全策略的输入验证和数据清洗
 */

import { z } from 'zod';

/**
 * 验证结果接口
 */
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * 输入验证器类
 */
export class InputValidator {
  /**
   * 用户名验证规则
   */
  static readonly usernameSchema = z
    .string()
    .min(3, '用户名至少需要3个字符')
    .max(50, '用户名最多50个字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符');

  /**
   * 密码验证规则
   */
  static readonly passwordSchema = z
    .string()
    .min(8, '密码至少需要8个字符')
    .max(128, '密码最多128个字符')
    .regex(/[A-Z]/, '密码必须包含至少一个大写字母')
    .regex(/[a-z]/, '密码必须包含至少一个小写字母')
    .regex(/[0-9]/, '密码必须包含至少一个数字');

  /**
   * 邮箱验证规则
   */
  static readonly emailSchema = z
    .string()
    .email('邮箱格式不正确')
    .max(255, '邮箱地址过长');

  /**
   * 手机号验证规则
   */
  static readonly phoneSchema = z
    .string()
    .regex(/^1[3-9]\d{9}$/, '手机号格式不正确');

  /**
   * 商品代码验证规则
   */
  static readonly productCodeSchema = z
    .string()
    .min(1, '商品代码不能为空')
    .max(50, '商品代码最多50个字符');

  /**
   * 数量验证规则
   */
  static readonly quantitySchema = z
    .number()
    .min(0, '数量不能为负数')
    .max(999999, '数量超出范围');

  /**
   * 备注验证规则
   */
  static readonly notesSchema = z
    .string()
    .max(500, '备注最多500个字符')
    .optional();

  /**
   * 用户注册数据验证
   */
  static validateUserRegistration(data: any): ValidationResult {
    const schema = z.object({
      username: this.usernameSchema,
      password: this.passwordSchema,
      email: this.emailSchema.optional(),
      phone: this.phoneSchema.optional(),
      role: z.enum(['admin', 'operator', 'viewer']).optional(),
    });

    try {
      const validated = schema.parse(data);
      return {
        success: true,
        data: this.sanitizeObject(validated),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => e.message),
        };
      }
      return {
        success: false,
        errors: ['验证失败'],
      };
    }
  }

  /**
   * 用户登录数据验证
   */
  static validateUserLogin(data: any): ValidationResult {
    const schema = z.object({
      username: this.usernameSchema,
      password: z.string().min(1, '密码不能为空'),
    });

    try {
      const validated = schema.parse(data);
      return {
        success: true,
        data: this.sanitizeObject(validated),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => e.message),
        };
      }
      return {
        success: false,
        errors: ['验证失败'],
      };
    }
  }

  /**
   * 盘点记录数据验证
   */
  static validateInventoryRecord(data: any): ValidationResult {
    const schema = z.object({
      product_code: this.productCodeSchema,
      product_name: z.string().min(1, '商品名称不能为空').max(100, '商品名称过长'),
      category: z.string().max(50, '分类名称过长').optional(),
      unit: z.string().max(20, '单位名称过长').optional(),
      system_quantity: this.quantitySchema.optional(),
      actual_quantity: this.quantitySchema,
      difference: z.number().optional(),
      location: z.string().max(100, '位置信息过长').optional(),
      notes: this.notesSchema,
    });

    try {
      const validated = schema.parse(data);
      
      // 计算差异
      if (validated.system_quantity !== undefined) {
        validated.difference = validated.actual_quantity - validated.system_quantity;
      }
      
      return {
        success: true,
        data: this.sanitizeObject(validated),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => e.message),
        };
      }
      return {
        success: false,
        errors: ['验证失败'],
      };
    }
  }

  /**
   * 盘点审核数据验证
   */
  static validateInventoryApproval(data: any): ValidationResult {
    const schema = z.object({
      record_id: z.string().uuid('无效的记录ID'),
      status: z.enum(['approved', 'rejected'], {
        errorMap: () => ({ message: '状态必须是 approved 或 rejected' }),
      }),
      review_notes: z.string().max(500, '审核备注最多500个字符').optional(),
    });

    try {
      const validated = schema.parse(data);
      return {
        success: true,
        data: this.sanitizeObject(validated),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(e => e.message),
        };
      }
      return {
        success: false,
        errors: ['验证失败'],
      };
    }
  }

  /**
   * 文件上传验证
   */
  static validateFileUpload(file: File): ValidationResult {
    const maxSizeMB = 10;
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    const errors: string[] = [];

    // 检查文件大小
    if (file.size > maxSizeMB * 1024 * 1024) {
      errors.push(`文件大小不能超过 ${maxSizeMB}MB`);
    }

    // 检查文件类型
    if (!allowedTypes.includes(file.type)) {
      errors.push('只支持 Excel 和 CSV 文件格式');
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    return {
      success: true,
      data: file,
    };
  }

  /**
   * 清洗字符串（防止 XSS）
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // 移除潜在的 HTML 标签
    let sanitized = input.replace(/<[^>]*>/g, '');
    
    // 转义特殊字符
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized.trim();
  }

  /**
   * 清洗对象中的所有字符串字段
   */
  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = { ...obj };

    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = this.sanitizeString(sanitized[key]) as any;
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * 验证 SQL 注入风险
   */
  static hasSQLInjectionRisk(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(--|\;|\/\*|\*\/)/,
      /(\bOR\b.*=.*)/i,
      /(\bAND\b.*=.*)/i,
      /('|")(.*)(OR|AND)(.*)\1/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * 验证 XSS 风险
   */
  static hasXSSRisk(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * 综合安全检查
   */
  static performSecurityCheck(input: string): ValidationResult {
    const errors: string[] = [];

    if (this.hasSQLInjectionRisk(input)) {
      errors.push('输入包含潜在的 SQL 注入风险');
    }

    if (this.hasXSSRisk(input)) {
      errors.push('输入包含潜在的 XSS 攻击风险');
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    return {
      success: true,
      data: this.sanitizeString(input),
    };
  }

  /**
   * 验证批量操作数据
   */
  static validateBatchOperation(data: any[]): ValidationResult {
    const maxBatchSize = 100;

    if (!Array.isArray(data)) {
      return {
        success: false,
        errors: ['数据必须是数组格式'],
      };
    }

    if (data.length === 0) {
      return {
        success: false,
        errors: ['批量操作数据不能为空'],
      };
    }

    if (data.length > maxBatchSize) {
      return {
        success: false,
        errors: [`批量操作最多支持 ${maxBatchSize} 条记录`],
      };
    }

    return {
      success: true,
      data,
    };
  }

  /**
   * 验证日期范围
   */
  static validateDateRange(startDate: Date, endDate: Date): ValidationResult {
    const errors: string[] = [];

    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      errors.push('开始日期无效');
    }

    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      errors.push('结束日期无效');
    }

    if (startDate > endDate) {
      errors.push('开始日期不能晚于结束日期');
    }

    const maxRangeDays = 365;
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxRangeDays) {
      errors.push(`日期范围不能超过 ${maxRangeDays} 天`);
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    return {
      success: true,
      data: { startDate, endDate },
    };
  }
}

/**
 * 验证装饰器（用于类方法）
 */
export function ValidateInput(validatorFn: (data: any) => ValidationResult) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const data = args[0];
      const validation = validatorFn(data);

      if (!validation.success) {
        throw new Error(validation.errors?.join(', ') || '验证失败');
      }

      return originalMethod.apply(this, [validation.data, ...args.slice(1)]);
    };

    return descriptor;
  };
}
