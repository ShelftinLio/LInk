# LInk

<div align="center">
  <img src="public/logo.png" alt="LInk Logo" width="120" height="120">
  <h3>AI Native Markdown 写作助手</h3>
  <p>一个功能强大的 AI 驱动的 Markdown 文本编辑器，为现代写作提供智能辅助</p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
</div>

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

### 🤖 AI 智能写作
- **📝 全文总结** - 智能提取文档核心要点，生成精准摘要
- **📄 全文摘要** - 快速生成文档概览，把握整体脉络
- **🌍 多语言翻译** - 支持多种语言互译，打破语言壁垒
- **🗂️ 大纲生成** - 自动分析文档结构，生成清晰大纲
- **🧠 思维导图** - 将文档内容转化为可视化思维导图
- **✍️ 选中文本处理** - 对选中内容进行续写、改写、总结等操作

### 📝 强大编辑器
- **Monaco Editor** - 基于 VS Code 的专业代码编辑器
- **实时预览** - 支持编辑、预览、分屏三种模式
- **语法高亮** - 完整的 Markdown 语法支持
- **智能格式化** - 自动格式化和美化文档
- **撤销重做** - 完整的编辑历史管理
- **选择工具栏** - 选中文本时显示快捷操作工具

### 📁 文件管理
- **本地存储** - 所有文档数据保存在本地浏览器
- **最近文件** - 快速访问最近编辑的文档
- **文档统计** - 实时显示字数、字符数、行数
- **导入导出** - 支持 Markdown 文件的导入和导出

### 🔌 多 AI 服务支持
- **OpenAI** - GPT-4, GPT-4-turbo, GPT-3.5-turbo
- **Anthropic Claude** - Claude-3-opus, Claude-3-sonnet, Claude-3-haiku
- **Google Gemini** - Gemini-pro, Gemini-pro-vision
- **Azure OpenAI** - 企业级 OpenAI 服务
- **DeepSeek** - 国产优秀大语言模型
- **硅基流动** - 高性价比 AI 服务
- **智谱 GLM** - 清华大学智谱 AI
- **自定义 API** - 支持兼容 OpenAI 格式的任意服务

## 🛠 技术栈

### 核心技术
- **前端框架**: React 18 + TypeScript - 现代化的类型安全开发
- **构建工具**: Vite - 极速的开发构建体验
- **样式方案**: Tailwind CSS - 原子化 CSS 框架
- **编辑器**: Monaco Editor - VS Code 同款编辑器内核

### 功能库
- **图标库**: Lucide React - 精美的 SVG 图标集
- **状态管理**: Zustand - 轻量级状态管理
- **Markdown 解析**: Marked - 高性能 Markdown 解析器
- **HTML 净化**: DOMPurify - 防止 XSS 攻击
- **工具函数**: clsx - 条件类名组合

### 开发工具
- **代码检查**: ESLint + TypeScript ESLint
- **CSS 处理**: PostCSS + Autoprefixer
- **类型定义**: 完整的 TypeScript 类型支持

## 📁 项目结构

```
LInk/
├── src/
│   ├── components/              # React 组件
│   │   ├── Editor.tsx           # 主编辑器组件 (Monaco Editor)
│   │   ├── Sidebar.tsx          # 文件管理侧边栏
│   │   ├── AIPanel.tsx          # AI 功能面板
│   │   ├── SettingsModal.tsx    # 设置模态框
│   │   └── SelectionToolbar.tsx # 文本选择工具栏
│   ├── services/                # 业务逻辑服务
│   │   ├── aiService.ts         # AI 服务管理
│   │   ├── fileService.ts       # 文件操作服务
│   │   └── promptService.ts     # 提示词模板管理
│   ├── App.tsx                  # 主应用组件
│   ├── main.tsx                 # 应用入口
│   └── index.css                # 全局样式
├── public/
│   └── logo.png                 # 应用图标
├── .gitignore                   # Git 忽略文件
├── PRIVACY_AUDIT.md             # 隐私审查报告
├── README.md                    # 项目说明
├── SETUP.md                     # 安装指南
├── package.json                 # 项目配置
├── vite.config.ts               # Vite 配置
├── tailwind.config.js           # Tailwind 配置
├── tsconfig.json                # TypeScript 配置
└── start.sh                     # 启动脚本
```

## ⚙️ 配置说明

### 🔧 AI 服务配置

1. **打开设置面板**
   - 点击右上角的设置图标 ⚙️
   - 选择 "AI 配置" 标签

2. **选择 AI 服务商**
   - 从下拉菜单中选择您偏好的 AI 服务商
   - 系统支持多个服务商同时配置

3. **配置 API 密钥**
   - 输入对应服务商的 API Key
   - 可选择性配置自定义 Base URL
   - 选择合适的模型和参数

4. **测试连接**
   - 点击 "测试连接" 验证配置是否正确
   - 系统会发送测试请求验证 API 可用性

5. **保存配置**
   - 配置成功后点击保存
   - 所有配置数据仅保存在本地浏览器中

### 🤖 支持的 AI 服务商

| 服务商 | 获取方式 | 支持模型 | 特点 |
|--------|----------|----------|------|
| **OpenAI** | [OpenAI 官网](https://platform.openai.com/) | GPT-4, GPT-4-turbo, GPT-3.5-turbo | 业界领先，功能强大 |
| **Anthropic Claude** | [Anthropic 官网](https://console.anthropic.com/) | Claude-3-opus, Claude-3-sonnet, Claude-3-haiku | 安全可靠，长文本处理优秀 |
| **Google Gemini** | [Google AI Studio](https://makersuite.google.com/) | Gemini-pro, Gemini-pro-vision | 多模态支持，免费额度 |
| **Azure OpenAI** | [Azure 门户](https://portal.azure.com/) | 企业部署的 OpenAI 模型 | 企业级安全，数据合规 |
| **DeepSeek** | [DeepSeek 官网](https://platform.deepseek.com/) | DeepSeek-chat, DeepSeek-coder | 国产优秀模型，性价比高 |
| **硅基流动** | [硅基流动官网](https://siliconflow.cn/) | 多种开源模型 | 高性价比，模型丰富 |
| **智谱 GLM** | [智谱 AI](https://open.bigmodel.cn/) | GLM-4, GLM-3-turbo | 清华技术，中文优化 |
| **自定义 API** | 自建服务 | 兼容 OpenAI 格式 | 灵活自定义，私有部署 |

### 🎛️ 高级配置

- **最大 Token 数**: 控制 AI 响应的长度 (1-4096)
- **温度参数**: 控制输出的创造性 (0-2)
- **自定义模型**: 支持添加服务商的新模型
- **提示词模板**: 自定义 AI 处理的提示词模板

## 🎯 使用方法

### 📝 基础编辑

1. **文档管理**
   - 点击左侧文件夹图标展开文件管理面板
   - 点击 "新建文档" 创建新的 Markdown 文档
   - 从最近文件列表中选择已有文档

2. **编辑模式**
   - **编辑模式**: 专注写作，使用 Monaco Editor 进行编辑
   - **预览模式**: 查看 Markdown 渲染效果
   - **分屏模式**: 同时编辑和预览，提高效率

3. **快捷操作**
   - 使用工具栏快速插入格式化元素
   - 支持 Ctrl+Z/Cmd+Z 撤销，Ctrl+Y/Cmd+Y 重做
   - 实时显示文档统计信息（字数、字符数、行数）

### 🤖 AI 智能辅助

#### 全文处理
1. **打开 AI 面板**
   - 点击右上角的 "AI 助手" 按钮 ✨
   - 选择需要的 AI 功能

2. **功能选择**
   - **全文总结**: 提取文档核心要点
   - **全文摘要**: 生成文档概览
   - **多语言翻译**: 翻译整篇文档
   - **大纲生成**: 分析文档结构
   - **思维导图**: 生成可视化导图

3. **处理流程**
   - 选择功能后点击 "开始处理"
   - 等待 AI 生成结果
   - 复制结果或直接插入文档

#### 选中文本处理
1. **选择文本**
   - 在编辑器中选中需要处理的文本
   - 自动显示选择工具栏

2. **快捷操作**
   - **续写**: 基于选中内容继续写作
   - **改写**: 优化文本表达和语法
   - **总结**: 提取选中内容要点
   - **翻译**: 翻译选中文本

### 🔧 高级功能

- **自定义提示词**: 在设置中配置个性化的 AI 提示词模板
- **多服务商切换**: 根据需要在不同 AI 服务商间切换
- **文档导入导出**: 支持本地 Markdown 文件的导入和导出
- **响应式设计**: 完美适配桌面端和移动端

## 🔧 开发说明

### 📋 环境要求
- **Node.js**: 16.0+ (推荐使用 LTS 版本)
- **包管理器**: npm 或 yarn
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 🚀 快速开始

#### 方法一：使用启动脚本（推荐）
```bash
# 克隆项目
git clone https://github.com/ShelftinLio/LInk.git
cd LInk

# 使用启动脚本
chmod +x start.sh
./start.sh
```

#### 方法二：手动安装
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 🛠️ 开发命令

```bash
# 开发相关
npm run dev          # 启动开发服务器 (http://localhost:5173)
npm run build        # 构建生产版本
npm run preview      # 预览生产版本

# 代码质量
npm run lint         # ESLint 代码检查
npm run type-check   # TypeScript 类型检查
```

### 📁 开发指南

- **组件开发**: 所有 React 组件位于 `src/components/`
- **服务层**: 业务逻辑和 API 调用位于 `src/services/`
- **类型定义**: 使用 TypeScript 进行严格类型检查
- **样式规范**: 使用 Tailwind CSS 原子化类名
- **代码规范**: 遵循 ESLint 和 Prettier 配置

## 🗺️ 开发路线图

### 🎯 近期计划 (v0.1.x)
- [ ] **文件系统集成** - 支持本地文件夹管理
- [ ] **导出功能** - 支持 PDF、HTML、Word 格式导出
- [ ] **主题切换** - 深色模式和多主题支持
- [ ] **快捷键系统** - 完整的键盘快捷键支持

### 🚀 中期计划 (v0.2.x)
- [ ] **插件系统** - 支持第三方插件扩展
- [ ] **云端同步** - 支持多设备数据同步
- [ ] **协作编辑** - 实时多人协作功能
- [ ] **版本历史** - 文档版本管理和回滚

### 🌟 长期愿景 (v1.0+)
- [ ] **全文搜索** - 跨文档内容搜索
- [ ] **标签管理** - 文档分类和标签系统
- [ ] **AI 训练** - 个性化 AI 模型训练
- [ ] **移动端 App** - 原生移动应用

### 🔧 技术优化
- [ ] **性能优化** - 大文档处理性能提升
- [ ] **离线支持** - PWA 离线功能
- [ ] **国际化** - 多语言界面支持
- [ ] **无障碍** - 完善的可访问性支持

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是报告 Bug、提出新功能建议，还是提交代码改进。

### 🐛 报告问题
- 在 [GitHub Issues](https://github.com/ShelftinLio/LInk/issues) 中创建新的 issue
- 详细描述问题的重现步骤
- 提供浏览器版本、操作系统等环境信息

### 💡 功能建议
- 在 Issues 中使用 "Feature Request" 标签
- 详细描述功能需求和使用场景
- 如果可能，提供设计草图或参考

### 🔧 代码贡献
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 📝 文档贡献
- 改进 README 文档
- 添加代码注释
- 编写使用教程

## 🔒 隐私与安全

- **本地优先**: 所有文档数据仅存储在本地浏览器中
- **API 密钥安全**: API 密钥仅保存在本地，不会上传到任何服务器
- **无数据收集**: 不收集任何用户数据或使用统计
- **开源透明**: 所有代码开源，可审计安全性

详细的隐私审查报告请查看 [PRIVACY_AUDIT.md](PRIVACY_AUDIT.md)

## 📞 支持与反馈

- **GitHub Issues**: [提交问题和建议](https://github.com/ShelftinLio/LInk/issues)
- **GitHub Discussions**: [参与社区讨论](https://github.com/ShelftinLio/LInk/discussions)
- **项目主页**: [查看项目详情](https://github.com/ShelftinLio/LInk)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

特别感谢以下开源项目：
- [React](https://reactjs.org/) - 用户界面库
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 代码编辑器
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Lucide](https://lucide.dev/) - 图标库
- [Vite](https://vitejs.dev/) - 构建工具

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

```
MIT License

Copyright (c) 2024 Sean

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">
  <p>⭐ 如果这个项目对您有帮助，请给我们一个 Star！</p>
  <p>Made with ❤️ by <a href="https://github.com/ShelftinLio">Sean</a></p>
</div>