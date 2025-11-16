# 📌 Zeabur部署 - 快速参考卡片

## 🎯 三个关键步骤

### 1️⃣ 推送到GitHub
```bash
# 替换your-username为你的GitHub用户名
git remote add origin https://github.com/your-username/fenghan_stock_new.git
git push -u origin main
```

### 2️⃣ 在Zeabur部署
1. 登录 https://zeabur.com
2. 创建新项目
3. 连接GitHub仓库 `fenghan_stock_new`
4. 按照 `ZEABUR_QUICK_START.md` 的步骤完成

### 3️⃣ 配置环境变量
参考 `ZEABUR_ENV_TEMPLATE.md` 中的所有变量

---

## 📚 文档导航

| 场景 | 文档 | 阅读时间 |
|------|------|---------|
| 快速开始 | `ZEABUR_QUICK_START.md` | 5分钟 |
| 完整部署指南 | `ZEABUR_DEPLOYMENT_GUIDE.md` | 30分钟 |
| 环境变量配置 | `ZEABUR_ENV_TEMPLATE.md` | 10分钟 |
| GitHub推送 | `GITHUB_PUSH_GUIDE.md` | 5分钟 |
| 项目总结 | `DEPLOYMENT_SUMMARY.md` | 15分钟 |

---

## 🔑 关键环境变量

```bash
# 数据库 (必需)
DATABASE_URL=mysql://user:pass@host:3306/fenghan_stock

# JWT密钥 (必需, 最少32字符)
JWT_ACCESS_SECRET=<strong-random-string>
JWT_REFRESH_SECRET=<strong-random-string>

# 服务器 (必需)
PORT=8080
NODE_ENV=production

# 管理员 (必需)
ADMIN_INIT_KEY=<secure-random-string>

# CORS (必需, 前端地址)
ALLOWED_ORIGINS=https://your-frontend-domain.com

# 前端API (必需)
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

---

## 🐳 Docker本地测试

```bash
# 复制Docker环境变量
cp .env.docker .env

# 启动完整栈(前端+后端+数据库)
docker-compose up -d

# 访问应用
# 前端: http://localhost:5173
# 后端: http://localhost:8080
# API文档: http://localhost:8080/api/docs
```

---

## 📦 项目包含的内容

- ✅ 完整的React前端 (React 18 + Vite)
- ✅ Express后端 (TypeScript + Prisma)
- ✅ MySQL数据库schema (7个表)
- ✅ JWT认证系统
- ✅ 角色权限管理 (RBAC)
- ✅ 审计日志系统
- ✅ Excel导出功能
- ✅ 文件上传处理
- ✅ API文档 (Swagger)
- ✅ 测试用例
- ✅ Docker配置
- ✅ 部署文档

---

## ⚡ 部署时间表

| 步骤 | 时间 | 说明 |
|------|------|------|
| GitHub推送 | 5分钟 | 提交代码到GitHub |
| Zeabur创建 | 2分钟 | 创建项目并连接GitHub |
| 前端部署 | 5分钟 | 配置和部署 |
| 后端部署 | 5分钟 | 配置和部署 |
| 数据库配置 | 5分钟 | 初始化和迁移 |
| 域名配置 | 5分钟 | 设置自定义域名 |
| **总计** | **27分钟** | 完整的上线流程 |

---

## ✅ 上线检查清单

- [ ] GitHub仓库已创建并推送
- [ ] Zeabur项目已创建
- [ ] 前端部署成功
- [ ] 后端部署成功
- [ ] 数据库迁移成功
- [ ] 环境变量已配置
- [ ] 域名已解析
- [ ] HTTPS已启用
- [ ] 能访问前端页面
- [ ] 能创建管理员
- [ ] 能登录系统
- [ ] 核心功能正常

---

## 🆘 常见问题速查

| 问题 | 解决方案 |
|------|---------|
| CORS错误 | 更新 `ALLOWED_ORIGINS` |
| 连接被拒绝 | 检查 `DATABASE_URL` |
| 登录失败 | 检查 JWT 密钥是否正确 |
| 前端无法加载 | 检查 `VITE_API_BASE_URL` |
| 上传失败 | 检查用户权限和文件大小 |

详见: `ZEABUR_DEPLOYMENT_GUIDE.md` 的故障排查部分

---

## 📞 获取帮助

- Zeabur官方文档: https://zeabur.com/docs
- 项目详细文档: 查看项目目录中的 `*.md` 文件
- GitHub仓库: https://github.com/your-username/fenghan_stock_new

---

## 🎓 生成安全密钥

```bash
# macOS/Linux
openssl rand -hex 32

# 或使用node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

**项目准备完毕！** 🚀

下一步: 推送到GitHub并在Zeabur部署

---

*最后更新: 2025-11-16*
*版本: 1.0*
