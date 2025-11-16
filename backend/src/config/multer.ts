/**
 * Multer 文件上传配置
 */

import multer from 'multer';

// 使用内存存储
const storage = multer.memoryStorage();

// 文件过滤器 - 允许Excel和CSV文件
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv', // .csv
    'application/csv', // .csv (alternative)
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传Excel或CSV文件 (.xls, .xlsx, .csv)'));
  }
};

// 配置multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});
