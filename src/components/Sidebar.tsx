import React from 'react';
import { FileText, Plus, Search, X, Folder, FolderOpen, Trash2 } from 'lucide-react';

import { FileDocument } from '../services/fileService';

type Document = FileDocument;

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentDocument: Document | null;
  onDocumentChange: (document: Document) => void;
  documents: Document[];
  onCreateDocument: () => void;
  onOpenFile: () => void;
  onDeleteDocument: (documentId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onToggle, 
  currentDocument, 
  onDocumentChange,
  documents,
  onCreateDocument,
  onOpenFile,
  onDeleteDocument
}) => {
  // 使用传入的documents，不再需要mockDocuments

  if (!isOpen) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col h-full shadow-lg md:shadow-none">
        <div className="p-2 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            aria-label="展开侧边栏"
            title="展开文件管理"
          >
            <Folder className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 md:w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-lg md:shadow-none">
      {/* 侧边栏头部 */}
      <div className="p-3 md:p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-lg font-semibold text-gray-900">文档</h2>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            aria-label="关闭侧边栏"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索文档..."
            className="w-full pl-10 pr-4 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base md:text-sm touch-manipulation"
          />
        </div>
        
        {/* 操作按钮 */}
        <div className="flex flex-col md:flex-row gap-2 mt-3 md:mt-4">
          <button
            onClick={onCreateDocument}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 md:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors touch-manipulation text-sm md:text-base"
          >
            <Plus className="w-4 h-4" />
            新建文档
          </button>
          <button
            onClick={onOpenFile}
            className="flex items-center justify-center gap-2 px-3 py-2.5 md:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors touch-manipulation text-sm md:text-base"
          >
            <Folder className="w-4 h-4" />
            打开文件
          </button>
        </div>
      </div>
      
      {/* 文档列表 */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className="p-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`p-3 md:p-3 rounded-lg transition-colors mb-1 group touch-manipulation ${
                currentDocument?.id === doc.id
                  ? 'bg-primary-50 border border-primary-200'
                  : 'hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-gray-400 mt-1 md:mt-0.5 flex-shrink-0" />
                <div 
                  className="flex-1 min-w-0 cursor-pointer py-1"
                  onClick={() => onDocumentChange(doc)}
                >
                  <h3 className="text-sm md:text-sm font-medium text-gray-900 truncate leading-relaxed">
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
                  className="md:opacity-0 md:group-hover:opacity-100 p-2 md:p-1 hover:bg-red-100 rounded-lg md:rounded transition-all text-red-500 hover:text-red-700 touch-manipulation"
                  title="删除文档"
                  aria-label={`删除文档 ${doc.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Folder className="w-4 h-4" />
          <span>{documents.length} 个文档</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;