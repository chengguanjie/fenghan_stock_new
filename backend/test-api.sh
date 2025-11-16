#!/bin/bash

# 凤韩食品库存盘点系统 - 后端API测试脚本
# 测试日期: $(date)

BASE_URL="http://localhost:8080/api"
RESULTS_FILE="test-results.txt"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 初始化结果文件
echo "==================================" > $RESULTS_FILE
echo "凤韩食品库存盘点系统 - API测试报告" >> $RESULTS_FILE
echo "测试时间: $(date)" >> $RESULTS_FILE
echo "==================================" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_api() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    local token=$6
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}测试 $TOTAL_TESTS: $test_name${NC}"
    
    # 构建curl命令
    if [ -z "$token" ]; then
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    else
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        fi
    fi
    
    # 分离响应体和状态码
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    # 记录到文件
    echo "----------------------------------------" >> $RESULTS_FILE
    echo "测试 $TOTAL_TESTS: $test_name" >> $RESULTS_FILE
    echo "方法: $method $endpoint" >> $RESULTS_FILE
    echo "状态码: $status_code (期望: $expected_status)" >> $RESULTS_FILE
    echo "响应: $body" >> $RESULTS_FILE
    
    # 检查结果
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ 通过${NC}"
        echo "结果: ✓ 通过" >> $RESULTS_FILE
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ 失败 (状态码: $status_code, 期望: $expected_status)${NC}"
        echo "结果: ✗ 失败" >> $RESULTS_FILE
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo "" >> $RESULTS_FILE
    
    # 返回响应体供后续使用
    echo "$body"
}

echo ""
echo "==================================="
echo "开始API测试"
echo "==================================="
echo ""

# ==========================================
# 1. 健康检查测试
# ==========================================
echo "【1. 健康检查测试】"
test_api "健康检查" "GET" "/health" "" "200"
echo ""

# ==========================================
# 2. 认证API测试
# ==========================================
echo "【2. 认证API测试】"

# 2.1 注册管理员用户
echo "2.1 注册管理员用户"
register_response=$(test_api "注册管理员" "POST" "/auth/register" \
    '{"email":"admin@test.com","password":"Admin123!@#","name":"测试管理员","workshop":"测试车间","role":"admin"}' \
    "201")
echo ""

# 2.2 注册普通用户
echo "2.2 注册普通用户"
test_api "注册普通用户" "POST" "/auth/register" \
    '{"email":"user@test.com","password":"User123!@#","name":"测试用户","workshop":"生产车间","role":"viewer"}' \
    "201"
echo ""

# 2.3 登录管理员
echo "2.3 登录管理员"
login_response=$(test_api "管理员登录" "POST" "/auth/login" \
    '{"email":"admin@test.com","password":"Admin123!@#"}' \
    "200")
ADMIN_TOKEN=$(echo $login_response | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "管理员Token: ${ADMIN_TOKEN:0:50}..."
echo ""

# 2.4 登录普通用户
echo "2.4 登录普通用户"
user_login_response=$(test_api "普通用户登录" "POST" "/auth/login" \
    '{"email":"user@test.com","password":"User123!@#"}' \
    "200")
USER_TOKEN=$(echo $user_login_response | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "用户Token: ${USER_TOKEN:0:50}..."
echo ""

# 2.5 测试错误登录
echo "2.5 测试错误登录"
test_api "错误密码登录" "POST" "/auth/login" \
    '{"email":"admin@test.com","password":"wrongpassword"}' \
    "401"
echo ""

# 2.6 修改密码
echo "2.6 修改密码"
test_api "修改密码" "POST" "/auth/change-password" \
    '{"currentPassword":"Admin123!@#","newPassword":"NewAdmin123!@#"}' \
    "200" \
    "$ADMIN_TOKEN"
echo ""

# 2.7 用旧密码登录（应该失败）
echo "2.7 用旧密码登录（应该失败）"
test_api "旧密码登录" "POST" "/auth/login" \
    '{"email":"admin@test.com","password":"Admin123!@#"}' \
    "401"
echo ""

# 2.8 用新密码登录
echo "2.8 用新密码登录"
new_login_response=$(test_api "新密码登录" "POST" "/auth/login" \
    '{"email":"admin@test.com","password":"NewAdmin123!@#"}' \
    "200")
ADMIN_TOKEN=$(echo $new_login_response | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo ""

# ==========================================
# 3. 用户管理API测试
# ==========================================
echo "【3. 用户管理API测试】"

# 3.1 获取用户列表（管理员）
echo "3.1 管理员获取用户列表"
test_api "获取用户列表" "GET" "/users" "" "200" "$ADMIN_TOKEN"
echo ""

# 3.2 普通用户尝试获取用户列表（应该失败）
echo "3.2 普通用户获取用户列表（应该失败）"
test_api "普通用户获取列表" "GET" "/users" "" "403" "$USER_TOKEN"
echo ""

# 3.3 创建新用户（管理员）
echo "3.3 管理员创建新用户"
create_user_response=$(test_api "创建新用户" "POST" "/users" \
    '{"email":"newuser@test.com","password":"NewUser123!@#","name":"新用户","workshop":"包装车间","role":"viewer"}' \
    "201" \
    "$ADMIN_TOKEN")
NEW_USER_ID=$(echo $create_user_response | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "新用户ID: $NEW_USER_ID"
echo ""

# 3.4 获取单个用户详情
echo "3.4 获取用户详情"
test_api "获取用户详情" "GET" "/users/$NEW_USER_ID" "" "200" "$ADMIN_TOKEN"
echo ""

# 3.5 更新用户信息
echo "3.5 更新用户信息"
test_api "更新用户" "PUT" "/users/$NEW_USER_ID" \
    '{"name":"更新后的用户","workshop":"质检车间"}' \
    "200" \
    "$ADMIN_TOKEN"
echo ""

# 3.6 删除用户
echo "3.6 删除用户"
test_api "删除用户" "DELETE" "/users/$NEW_USER_ID" "" "200" "$ADMIN_TOKEN"
echo ""

# ==========================================
# 4. 库存盘点API测试
# ==========================================
echo "【4. 库存盘点API测试】"

# 首先需要创建一些库存物料数据
# 4.1 创建测试物料（通过数据库直接插入）
echo "4.1 准备测试物料数据..."
# 这里我们假设已经有物料数据，或者通过Excel上传

# 4.2 获取盘点记录列表
echo "4.2 获取盘点记录列表"
test_api "获取盘点记录" "GET" "/inventory/records" "" "200" "$USER_TOKEN"
echo ""

# 4.3 创建盘点记录（需要先有物料ID）
# 注意：这里需要实际的物料ID，暂时跳过
echo "4.3 创建盘点记录（需要物料数据）"
echo "跳过 - 需要先上传物料数据"
echo ""

# 4.4 批量提交测试
echo "4.4 批量提交盘点记录"
test_api "批量提交" "POST" "/inventory/records/batch/submit" \
    '{"recordIds":[]}' \
    "200" \
    "$USER_TOKEN"
echo ""

# ==========================================
# 5. 权限控制测试
# ==========================================
echo "【5. 权限控制测试】"

# 5.1 未认证访问
echo "5.1 未认证访问保护的端点"
test_api "未认证访问" "GET" "/users" "" "401"
echo ""

# 5.2 普通用户访问管理员端点
echo "5.2 普通用户访问管理员端点"
test_api "越权访问" "POST" "/users" \
    '{"email":"hack@test.com","password":"Hack123!@#","name":"黑客","workshop":"黑客车间","role":"admin"}' \
    "403" \
    "$USER_TOKEN"
echo ""

# 5.3 无效Token
echo "5.3 使用无效Token"
test_api "无效Token" "GET" "/users" "" "401" "invalid.token.here"
echo ""

# ==========================================
# 6. 登出测试
# ==========================================
echo "【6. 登出测试】"
test_api "用户登出" "POST" "/auth/logout" "" "200" "$USER_TOKEN"
echo ""

# ==========================================
# 测试总结
# ==========================================
echo ""
echo "==================================="
echo "测试完成"
echo "==================================="
echo "总测试数: $TOTAL_TESTS"
echo "通过: $PASSED_TESTS"
echo "失败: $FAILED_TESTS"
echo "成功率: $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%"
echo ""

# 写入总结到文件
echo "==================================" >> $RESULTS_FILE
echo "测试总结" >> $RESULTS_FILE
echo "==================================" >> $RESULTS_FILE
echo "总测试数: $TOTAL_TESTS" >> $RESULTS_FILE
echo "通过: $PASSED_TESTS" >> $RESULTS_FILE
echo "失败: $FAILED_TESTS" >> $RESULTS_FILE
echo "成功率: $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%" >> $RESULTS_FILE

echo "详细测试结果已保存到: $RESULTS_FILE"
