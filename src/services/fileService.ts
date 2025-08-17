// 文件管理服务 - 处理本地文件的读取、写入和管理

export interface FileDocument {
  id: string;
  title: string;
  content: string;
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
  size: number;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  lastModified: Date;
  isDirectory: boolean;
}

// 文件管理类
export class FileService {
  private static readonly WORKSPACE_KEY = 'ai-writing-workspace';
  private static readonly RECENT_FILES_KEY = 'ai-writing-recent-files';
  
  // 获取工作区路径
  static getWorkspacePath(): string | null {
    try {
      return localStorage.getItem(this.WORKSPACE_KEY);
    } catch (error) {
      console.error('获取工作区路径失败:', error);
      return null;
    }
  }
  
  // 设置工作区路径
  static setWorkspacePath(path: string): void {
    try {
      localStorage.setItem(this.WORKSPACE_KEY, path);
    } catch (error) {
      console.error('设置工作区路径失败:', error);
    }
  }
  
  // 获取最近打开的文件
  static getRecentFiles(): FileDocument[] {
    try {
      const recent = localStorage.getItem(this.RECENT_FILES_KEY);
      if (recent) {
        const files = JSON.parse(recent);
        return files.map((file: any) => ({
          ...file,
          createdAt: new Date(file.createdAt),
          updatedAt: new Date(file.updatedAt)
        }));
      }
    } catch (error) {
      console.error('获取最近文件失败:', error);
    }
    return this.getDefaultDocuments();
  }
  
  // 添加到最近文件
  static addToRecentFiles(document: FileDocument): void {
    try {
      const recent = this.getRecentFiles();
      const filtered = recent.filter(doc => doc.id !== document.id);
      const updated = [document, ...filtered].slice(0, 10); // 保留最近10个文件
      localStorage.setItem(this.RECENT_FILES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('添加最近文件失败:', error);
    }
  }
  
  // 获取默认文档（当没有最近文件时）
  static getDefaultDocuments(): FileDocument[] {
    return [
      {
        id: 'welcome',
        title: '欢迎使用 LInk',
      content: `# 欢迎使用 LInk

这是一个 AI Native 的 Markdown 文本编辑器，支持本地文件管理。

## ✨ 主要功能

### 📁 本地文件管理
- **打开本地文件** - 支持 .md, .txt, .markdown 等格式
- **自动保存** - 编辑内容自动保存到本地文件
- **工作区管理** - 设置常用的工作目录
- **最近文件** - 快速访问最近编辑的文件

### 🤖 AI 写作助手
- **智能续写** - 基于上下文自动续写内容
- **内容改写** - 优化文本表达和语法
- **智能总结** - 自动生成文章摘要
- **多语言翻译** - 支持多种语言翻译
- **大纲生成** - 自动生成文章结构

### 🎯 编辑器特性
- **实时预览** - Markdown 实时渲染
- **分屏模式** - 编辑/预览/分屏切换
- **格式化工具** - 快捷插入 Markdown 格式
- **快捷键支持** - 提高编辑效率

## 🚀 开始使用

1. **设置工作区** - 点击左上角文件夹图标选择工作目录
2. **打开文件** - 从工作区选择现有文件或创建新文件
3. **配置 AI** - 在设置中配置您的 AI API Key
4. **开始写作** - 享受 AI 辅助的智能写作体验

## 📝 支持的文件格式

- **.md** - Markdown 文件
- **.markdown** - Markdown 文件
- **.txt** - 纯文本文件
- **.mdown** - Markdown 文件

开始您的 AI 辅助写作之旅吧！`,
        filePath: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: 0
      },
      {
        id: 'getting-started',
        title: '快速开始指南',
        content: `# 快速开始指南

## 📂 文件管理

### 设置工作区
1. 点击左侧边栏顶部的文件夹图标
2. 选择您常用的工作目录
3. 工作区设置后会自动扫描该目录下的 Markdown 文件

### 打开文件
- **从工作区打开**：在左侧文件列表中点击文件名
- **拖拽打开**：将文件拖拽到编辑器区域
- **新建文件**：点击"新建文档"按钮

### 保存文件
- **自动保存**：编辑内容会自动保存到文件
- **另存为**：使用 Ctrl/Cmd + S 另存为新文件

## 🤖 AI 功能配置

### 支持的 AI 服务
- **OpenAI** - GPT-4, GPT-3.5 Turbo
- **Deepseek** - deepseek-chat, deepseek-coder
- **硅基流动** - qwen 系列模型
- **GLM** - ChatGLM 系列
- **Claude** - Claude-3 系列
- **Gemini** - Gemini Pro 系列

### 配置步骤
1. 点击右上角设置图标
2. 选择"AI 配置"标签
3. 选择您的 AI 服务商
4. 输入 API Key 和相关配置
5. 点击"测试连接"验证配置
6. 保存配置

## ⌨️ 快捷键

### 编辑快捷键
- **Ctrl/Cmd + B** - 粗体
- **Ctrl/Cmd + I** - 斜体
- **Ctrl/Cmd + K** - 插入链接
- **Ctrl/Cmd + \`** - 行内代码
- **Tab** - 缩进

### 文件快捷键
- **Ctrl/Cmd + N** - 新建文件
- **Ctrl/Cmd + O** - 打开文件
- **Ctrl/Cmd + S** - 保存文件

## 🎨 界面说明

### 左侧边栏
- **工作区文件** - 显示工作区内的所有 Markdown 文件
- **最近文件** - 显示最近编辑的文件
- **新建文档** - 创建新的 Markdown 文件

### 编辑器区域
- **编辑模式** - 纯文本编辑
- **预览模式** - Markdown 渲染预览
- **分屏模式** - 同时显示编辑和预览

### AI 助手面板
- **选择功能** - 续写、改写、总结、翻译、大纲
- **处理文本** - 可以处理选中文本或整个文档
- **结果操作** - 复制结果或插入到文档

开始探索 LInk 的强大功能吧！`,
        filePath: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: 0
      }
    ];
  }
  
  // 读取文件内容
  static async readFile(filePath: string): Promise<string> {
    try {
      // 在浏览器环境中，我们使用 File API
      // 这里提供一个基础实现，实际使用时需要用户选择文件
      return new Promise((resolve, reject) => {
        const input = window.document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,.txt,.mdown';
        
        input.onchange = (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve(e.target?.result as string || '');
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
          } else {
            reject(new Error('未选择文件'));
          }
        };
        
        input.click();
      });
    } catch (error) {
      console.error('读取文件失败:', error);
      throw error;
    }
  }
  
  // 保存文件内容
  static async saveFile(document: FileDocument): Promise<void> {
    try {
      // 在浏览器环境中，我们使用下载的方式保存文件
      const blob = new Blob([document.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.title.endsWith('.md') ? document.title : `${document.title}.md`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      // 更新文档信息
      document.updatedAt = new Date();
      document.size = new Blob([document.content]).size;
      
      // 添加到最近文件
      this.addToRecentFiles(document);
    } catch (error) {
      console.error('保存文件失败:', error);
      throw error;
    }
  }
  
  // 创建新文档
  static createNewDocument(title: string = '新文档'): FileDocument {
    return {
      id: Date.now().toString(),
      title: title.endsWith('.md') ? title : `${title}.md`,
      content: `# ${title}\n\n开始写作...`,
      filePath: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      size: 0
    };
  }
  
  // 打开文件对话框
  static async openFileDialog(): Promise<FileDocument | null> {
    try {
      const content = await this.readFile('');
      const document = this.createNewDocument('导入的文档');
      document.content = content;
      document.size = new Blob([content]).size;
      
      this.addToRecentFiles(document);
      return document;
    } catch (error) {
      console.error('打开文件失败:', error);
      return null;
    }
  }
  
  // 导出文档
  static async exportDocument(document: FileDocument, format: 'md' | 'txt' | 'html' = 'md'): Promise<void> {
    try {
      let content = document.content;
      let mimeType = 'text/markdown';
      let extension = 'md';
      
      switch (format) {
        case 'txt':
          mimeType = 'text/plain';
          extension = 'txt';
          break;
        case 'html':
          // 这里可以集成 Markdown 到 HTML 的转换
          mimeType = 'text/html';
          extension = 'html';
          content = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>${document.title}</title>\n</head>\n<body>\n<pre>${content}</pre>\n</body>\n</html>`;
          break;
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.title.replace(/\.[^/.]+$/, '')}.${extension}`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出文档失败:', error);
      throw error;
    }
  }
  
  // 清理最近文件列表
  static clearRecentFiles(): void {
    try {
      localStorage.removeItem(this.RECENT_FILES_KEY);
    } catch (error) {
      console.error('清理最近文件失败:', error);
    }
  }
  
  // 获取文件统计信息
  static getFileStats(document: FileDocument): { words: number; characters: number; lines: number } {
    const content = document.content;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const characters = content.length;
    const lines = content.split('\n').length;
    
    return { words, characters, lines };
  }
}