/**
 * Swagger API 文档配置
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '凤韩食品库存盘点系统 API',
      version: '1.0.0',
      description: '库存盘点系统后端API文档，包含认证、用户管理、盘点记录、报表统计等功能模块',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: '开发环境',
      },
      {
        url: 'https://api.example.com/api',
        description: '生产环境',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '使用JWT Token进行认证，格式: Bearer {token}',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: '错误信息描述',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
            },
            pageSize: {
              type: 'integer',
              example: 20,
            },
            total: {
              type: 'integer',
              example: 100,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            username: {
              type: 'string',
            },
            roles: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['user', 'admin'],
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            fullName: {
              type: 'string',
              nullable: true,
            },
          },
        },
        InventoryItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              description: '姓名',
            },
            workshop: {
              type: 'string',
              description: '车间',
            },
            area: {
              type: 'string',
              description: '区域',
            },
            materialName: {
              type: 'string',
              description: '物料名称',
            },
            unit: {
              type: 'string',
              description: '单位',
            },
            uploadedBy: {
              type: 'string',
              format: 'uuid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        InventoryRecord: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            inventoryItemId: {
              type: 'string',
              format: 'uuid',
            },
            actualQuantity: {
              type: 'number',
            },
            status: {
              type: 'string',
              enum: ['draft', 'submitted'],
            },
            submittedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            inventoryItem: {
              $ref: '#/components/schemas/InventoryItem',
            },
            user: {
              allOf: [
                { $ref: '#/components/schemas/User' },
                {
                  type: 'object',
                  properties: {
                    profile: {
                      $ref: '#/components/schemas/UserProfile',
                    },
                  },
                },
              ],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
