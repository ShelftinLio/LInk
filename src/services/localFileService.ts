import { FileDocument } from './fileService';

export interface FolderNode {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: FolderNode[];
  parent?: string;
  extension?: string;
  size?: number;
  lastModified?: Date;
}

export interface WorkspaceConfig {
  rootPath: string;
  watchedExtensions: string[];
  excludePatterns: string[];
}

export class LocalFileSystemService {
  private static workspaceConfig: WorkspaceConfig | null = null;
  private static directoryHandle: FileSystemDirectoryHandle | null = null;
  
  // 设置工作区
  static async setWorkspace(directoryHandle: FileSystemDirectoryHandle): Promise<void> {
    try {
      // 存储目录句柄到IndexedDB
      await this.storeDirectoryHandle(directoryHandle);
      this.directoryHandle = directoryHandle;
      
      this.workspaceConfig = {
        rootPath: directoryHandle.name,
        watchedExtensions: ['.md', '.markdown', '.txt', '.docx', '.doc'],
        excludePatterns: ['node_modules', '.git', '.DS_Store']
      };
    } catch (error) {
      console.error('设置工作区失败:', error);
      throw error;
    }
  }
  
  // 获取文件夹结构
  static async getFolderStructure(): Promise<FolderNode[]> {
    const directoryHandle = await this.getStoredDirectoryHandle();
    if (!directoryHandle) {
      throw new Error('未设置工作区');
    }
    
    return await this.buildFolderTree(directoryHandle, '');
  }
  
  // 构建文件夹树
  private static async buildFolderTree(
    directoryHandle: FileSystemDirectoryHandle, 
    parentPath: string
  ): Promise<FolderNode[]> {
    const nodes: FolderNode[] = [];
    
    try {
      // @ts-ignore - File System Access API types
      for await (const [name, handle] of directoryHandle.entries()) {
        if (this.shouldExclude(name)) continue;
        
        const currentPath = parentPath ? `${parentPath}/${name}` : name;
        
        if (handle.kind === 'directory') {
          const folderNode: FolderNode = {
            id: currentPath,
            name,
            path: currentPath,
            type: 'folder',
            children: await this.buildFolderTree(handle, currentPath)
          };
          nodes.push(folderNode);
        } else if (handle.kind === 'file') {
          const file = await handle.getFile();
          const extension = this.getFileExtension(name);
          
          if (this.workspaceConfig?.watchedExtensions.includes(extension)) {
            const fileNode: FolderNode = {
              id: currentPath,
              name,
              path: currentPath,
              type: 'file',
              extension,
              size: file.size,
              lastModified: new Date(file.lastModified)
            };
            nodes.push(fileNode);
          }
        }
      }
    } catch (error) {
      console.error('构建文件夹树失败:', error);
    }
    
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }
  
  // 读取文件内容
  static async readFile(filePath: string): Promise<FileDocument> {
    const directoryHandle = await this.getStoredDirectoryHandle();
    if (!directoryHandle) {
      throw new Error('未设置工作区');
    }
    
    const fileHandle = await this.getFileHandle(directoryHandle, filePath);
    const file = await fileHandle.getFile();
    
    let content: string;
    const extension = this.getFileExtension(filePath);
    
    if (extension === '.docx' || extension === '.doc') {
      content = await this.readWordFile(file);
    } else {
      content = await file.text();
    }
    
    return {
      id: filePath,
      title: this.getFileName(filePath),
      content,
      filePath,
      createdAt: new Date(file.lastModified),
      updatedAt: new Date(file.lastModified),
      size: file.size
    };
  }
  
  // 保存文件
  static async saveFile(document: FileDocument): Promise<void> {
    const directoryHandle = await this.getStoredDirectoryHandle();
    if (!directoryHandle) {
      throw new Error('未设置工作区');
    }
    
    const fileHandle = await this.getFileHandle(directoryHandle, document.filePath, true);
    const writable = await fileHandle.createWritable();
    
    const extension = this.getFileExtension(document.filePath);
    if (extension === '.docx') {
      const docxBuffer = await this.createWordFile(document.content, document.title);
      await writable.write(docxBuffer);
    } else {
      await writable.write(document.content);
    }
    
    await writable.close();
    
    // 更新文档信息
    document.updatedAt = new Date();
    document.size = new Blob([document.content]).size;
  }
  
  // 创建新文件
  static async createFile(folderPath: string, fileName: string, content: string = ''): Promise<FileDocument> {
    const directoryHandle = await this.getStoredDirectoryHandle();
    if (!directoryHandle) {
      throw new Error('未设置工作区');
    }
    
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    const fileHandle = await this.getFileHandle(directoryHandle, filePath, true);
    
    const writable = await fileHandle.createWritable();
    await writable.write(content || `# ${fileName.replace(/\.[^/.]+$/, '')}\n\n开始写作...`);
    await writable.close();
    
    return {
      id: filePath,
      title: fileName,
      content: content || `# ${fileName.replace(/\.[^/.]+$/, '')}\n\n开始写作...`,
      filePath,
      createdAt: new Date(),
      updatedAt: new Date(),
      size: content.length
    };
  }
  
  // 创建文件夹
  static async createFolder(parentPath: string, folderName: string): Promise<void> {
    const directoryHandle = await this.getStoredDirectoryHandle();
    if (!directoryHandle) {
      throw new Error('未设置工作区');
    }
    
    const folderPath = parentPath ? `${parentPath}/${folderName}` : folderName;
    await this.getDirectoryHandle(directoryHandle, folderPath, true);
  }
  
  // 删除文件或文件夹
  static async deleteItem(itemPath: string): Promise<void> {
    const directoryHandle = await this.getStoredDirectoryHandle();
    if (!directoryHandle) {
      throw new Error('未设置工作区');
    }
    
    const pathParts = itemPath.split('/');
    const itemName = pathParts.pop()!;
    const parentPath = pathParts.join('/');
    
    const parentHandle = parentPath 
      ? await this.getDirectoryHandle(directoryHandle, parentPath)
      : directoryHandle;
    
    await parentHandle.removeEntry(itemName, { recursive: true });
  }
  
  // 检查是否支持File System Access API
  static isSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }
  
  // 工具方法
  private static async storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['directories'], 'readwrite');
      const store = transaction.objectStore('directories');
      await new Promise<void>((resolve, reject) => {
        const putRequest = store.put(handle, 'workspace');
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      });
    } catch (error) {
      console.error('存储目录句柄失败:', error);
    }
  }
  
  static async getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    if (this.directoryHandle) {
      return this.directoryHandle;
    }
    
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['directories'], 'readonly');
      const store = transaction.objectStore('directories');
      const result = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
        const getRequest = store.get('workspace');
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      });
      this.directoryHandle = result;
      return result;
    } catch {
      return null;
    }
  }
  
  private static async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LInkFileSystem', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('directories')) {
          db.createObjectStore('directories');
        }
      };
    });
  }
  
  private static shouldExclude(name: string): boolean {
    return this.workspaceConfig?.excludePatterns.some(pattern => 
      name.includes(pattern)
    ) || false;
  }
  
  private static getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot) : '';
  }
  
  private static getFileName(filePath: string): string {
    return filePath.split('/').pop() || filePath;
  }
  
  private static async getFileHandle(
    directoryHandle: FileSystemDirectoryHandle,
    filePath: string,
    create: boolean = false
  ): Promise<FileSystemFileHandle> {
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop()!;
    
    let currentHandle = directoryHandle;
    for (const part of pathParts) {
      if (part) {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create });
      }
    }
    
    return await currentHandle.getFileHandle(fileName, { create });
  }
  
  private static async getDirectoryHandle(
    directoryHandle: FileSystemDirectoryHandle,
    folderPath: string,
    create: boolean = false
  ): Promise<FileSystemDirectoryHandle> {
    const pathParts = folderPath.split('/').filter(part => part);
    
    let currentHandle = directoryHandle;
    for (const part of pathParts) {
      currentHandle = await currentHandle.getDirectoryHandle(part, { create });
    }
    
    return currentHandle;
  }
  
  // Word文件处理方法
  private static async readWordFile(file: File): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.default.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('读取Word文件失败:', error);
      // 如果mammoth解析失败，尝试作为纯文本读取
      try {
        return await file.text();
      } catch {
        throw new Error('读取Word文件失败，请确保文件格式正确');
      }
    }
  }
  
  private static async createWordFile(content: string, title: string): Promise<ArrayBuffer> {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      
      // 解析Markdown内容为Word段落
      const paragraphs = this.parseMarkdownToWordParagraphs(content);
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      });
      
      return await Packer.toBuffer(doc);
    } catch (error) {
      console.error('创建Word文件失败:', error);
      throw new Error('创建Word文件失败');
    }
  }
  
  private static parseMarkdownToWordParagraphs(content: string): any[] {
    const lines = content.split('\n');
    const paragraphs: any[] = [];
    
    for (const line of lines) {
      if (line.trim() === '') {
        // 空行
        const { Paragraph } = require('docx');
        paragraphs.push(new Paragraph({ children: [] }));
      } else if (line.startsWith('# ')) {
        // 一级标题
        const { Paragraph, TextRun, HeadingLevel } = require('docx');
        paragraphs.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun(line.substring(2))]
        }));
      } else if (line.startsWith('## ')) {
        // 二级标题
        const { Paragraph, TextRun, HeadingLevel } = require('docx');
        paragraphs.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun(line.substring(3))]
        }));
      } else if (line.startsWith('### ')) {
        // 三级标题
        const { Paragraph, TextRun, HeadingLevel } = require('docx');
        paragraphs.push(new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun(line.substring(4))]
        }));
      } else {
        // 普通段落
        const { Paragraph, TextRun } = require('docx');
        paragraphs.push(new Paragraph({
          children: [new TextRun(line)]
        }));
      }
    }
    
    return paragraphs;
  }
}