# LInk

一个 AI Native 的 Markdown 文本编辑器，提供智能写作辅助功能。

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## ✨ 核心功能

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

### AI 服务支持
- OpenAI (GPT-4, GPT-3.5)
- Anthropic Claude
- Google Gemini
- Azure OpenAI
- 自定义 API 端点

## 🛠 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS
- **图标库**: Lucide React
- **状态管理**: Zustand
- **Markdown 处理**: Monaco Editor

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
└── tsconfig.json            # TypeScript 配置
```

## ⚙️ 配置说明

### AI API 配置

1. 点击右上角的设置图标
2. 选择 "AI 配置" 标签
3. 选择您的 AI 服务商
4. 输入 API Key 和相关配置
5. 点击 "测试连接" 验证配置
6. 保存配置

### 支持的 AI 服务商

#### OpenAI
- API Key: 从 OpenAI 官网获取
- 模型: gpt-4, gpt-4-turbo, gpt-3.5-turbo

#### Anthropic Claude
- API Key: 从 Anthropic 官网获取
- 模型: claude-3-opus, claude-3-sonnet, claude-3-haiku

#### Google Gemini
- API Key: 从 Google AI Studio 获取
- 模型: gemini-pro, gemini-pro-vision

#### Azure OpenAI
- API Key: 从 Azure 门户获取
- Base URL: Azure OpenAI 端点
- 模型: 部署的模型名称

#### 自定义 API
- 支持兼容 OpenAI API 格式的自定义服务
- 需要提供 Base URL 和 API Key

## 🎯 使用方法

### 基础编辑
1. 在左侧面板创建或选择文档
2. 在编辑器中输入 Markdown 内容
3. 使用工具栏切换编辑/预览模式

### AI 辅助写作
1. 选择文本内容
2. 点击右上角的 "AI 助手" 按钮
3. 选择所需的 AI 功能
4. 点击 "开始处理" 生成内容
5. 将生成的内容插入到文档中

## 🔧 开发说明

### 环境要求
- Node.js 16+
- npm 或 yarn

### 开发命令
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run lint

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 📝 待实现功能

- [ ] 文件系统集成
- [ ] 导出功能 (PDF, HTML, Word)
- [ ] 主题切换
- [ ] 插件系统
- [ ] 协作编辑
- [ ] 版本历史
- [ ] 全文搜索
- [ ] 标签管理

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 📄 许可证

MIT License