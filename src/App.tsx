import React, { useState, useEffect } from 'react';
import { PenTool, Settings, FileText, Sparkles, Menu, X } from 'lucide-react';
import Editor from './components/Editor.tsx';
import EnhancedSidebar from './components/EnhancedSidebar.tsx';
import { LocalFileSystemService } from './services/localFileService';
import AIPanel from './components/AIPanel.tsx';
import SettingsModal from './components/SettingsModal.tsx';
import { FileService, FileDocument } from './services/fileService';

// 使用FileDocument作为Document类型
type Document = FileDocument;

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // 永久折叠状态
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [aiPanelMinimized, setAiPanelMinimized] = useState(false);
  
  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // 移除自动打开侧边栏的逻辑，保持永久折叠状态
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 文档管理状态
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  
  // 初始化文档列表
  useEffect(() => {
    const loadDocuments = () => {
      const recentFiles = FileService.getRecentFiles();
      setDocuments(recentFiles);
      if (recentFiles.length > 0) {
        setCurrentDocument(recentFiles[0]);
      }
    };
    
    loadDocuments();
  }, []);
  
  // 文档管理函数
  const handleDocumentChange = (document: Document) => {
    setCurrentDocument(document);
    FileService.addToRecentFiles(document);
  };
  
  const handleDocumentUpdate = (updatedDocument: Document) => {
    setDocuments(docs => docs.map(doc => 
      doc.id === updatedDocument.id ? updatedDocument : doc
    ));
    setCurrentDocument(updatedDocument);
    FileService.addToRecentFiles(updatedDocument);
  };
  
  const handleCreateDocument = () => {
    const newDoc = FileService.createNewDocument('新文档');
    setDocuments(docs => [newDoc, ...docs]);
    setCurrentDocument(newDoc);
  };
  
  const handleOpenFile = async () => {
    try {
      const document = await FileService.openFileDialog();
      if (document) {
        setDocuments(docs => [document, ...docs.filter(doc => doc.id !== document.id)]);
        setCurrentDocument(document);
      }
    } catch (error) {
      console.error('打开文件失败:', error);
    }
  };
  
  const handleSaveFile = async () => {
    if (currentDocument) {
      try {
        // 如果是本地文件，使用LocalFileSystemService保存
        if (currentDocument.filePath && currentDocument.filePath !== '') {
          await LocalFileSystemService.saveFile(currentDocument);
        } else {
          // 否则使用原有的FileService
          await FileService.saveFile(currentDocument);
        }
        
        // 更新文档状态
        handleDocumentUpdate(currentDocument);
      } catch (error) {
        console.error('保存文件失败:', error);
        alert('保存文件失败');
      }
    }
  };
  
  const handleFileSelect = async (document: FileDocument) => {
    setCurrentDocument(document);
    // 添加到最近文件
    FileService.addToRecentFiles(document);
  };
  
  // AI面板最小化处理
  const handleAIPanelMinimize = () => {
    setAiPanelMinimized(true);
    setAiPanelOpen(false);
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(docs => docs.filter(doc => doc.id !== documentId));
    
    // 如果删除的是当前文档，切换到其他文档或创建新文档
    if (currentDocument?.id === documentId) {
      const remainingDocs = documents.filter(doc => doc.id !== documentId);
      if (remainingDocs.length > 0) {
        setCurrentDocument(remainingDocs[0]);
      } else {
        // 如果没有其他文档，创建一个新文档
        const newDoc = FileService.createNewDocument('新文档');
        setDocuments([newDoc]);
        setCurrentDocument(newDoc);
      }
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 relative">
      {/* 侧边栏遮罩 - 始终显示当侧边栏打开时 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* 侧边栏 - 始终以动态侧边栏形式显示 */}
      <div className={`fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <EnhancedSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onFileSelect={handleFileSelect}
          selectedFile={currentDocument?.filePath}
          documents={documents}
          onCreateDocument={handleCreateDocument}
          onOpenFile={handleOpenFile}
          onDeleteDocument={handleDeleteDocument}
          currentDocument={currentDocument}
          onDocumentChange={handleDocumentChange}
        />
      </div>
      
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <header className="bg-white border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                aria-label="切换侧边栏"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="LInk Logo" className="w-5 h-5 md:w-6 md:h-6" />
                <h1 className="text-base md:text-lg font-semibold text-gray-900 hidden sm:block">
                  LInk
                </h1>
                <h1 className="text-base font-semibold text-gray-900 sm:hidden">
                  LInk
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                className="px-2 md:px-3 py-1.5 md:py-2 icon-gradient-bg text-white rounded-lg hover:opacity-90 transition-all text-sm md:text-base touch-manipulation flex items-center gap-1 md:gap-2 shadow-md hover:shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI 助手</span>
                <span className="sm:hidden">AI</span>
              </button>
              
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                aria-label="设置"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>
        
        {/* 编辑器区域 */}
        <div className="flex-1 flex">
          {currentDocument ? (
            <Editor 
              document={currentDocument}
              onDocumentChange={handleDocumentUpdate}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-6">📝</div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">欢迎使用 LInk</h2>
                <p className="text-gray-600 mb-6">
                  这是一个支持本地文件管理的 AI 写作编辑器。您可以：
                </p>
                <div className="space-y-3 text-left bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">创建新的 Markdown 文档</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">打开本地 .md 文件</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">使用 AI 辅助写作</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">实时预览 Markdown</span>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <button
                    onClick={handleCreateDocument}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    创建新文档
                  </button>
                  <button
                    onClick={handleOpenFile}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    打开本地文件
                  </button>
                </div>
              </div>
            </div>
          )}
          

        </div>
      </div>
      
      {/* 设置模态框 */}
      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
      
      {/* AI 助手模态框 */}
       {aiPanelOpen && currentDocument && (
         <div 
           className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4"
           onClick={() => setAiPanelOpen(false)}
         >
           <div 
             className={`bg-white shadow-xl w-full h-full md:max-w-2xl md:w-full md:max-h-[80vh] md:rounded-lg overflow-hidden flex flex-col`}
             onClick={(e) => e.stopPropagation()}
           >
             <AIPanel 
               onClose={() => setAiPanelOpen(false)}
               onMinimize={handleAIPanelMinimize}
               document={currentDocument}
               onDocumentChange={handleDocumentUpdate}
             />
           </div>
         </div>
       )}
       

    </div>
  );
}

export default App;