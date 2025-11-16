#!/bin/bash

# 测试后端 API 连接

echo "测试后端 API 健康检查..."
curl -s http://localhost:8080/health | jq .

echo -e "\n测试登录 API (需要有效的用户数据)..."
echo "请手动测试登录功能"
