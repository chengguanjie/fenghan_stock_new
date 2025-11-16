# Zeabur 快速部署指南

## 5分钟快速开始

### 前置条件
- GitHub账户
- Zeabur账户 (https://zeabur.com)
- 已准备MySQL数据库(或使用Zeabur MySQL服务)

---

## 步骤1: 准备GitHub仓库

```bash
# 1. 初始化git(如果还没有)
git init

# 2. 添加所有文件
git add .

# 3. 提交更改
git commit -m "Initial commit: Zeabur deployment setup"

# 4. 创建main分支
git branch -M main

# 5. 添加远程仓库(替换your-username和your-repo)
git remote add origin https://github.com/your-username/fenghan_stock_new.git

# 6. 推送到GitHub
git push -u origin main
```

---

## 步骤2: 在Zeabur中设置项目

### 2.1 创建项目
1. 登录 https://zeabur.com
2. 点击"Create Project"
3. 输入项目名称: `fenghan_stock_new`
4. 选择区域(建议选择离用户最近的区域)
5. 点击"Create"

### 2.2 连接GitHub仓库
1. 在项目中点击"Add Service" > "GitHub"
2. 授权Zeabur访问GitHub
3. 选择仓库: `your-username/fenghan_stock_new`
4. 选择分支: `main`

---

## 步骤3: 部署前端

### 3.1 添加前端服务
1. 点击"Add Service" > "From Git"
2. 配置:
   - **Git Provider**: GitHub
   - **Repository**: fenghan_stock_new
   - **Branch**: main
   - **Root Directory**: `./` (项目根目录)

### 3.2 配置构建设置
1. 点击"Settings" > "Build"
2. 设置:
   - **Build Command**: `npm install && npm run build`
   - **Install Command**: `npm ci`
   - **Start Command**: `npm run preview` 或配置静态托管

### 3.3 配置环境变量
1. 进入"Environment"标签
2. 添加变量:
   ```
   VITE_API_BASE_URL=https://<backend-domain>/api
   ```

### 3.4 配置域名
1. 进入"Domains"标签
2. 点击"Add Domain"
3. 选择自定义域名或使用Zeabur提供的域名

---

## 步骤4: 部署后端

### 4.1 添加后端服务
1. 点击"Add Service" > "From Git"
2. 配置:
   - **Git Provider**: GitHub
   - **Repository**: fenghan_stock_new
   - **Branch**: main
   - **Root Directory**: `./backend`

### 4.2 配置构建设置
1. 点击"Settings" > "Build"
2. 设置:
   - **Build Command**: `npm install && npm run build`
   - **Install Command**: `npm ci`
   - **Start Command**: `npm start`

### 4.3 配置环境变量
点击"Environment"，添加以下变量(复制from `ZEABUR_ENV_TEMPLATE.md`):

```
DATABASE_URL=mysql://username:password@host:3306/fenghan_stock
JWT_ACCESS_SECRET=<generate-strong-random-string>
JWT_ACCESS_EXPIRY=2h
JWT_REFRESH_SECRET=<generate-strong-random-string>
JWT_REFRESH_EXPIRY=7d
PORT=8080
NODE_ENV=production
ADMIN_INIT_KEY=<secure-random-string>
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

> **⚠️ 重要**: 替换所有占位符为实际值！

### 4.4 配置域名
1. 进入"Domains"标签
2. 添加后端域名(e.g., `api.yourdomain.com`)

### 4.5 初始化数据库
在Zeabur控制台，使用命令执行迁移:
```bash
npx prisma db push
npx prisma db seed
```

---

## 步骤5: 配置CORS

后端环境变量 `ALLOWED_ORIGINS` 必须包含前端的完整域名:

```
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

更新后重新部署后端服务。

---

## 步骤6: 初始化管理员

### 6.1 首次访问
1. 打开前端URL: `https://your-frontend-domain.com`
2. 您应该看到初始化页面

### 6.2 创建管理员
1. 输入在 `ADMIN_INIT_KEY` 中设置的密钥
2. 输入管理员邮箱和密码
3. 点击"Create"

---

## 部署验证检查清单

### 前端验证
- [ ] 前端URL可访问
- [ ] 页面加载无错误
- [ ] CSS样式正确加载
- [ ] 控制台无红色错误

### 后端验证
- [ ] 后端API可响应: `https://<backend-domain>/api/health`
- [ ] Swagger文档可访问: `https://<backend-domain>/api/docs`
- [ ] 数据库连接正常

### 功能验证
- [ ] 能访问初始化页面
- [ ] 能创建管理员账户
- [ ] 能使用管理员账户登录
- [ ] 能浏览系统功能

---

## 常见问题解决

### 问题1: "连接被拒绝" 或 "CORS错误"
**原因**: CORS配置不正确或后端未启动

**解决方案**:
1. 检查后端是否成功部署
2. 验证 `ALLOWED_ORIGINS` 包含前端域名
3. 检查后端日志了解具体错误

### 问题2: "数据库连接失败"
**原因**: DATABASE_URL不正确或网络不可达

**解决方案**:
1. 验证 `DATABASE_URL` 格式正确
2. 检查数据库用户名/密码
3. 确认Zeabur可访问数据库(检查防火墙/IP白名单)

### 问题3: "管理员初始化失败"
**原因**: ADMIN_INIT_KEY不匹配或环境变量未生效

**解决方案**:
1. 检查后端 `ADMIN_INIT_KEY` 环境变量
2. 检查提交的密钥是否完全匹配
3. 重新部署后端服务后重试

### 问题4: "上传文件失败"
**原因**: 后端权限不足或存储配置不完整

**解决方案**:
1. 检查用户权限(需admin权限)
2. 检查后端日志
3. 验证上传文件格式(支持xlsx/xls)

---

## 监控与日志

### 查看日志
1. 在Zeabur项目中选择服务
2. 点击"Logs"标签
3. 实时查看应用日志

### 性能监控
1. 点击"Metrics"标签
2. 监控CPU、内存、请求数等

---

## 下一步

### 域名配置
1. 为前后端配置自定义域名
2. 设置DNS CNAME记录
3. 启用HTTPS(自动)

### 备份配置
1. 定期备份MySQL数据
2. 保存环境变量配置
3. 记录重要的初始化信息

### 性能优化
1. 启用CDN加速
2. 配置缓存策略
3. 优化数据库查询

---

## 生成安全密钥

### 在命令行生成
```bash
# 生成32字符的十六进制字符串
openssl rand -hex 32

# 或使用node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 在线生成工具
- https://generate-random.org/
- https://www.uuidgenerator.net/

---

## 参考资源

- **Zeabur官方文档**: https://zeabur.com/docs
- **Express文档**: https://expressjs.com
- **Prisma文档**: https://www.prisma.io/docs
- **React文档**: https://react.dev
- **Vite文档**: https://vitejs.dev

---

## 获取帮助

- Zeabur支持: https://discord.gg/zeabur
- 项目仓库Issue: https://github.com/your-username/fenghan_stock_new/issues
- 文档: 查看项目根目录中的 `ZEABUR_DEPLOYMENT_GUIDE.md`

---

**最后更新**: 2025-11-16  
**版本**: 1.0
