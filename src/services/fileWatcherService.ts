// 文件监控服务 - 实现类似VSCode的实时文件监控

export interface FileChangeEvent {
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  path: string;
  oldPath?: string; // 用于重命名事件
  timestamp: number;
}

type FileChangeListener = (event: FileChangeEvent) => void;

export class FileWatcherService {
  private static listeners: Set<FileChangeListener> = new Set();
  private static isWatching = false;
  private static watchInterval: number | null = null;
  private static lastSnapshot: Map<string, { size: number; lastModified: number }> = new Map();
  private static directoryHandle: FileSystemDirectoryHandle | null = null;
  
  // 开始监控文件系统
  static async startWatching(directoryHandle: FileSystemDirectoryHandle): Promise<void> {
    if (this.isWatching) {
      return;
    }
    
    this.directoryHandle = directoryHandle;
    this.isWatching = true;
    
    // 初始化文件快照
    await this.createSnapshot();
    
    // 开始定时检查
    this.watchInterval = window.setInterval(async () => {
      await this.checkForChanges();
    }, 2000); // 每2秒检查一次
    
    console.log('文件监控已启动');
  }
  
  // 停止监控
  static stopWatching(): void {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
    
    this.isWatching = false;
    this.lastSnapshot.clear();
    this.directoryHandle = null;
    
    console.log('文件监控已停止');
  }
  
  // 添加文件变化监听器
  static addListener(listener: FileChangeListener): void {
    this.listeners.add(listener);
  }
  
  // 移除文件变化监听器
  static removeListener(listener: FileChangeListener): void {
    this.listeners.delete(listener);
  }
  
  // 手动触发检查
  static async forceCheck(): Promise<void> {
    if (this.directoryHandle) {
      await this.checkForChanges();
    }
  }
  
  // 创建文件系统快照
  private static async createSnapshot(): Promise<void> {
    if (!this.directoryHandle) return;
    
    this.lastSnapshot.clear();
    await this.scanDirectory(this.directoryHandle, '');
  }
  
  // 扫描目录并记录文件信息
  private static async scanDirectory(
    directoryHandle: FileSystemDirectoryHandle, 
    currentPath: string
  ): Promise<void> {
    try {
      // @ts-ignore - File System Access API
      for await (const [name, handle] of directoryHandle.entries()) {
        if (this.shouldExclude(name)) continue;
        
        const fullPath = currentPath ? `${currentPath}/${name}` : name;
        
        if (handle.kind === 'file') {
          try {
            const file = await handle.getFile();
            this.lastSnapshot.set(fullPath, {
              size: file.size,
              lastModified: file.lastModified
            });
          } catch (error) {
            console.warn(`无法读取文件信息: ${fullPath}`, error);
          }
        } else if (handle.kind === 'directory') {
          // 递归扫描子目录
          await this.scanDirectory(handle, fullPath);
        }
      }
    } catch (error) {
      console.error('扫描目录失败:', error);
    }
  }
  
  // 检查文件变化
  private static async checkForChanges(): Promise<void> {
    if (!this.directoryHandle) return;
    
    const currentSnapshot = new Map<string, { size: number; lastModified: number }>();
    await this.scanDirectoryForChanges(this.directoryHandle, '', currentSnapshot);
    
    // 比较快照，检测变化
    await this.compareSnapshots(currentSnapshot);
    
    // 更新快照
    this.lastSnapshot = currentSnapshot;
  }
  
  // 扫描目录用于变化检测
  private static async scanDirectoryForChanges(
    directoryHandle: FileSystemDirectoryHandle,
    currentPath: string,
    snapshot: Map<string, { size: number; lastModified: number }>
  ): Promise<void> {
    try {
      // @ts-ignore - File System Access API
      for await (const [name, handle] of directoryHandle.entries()) {
        if (this.shouldExclude(name)) continue;
        
        const fullPath = currentPath ? `${currentPath}/${name}` : name;
        
        if (handle.kind === 'file') {
          try {
            const file = await handle.getFile();
            snapshot.set(fullPath, {
              size: file.size,
              lastModified: file.lastModified
            });
          } catch (error) {
            console.warn(`无法读取文件信息: ${fullPath}`, error);
          }
        } else if (handle.kind === 'directory') {
          await this.scanDirectoryForChanges(handle, fullPath, snapshot);
        }
      }
    } catch (error) {
      console.error('扫描目录变化失败:', error);
    }
  }
  
  // 比较快照并触发事件
  private static async compareSnapshots(
    currentSnapshot: Map<string, { size: number; lastModified: number }>
  ): Promise<void> {
    const events: FileChangeEvent[] = [];
    
    // 检查新增和修改的文件
    for (const [path, current] of currentSnapshot) {
      const previous = this.lastSnapshot.get(path);
      
      if (!previous) {
        // 新文件
        events.push({
          type: 'created',
          path,
          timestamp: Date.now()
        });
      } else if (
        current.size !== previous.size || 
        current.lastModified !== previous.lastModified
      ) {
        // 文件被修改
        events.push({
          type: 'modified',
          path,
          timestamp: Date.now()
        });
      }
    }
    
    // 检查删除的文件
    for (const [path] of this.lastSnapshot) {
      if (!currentSnapshot.has(path)) {
        events.push({
          type: 'deleted',
          path,
          timestamp: Date.now()
        });
      }
    }
    
    // 触发事件
    for (const event of events) {
      this.notifyListeners(event);
    }
  }
  
  // 通知所有监听器
  private static notifyListeners(event: FileChangeEvent): void {
    console.log('文件变化事件:', event);
    
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('文件变化监听器错误:', error);
      }
    });
  }
  
  // 检查是否应该排除文件/文件夹
  private static shouldExclude(name: string): boolean {
    const excludePatterns = [
      'node_modules',
      '.git',
      '.DS_Store',
      '.vscode',
      'dist',
      'build',
      '.next',
      '.nuxt',
      'coverage',
      '.nyc_output',
      'Thumbs.db'
    ];
    
    return excludePatterns.some(pattern => 
      name === pattern || name.startsWith(pattern)
    );
  }
  
  // 获取监控状态
  static isActive(): boolean {
    return this.isWatching;
  }
  
  // 获取监听器数量
  static getListenerCount(): number {
    return this.listeners.size;
  }
}