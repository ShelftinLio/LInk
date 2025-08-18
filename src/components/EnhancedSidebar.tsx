import React, { useState, useEffect, useCallback } from 'react';
import { 
  Folder, 
  FolderOpen, 
  Search, 
  X, 
  Settings,
  Plus,
  Upload,
  AlertCircle,
  FileText
} from 'lucide-react';
import FolderTree from './FolderTree';
import { LocalFileSystemService } from '../services/localFileService';
import { FileDocument } from '../services/fileService';
import { FileWatcherService, FileChangeEvent } from '../services/fileWatcherService';

interface EnhancedSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onFileSelect: (document: FileDocument) => void;
  selectedFile?: string;
  documents: FileDocument[];
  onCreateDocument: () => void;
  onOpenFile: () => void;
  onDeleteDocument: (documentId: string) => void;
  currentDocument: FileDocument | null;
  onDocumentChange: (document: FileDocument) => void;
}

const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  isOpen,
  onToggle,
  onFileSelect,
  selectedFile,
  documents,
  onCreateDocument,
  onOpenFile,
  onDeleteDocument,
  currentDocument,
  onDocumentChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasWorkspace, setHasWorkspace] = useState(false);
  const [activeTab, setActiveTab] = useState<'workspace' | 'recent'>('workspace');
  const [isSupported, setIsSupported] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // 文件变化处理函数
  const handleFileChange = useCallback((event: FileChangeEvent) => {
    console.log('检测到文件变化:', event);
    // 触发刷新
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  useEffect(() => {
    // 检查浏览器支持
    setIsSupported(LocalFileSystemService.isSupported());
    
    // 检查是否已有工作区
    const checkWorkspace = async () => {
      try {
        await LocalFileSystemService.getFolderStructure();
        setHasWorkspace(true);
        
        // 启动文件监控
        try {
          const directoryHandle = await LocalFileSystemService.getStoredDirectoryHandle();
          if (directoryHandle) {
            await FileWatcherService.startWatching(directoryHandle);
            FileWatcherService.addListener(handleFileChange);

          }
        } catch (error) {
          console.warn('启动文件监控失败:', error);
        }
      } catch {
        setHasWorkspace(false);
      }
    };
    
    if (isSupported) {
      checkWorkspace();
    }
    
    // 清理函数
    return () => {
      FileWatcherService.removeListener(handleFileChange);
      
    };
  }, [handleFileChange]);
  
  const handleSetWorkspace = async () => {
    try {
      // @ts-ignore - File System Access API
      const directoryHandle = await window.showDirectoryPicker();
      await LocalFileSystemService.setWorkspace(directoryHandle);
      setHasWorkspace(true);
      setActiveTab('workspace');
      
      // 启动文件监控
      try {
        await FileWatcherService.startWatching(directoryHandle);
        FileWatcherService.addListener(handleFileChange);
        
        console.log('文件监控已启动');
      } catch (error) {
        console.warn('启动文件监控失败:', error);
      }
      
      // 打开文件夹后自动刷新一次
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('设置工作区失败:', error);
        alert('设置工作区失败，请确保浏览器支持File System Access API');
      }
    }
  };
  
  const handleFileSelect = async (filePath: string) => {
    try {
      const document = await LocalFileSystemService.readFile(filePath);
      onFileSelect(document);
    } catch (error) {
      console.error('读取文件失败:', error);
      alert('读取文件失败');
    }
  };
  
  const handleFileCreate = async (folderPath: string, fileName: string) => {
    try {
      const document = await LocalFileSystemService.createFile(folderPath, fileName);
      onFileSelect(document);
    } catch (error) {
      console.error('创建文件失败:', error);
      alert('创建文件失败');
    }
  };
  
  const handleCreateFile = async () => {
    const fileName = prompt('请输入文件名（不含扩展名）:');
    if (fileName) {
      const fileType = prompt('请选择文件类型:\n1. Markdown (.md)\n2. Word文档 (.docx)\n3. 文本文件 (.txt)\n\n请输入数字 1、2 或 3:');
      
      let extension = '.md';
      switch (fileType) {
        case '1':
          extension = '.md';
          break;
        case '2':
          extension = '.docx';
          break;
        case '3':
          extension = '.txt';
          break;
        default:
          extension = '.md';
      }
      
      try {
        const document = await LocalFileSystemService.createFile('', `${fileName}${extension}`);
        onFileSelect(document);
        // 文件监控会自动检测到新文件，无需手动刷新
      } catch (error) {
        console.error('创建文件失败:', error);
        alert('创建文件失败');
      }
    }
  };
  
  const handleFolderCreate = async (parentPath: string, folderName: string) => {
    try {
      await LocalFileSystemService.createFolder(parentPath, folderName);
      // 文件监控会自动检测到新文件夹，无需手动刷新
    } catch (error) {
      console.error('创建文件夹失败:', error);
      alert('创建文件夹失败');
    }
  };
  
  const handleItemDelete = async (itemPath: string) => {
    try {
      await LocalFileSystemService.deleteItem(itemPath);
      // 如果删除的是当前文件，清空选择
      if (currentDocument?.filePath === itemPath) {
        // 可以选择切换到其他文件或创建新文档
      }
      // 文件监控会自动检测到删除，无需手动刷新
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };
  
  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (!isOpen) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col h-full">
        <div className="p-2 border-b border-gray-200">
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
            title="展开文件管理"
          >
            <Folder className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">文件管理</h2>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 标签切换 */}
        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === 'workspace'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            工作区
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === 'recent'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            最近文件
          </button>
        </div>
        
        {/* 搜索框 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === 'workspace' ? '搜索文件...' : '搜索文档...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        

        
        {/* 操作按钮 */}
        {activeTab === 'workspace' ? (
          !isSupported ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">浏览器不支持</p>
                  <p>请使用 Chrome 86+ 或 Edge 86+ 浏览器</p>
                </div>
              </div>
            </div>
          ) : !hasWorkspace ? (
            <button
              onClick={handleSetWorkspace}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              选择工作文件夹
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCreateFile}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                新建文件
              </button>
              <button
                onClick={handleSetWorkspace}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="更换工作文件夹"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onCreateDocument}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              新建文档
            </button>
            <button
              onClick={onOpenFile}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="打开文件"
            >
              <Folder className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'workspace' ? (
          isSupported && hasWorkspace ? (
            <FolderTree
              onFileSelect={handleFileSelect}
              onFileCreate={handleFileCreate}
              onFolderCreate={handleFolderCreate}
              onItemDelete={handleItemDelete}
              selectedFile={selectedFile}
              refreshTrigger={refreshTrigger}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">
                  {!isSupported ? '浏览器不支持' : '请先选择工作文件夹'}
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="p-2 overflow-auto h-full">
            {filteredDocuments.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">
                    {searchQuery ? '未找到匹配的文档' : '暂无最近文档'}
                  </p>
                </div>
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 rounded-lg transition-colors mb-1 group cursor-pointer ${
                    currentDocument?.id === doc.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onDocumentChange(doc)}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {doc.updatedAt.toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`确定要删除文档 "${doc.title}" 吗？`)) {
                          onDeleteDocument(doc.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all text-red-500 hover:text-red-700"
                      title="删除文档"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Folder className="w-4 h-4" />
          <span>
            {activeTab === 'workspace' ? '工作区文件' : `${filteredDocuments.length} 个文档`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSidebar;