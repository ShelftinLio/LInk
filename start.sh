#!/bin/bash

# LInk 启动脚本
echo "🚀 正在启动 LInk..."

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js (https://nodejs.org/)"
    exit 1
fi

# 检查是否安装了 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请确保 Node.js 正确安装"
    exit 1
fi

echo "📦 正在安装依赖包..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装完成"
    echo "🌟 正在启动开发服务器..."
    npm run dev
else
    echo "❌ 依赖安装失败，请检查网络连接或手动运行 'npm install'"
    exit 1
fi