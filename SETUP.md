# LInk 安装和使用指南

## 🚨 重要提示

当前项目显示的所有错误都是因为**缺少依赖包**导致的。这是正常现象，请按照以下步骤安装依赖即可解决所有问题。

## 📋 系统要求

- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器
- 现代浏览器（Chrome、Firefox、Safari、Edge）

## 🚀 快速开始

### 方法一：使用启动脚本（推荐）

```bash
# 进入项目目录
cd ai-writing

# 给启动脚本执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

### 方法二：手动安装

```bash
# 进入项目目录
cd ai-writing

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 🔧 安装依赖后的效果

安装完成后，所有当前显示的错误都会消失：

- ✅ React 和 TypeScript 模块将被正确识别
- ✅ Lucide React 图标库将可用
- ✅ Vite 构建工具将正常工作
- ✅ Tailwind CSS 样式将生效
- ✅ 所有组件将正常导入和使用

## 🌟 首次启动

1. **安装依赖**：运行 `npm install`
2. **启动服务器**：运行 `npm run dev`
3. **打开浏览器**：访问 `http://localhost:3000`
4. **配置 AI**：点击设置图标配置您的 AI API

## ⚙️ AI 配置步骤

1. 点击右上角的 ⚙️ 设置图标
2. 选择 "AI 配置" 标签
3. 选择您的 AI 服务商（OpenAI、Claude、Gemini 等）
4. 输入您的 API Key
5. 选择合适的模型
6. 调整参数（温度、最大令牌数等）
7. 点击 "测试连接" 验证配置
8. 保存配置

## 🎯 功能特性

### AI 写作功能
- **智能续写** - 基于上下文自动续写内容
- **内容改写** - 优化文本表达和语法
- **智能总结** - 自动生成文章摘要
- **风格调整** - 调整写作风格和语调
- **多语言翻译** - 支持多种语言翻译
- **大纲生成** - 自动生成文章结构

### 编辑器功能
- 实时 Markdown 预览
- 分屏编辑模式
- 语法高亮
- 自动保存
- 文档管理

### 支持的 AI 服务
- OpenAI (GPT-4, GPT-3.5)
- Anthropic Claude
- Google Gemini
- Azure OpenAI
- 自定义 API 端点

## 🛠 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint
```

## 📁 项目结构

```
ai-writing/
├── src/
│   ├── components/          # React 组件
│   │   ├── Editor.tsx       # 主编辑器组件
│   │   ├── Sidebar.tsx      # 侧边栏组件
│   │   ├── AIPanel.tsx      # AI 功能面板
│   │   └── SettingsModal.tsx # 设置模态框
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # 全局样式
├── public/                  # 静态资源
├── package.json             # 项目配置
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # Tailwind 配置
├── tsconfig.json            # TypeScript 配置
├── start.sh                 # 启动脚本
└── README.md                # 项目说明
```

## 🔍 故障排除

### 问题：模块找不到错误
**解决方案**：运行 `npm install` 安装依赖

### 问题：端口被占用
**解决方案**：
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程（替换 PID）
kill -9 <PID>

# 或者使用不同端口
npm run dev -- --port 3001
```

### 问题：AI 功能不工作
**解决方案**：
1. 检查 API Key 是否正确
2. 确认网络连接正常
3. 验证 API 服务商的配额和权限

## 📞 获取帮助

如果遇到问题：
1. 查看浏览器控制台的错误信息
2. 检查网络连接
3. 确认 Node.js 版本兼容性
4. 重新安装依赖：`rm -rf node_modules package-lock.json && npm install`

## 🎉 开始使用

安装完依赖后，您就可以开始使用这个强大的 AI 写作编辑器了！

1. 在左侧面板创建或选择文档
2. 在编辑器中输入内容
3. 选择文本后使用 AI 功能
4. 享受智能写作的便利！