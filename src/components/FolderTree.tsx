import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  FilePlus,
  FolderPlus,
  RefreshCw
} from 'lucide-react';
import { FolderNode, LocalFileSystemService } from '../services/localFileService';
import { FileDocument } from '../services/fileService';

interface FolderTreeProps {
  onFileSelect: (filePath: string) => void;
  onFileCreate: (folderPath: string, fileName: string) => void;
  onFolderCreate: (parentPath: string, folderName: string) => void;
  onItemDelete: (itemPath: string) => void;
  selectedFile?: string;
  onRefresh?: () => void;
  refreshTrigger?: number;
}

interface TreeNodeProps {
  node: FolderNode;
  level: number;
  onFileSelect: (filePath: string) => void;
  onFileCreate: (folderPath: string, fileName: string) => void;
  onFolderCreate: (parentPath: string, folderName: string) => void;
  onItemDelete: (itemPath: string) => void;
  selectedFile?: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  onFileSelect,
  onFileCreate,
  onFolderCreate,
  onItemDelete,
  selectedFile
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  
  const isSelected = selectedFile === node.path;
  const hasChildren = node.children && node.children.length > 0;
  
  const handleClick = () => {
    if (node.type === 'file') {
      onFileSelect(node.path);
    } else {
      setIsExpanded(!isExpanded);
    }
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };
  
  const handleCreateFile = () => {
    const fileName = prompt('请输入文件名（包含扩展名）:');
    if (fileName) {
      const folderPath = node.type === 'folder' ? node.path : node.path.split('/').slice(0, -1).join('/');
      onFileCreate(folderPath, fileName);
    }
    setShowContextMenu(false);
  };
  
  const handleCreateFolder = () => {
    const folderName = prompt('请输入文件夹名:');
    if (folderName) {
      const parentPath = node.type === 'folder' ? node.path : node.path.split('/').slice(0, -1).join('/');
      onFolderCreate(parentPath, folderName);
    }
    setShowContextMenu(false);
  };
  
  const handleDelete = () => {
    if (confirm(`确定要删除 "${node.name}" 吗？`)) {
      onItemDelete(node.path);
    }
    setShowContextMenu(false);
  };
  
  const getFileIcon = (extension?: string) => {
    switch (extension) {
      case '.md':
      case '.markdown':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case '.docx':
      case '.doc':
        return <FileText className="w-4 h-4 text-blue-700" />;
      case '.txt':
        return <FileText className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };
  
  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-100 group ${
          isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {node.type === 'folder' && (
          <button
            className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-yellow-600" />
            ) : (
              <Folder className="w-4 h-4 text-yellow-600" />
            )}
          </button>
        )}
        
        {node.type === 'file' && (
          <div className="flex-shrink-0">
            {getFileIcon(node.extension)}
          </div>
        )}
        
        <span className="flex-1 text-sm truncate min-w-0">{node.name}</span>
        
        {node.type === 'file' && node.size && (
          <span className="text-xs text-gray-400 flex-shrink-0">
            {(node.size / 1024).toFixed(1)}KB
          </span>
        )}
      </div>
      
      {/* 上下文菜单 */}
      {showContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowContextMenu(false)} />
          <div 
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px] z-50"
            style={{
              left: Math.min(contextMenuPosition.x, window.innerWidth - 160),
              top: Math.min(contextMenuPosition.y, window.innerHeight - 120)
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              onClick={handleCreateFile}
            >
              <FilePlus className="w-4 h-4" />
              新建文件
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              onClick={handleCreateFolder}
            >
              <FolderPlus className="w-4 h-4" />
              新建文件夹
            </button>
            <hr className="my-1" />
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </div>
        </>
      )}
      
      {/* 子节点 */}
      {node.type === 'folder' && isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              onFileCreate={onFileCreate}
              onFolderCreate={onFolderCreate}
              onItemDelete={onItemDelete}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderTree: React.FC<FolderTreeProps> = ({
  onFileSelect,
  onFileCreate,
  onFolderCreate,
  onItemDelete,
  selectedFile,
  onRefresh,
  refreshTrigger
}) => {
  const [folderStructure, setFolderStructure] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadFolderStructure = async () => {
    try {
      setLoading(true);
      setError(null);
      const structure = await LocalFileSystemService.getFolderStructure();
      setFolderStructure(structure);
    } catch (error) {
      console.error('加载文件夹结构失败:', error);
      setError('加载文件夹结构失败');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadFolderStructure();
  }, []);
  
  // 响应外部刷新触发器
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadFolderStructure();
    }
  }, [refreshTrigger]);
  
  const handleRefresh = () => {
    loadFolderStructure();
    onRefresh?.();
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          加载中...
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-sm text-red-500 mb-2">{error}</div>
        <button
          onClick={handleRefresh}
          className="text-sm text-blue-500 hover:text-blue-700"
        >
          重试
        </button>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">文件夹</span>
        <button
          onClick={handleRefresh}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="刷新"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        {folderStructure.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            文件夹为空
          </div>
        ) : (
          folderStructure.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              onFileSelect={onFileSelect}
              onFileCreate={onFileCreate}
              onFolderCreate={onFolderCreate}
              onItemDelete={onItemDelete}
              selectedFile={selectedFile}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FolderTree;