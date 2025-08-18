import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Eye, EyeOff, Split, Bold, Italic, Code, List, Quote, Link, ChevronDown, Menu } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import { FileDocument } from '../services/fileService';
import { LocalFileSystemService } from '../services/localFileService';
import SelectionToolbar from './SelectionToolbar';

type Document = FileDocument;

interface EditorProps {
  document: Document;
  onDocumentChange: (document: Document) => void;
  onToggleSidebar?: () => void;
}

type ViewMode = 'edit' | 'preview' | 'split';

const Editor: React.FC<EditorProps> = ({ document, onDocumentChange, onToggleSidebar }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('edit'); // 移动端默认编辑模式
  const [content, setContent] = useState(document.content);
  const [viewModeDropdownOpen, setViewModeDropdownOpen] = useState(false);
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 撤销/重做历史管理
  const [history, setHistory] = useState<string[]>([document.content]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isUndoRedo, setIsUndoRedo] = useState(false);
  

  
  // 撤销操作
  const handleUndo = () => {
    if (historyIndex > 0) {
      setIsUndoRedo(true);
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousContent = history[newIndex];
      setContent(previousContent);
      onDocumentChange({
        ...document,
        content: previousContent,
        updatedAt: new Date()
      });
      setTimeout(() => setIsUndoRedo(false), 0);
    }
  };
  
  // 重做操作
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedo(true);
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextContent = history[newIndex];
      setContent(nextContent);
      onDocumentChange({
        ...document,
        content: nextContent,
        updatedAt: new Date()
      });
      setTimeout(() => setIsUndoRedo(false), 0);
    }
  };
  
  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // 检测移动端并设置默认视图模式
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && viewMode === 'split') {
        setViewMode('edit'); // 移动端不支持分屏，切换到编辑模式
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [viewMode]);
  
  // 当document变化时同步content状态和历史记录
  useEffect(() => {
    setContent(document.content);
    // 重置历史记录
    setHistory([document.content]);
    setHistoryIndex(0);
  }, [document.id]);

  // 当父组件更新了同一文档的 content（例如来自划词助手/AI面板）时，立即同步到本地内容
  useEffect(() => {
    if (content !== document.content) {
      setContent(document.content);
    }
  }, [document.content]);
  
  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setViewModeDropdownOpen(false);
        setFormatDropdownOpen(false);
      }
    };
    
    window.document.addEventListener('mousedown', handleClickOutside);
    return () => window.document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContentChange = (newContent: string, skipHistory = false) => {
    setContent(newContent);
    const updatedDocument = {
      ...document,
      content: newContent,
      updatedAt: new Date()
    };
    onDocumentChange(updatedDocument);
    
    // 自动保存本地文件
    if (document.filePath && document.filePath !== '') {
      // 延迟保存，避免频繁写入
      clearTimeout((window as any).autoSaveTimeout);
      (window as any).autoSaveTimeout = setTimeout(async () => {
        try {
          await LocalFileSystemService.saveFile(updatedDocument);
        } catch (error) {
          console.error('自动保存失败:', error);
        }
      }, 1000);
    }
    
    // 如果不是撤销/重做操作，添加到历史记录
    if (!skipHistory && !isUndoRedo) {
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newContent);
        // 限制历史记录数量，避免内存过多占用
        if (newHistory.length > 100) {
          newHistory.shift();
        } else {
          setHistoryIndex(newHistory.length - 1);
        }
        return newHistory;
      });
      if (history.length <= 100) {
        setHistoryIndex(prev => prev + 1);
      }
    }
  };
  
  // 支持撤销历史的文档更新方法（供AI划词助手使用）
  const handleDocumentChangeWithHistory = (updatedDocument: Document) => {
    handleContentChange(updatedDocument.content, false);
  };

  // 配置marked选项
  const markedOptions = useMemo(() => {
    marked.setOptions({
      breaks: true,
      gfm: true
    });
    return marked;
  }, []);

  const renderMarkdown = (markdown: string) => {
    try {
      const rawHtml = markedOptions.parse(markdown);
      // 使用DOMPurify清理HTML，防止XSS攻击
      return DOMPurify.sanitize(rawHtml);
    } catch (error) {
      console.error('Markdown渲染错误:', error);
      return markdown;
    }
  };

  // 插入Markdown格式的辅助函数
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = window.document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    // 检查是否为列表格式（特殊处理）
    if (before.includes('- ') || before.includes('1. ')) {
      const newText = before + selectedText;
      const newContent = content.substring(0, start) + newText + content.substring(end);
      handleContentChange(newContent);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
      }, 0);
      return;
    }
    
    // 检查选中文本是否已经包含格式标记
    if (selectedText && before && after) {
      const beforeLen = before.length;
      const afterLen = after.length;
      
      // 检查选中文本是否已经被格式化
      if (selectedText.startsWith(before) && selectedText.endsWith(after) && selectedText.length > beforeLen + afterLen) {
        // 移除格式标记
        const unformattedText = selectedText.substring(beforeLen, selectedText.length - afterLen);
        const newContent = content.substring(0, start) + unformattedText + content.substring(end);
        handleContentChange(newContent);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start, start + unformattedText.length);
        }, 0);
        return;
      }
      
      // 检查选中文本周围是否已经有格式标记
      const beforeStart = Math.max(0, start - beforeLen);
      const afterEnd = Math.min(content.length, end + afterLen);
      const surroundingText = content.substring(beforeStart, afterEnd);
      
      if (surroundingText.startsWith(before) && surroundingText.endsWith(after)) {
        // 移除周围的格式标记
        const newContent = content.substring(0, beforeStart) + selectedText + content.substring(afterEnd);
        handleContentChange(newContent);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(beforeStart, beforeStart + selectedText.length);
        }, 0);
        return;
      }
    }
    
    // 添加格式标记
    const newText = before + selectedText + after;
    const newContent = content.substring(0, start) + newText + content.substring(end);
    handleContentChange(newContent);
    
    // 重新设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  // 处理文本选择
  const handleTextSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end).trim();

    if (selected.length > 0) {
      // 使用更准确的位置计算
      setTimeout(() => {
        // 首先尝试使用浏览器原生的selection API
        const selection = window.getSelection();
        
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rangeRect = range.getBoundingClientRect();
          
          if (rangeRect.width > 0 && rangeRect.height > 0) {
            // 计算工具栏的预估高度
            const toolbarHeight = 120;
            
            // 检测选择方向：比较光标位置和选择范围
            const isSelectionDownward = end > start;
            const cursorAtEnd = textarea.selectionDirection !== 'backward';
            
            // 根据选择方向确定参考位置
            let referenceY;
            if (cursorAtEnd || isSelectionDownward) {
              // 光标在选择末尾或向下选择，使用选择区域底部
              referenceY = rangeRect.bottom;
            } else {
              // 光标在选择开头或向上选择，使用选择区域顶部
              referenceY = rangeRect.top;
            }
            
            // 计算最佳显示位置 - 使用固定定位
            let x = rangeRect.left + rangeRect.width / 2;
            let y;
            
            // 智能位置判断：优先显示在参考位置附近
            if (cursorAtEnd || isSelectionDownward) {
              // 选择结束在下方，优先显示在下方
              if (window.innerHeight - referenceY > toolbarHeight + 20) {
                y = referenceY + 10; // 显示在选择下方
              } else {
                y = referenceY - toolbarHeight - 10; // 空间不足时显示在上方
              }
            } else {
              // 选择结束在上方，优先显示在上方
              if (referenceY > toolbarHeight + 20) {
                y = referenceY - 10; // 显示在选择上方
              } else {
                y = referenceY + 10; // 空间不足时显示在下方
              }
            }
            
            // 确保工具栏不超出视口边界
            const toolbarWidth = 400;
            if (x + toolbarWidth / 2 > window.innerWidth) {
              x = window.innerWidth - toolbarWidth / 2 - 20;
            }
            if (x - toolbarWidth / 2 < 0) {
              x = toolbarWidth / 2 + 20;
            }
            
            // 确保y坐标在视口范围内
            if (y < 10) {
              y = 10;
            }
            if (y + toolbarHeight > window.innerHeight - 10) {
              y = window.innerHeight - toolbarHeight - 10;
            }
            
            setSelectedText(selected);
            setSelectionPosition({ x, y });
            setShowSelectionToolbar(true);
            return;
          }
        }
        
        // 回退到基于textarea的计算
        const rect = textarea.getBoundingClientRect();
        const textBeforeSelection = content.substring(0, start);
        const lines = textBeforeSelection.split('\n');
        const currentLine = lines.length - 1;
        const currentColumn = lines[lines.length - 1].length;
        
        const lineHeight = 24;
        const charWidth = 8;
        const toolbarHeight = 120;
        
        let x = rect.left + currentColumn * charWidth + 16;
        let y = rect.top + currentLine * lineHeight + 16; // fixed定位不需要scrollY偏移
        
        // 智能位置判断
        const viewportY = rect.top + currentLine * lineHeight;
        if (viewportY < toolbarHeight + 20) {
          y = y + lineHeight + 20; // 显示在下方
        } else {
          y = y - 10; // 显示在上方
        }
        
        setSelectedText(selected);
        setSelectionPosition({ x, y });
        setShowSelectionToolbar(true);
      }, 10);
    } else {
      setShowSelectionToolbar(false);
    }
  };

  // 关闭划词工具栏
  const closeSelectionToolbar = () => {
    setShowSelectionToolbar(false);
    setSelectedText('');
    setSelectionPosition(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* 编辑器工具栏 */}
      <div className="border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <input
              type="text"
              value={document.title}
              onChange={(e) => onDocumentChange({
                ...document,
                title: e.target.value,
                updatedAt: new Date()
              })}
              className="text-lg font-semibold bg-transparent border-none outline-none focus:bg-gray-50 px-2 py-1 rounded flex-shrink-0"
            />
            
            {/* Markdown 格式化工具栏 - 大屏幕显示 */}
            {(viewMode === 'edit' || viewMode === 'split') && 
             !document.filePath?.endsWith('.docx') && 
             !document.filePath?.endsWith('.doc') && (
              <div className="hidden lg:flex items-center gap-1 border-l border-gray-300 pl-4">
                <button
                  onClick={() => insertMarkdown('**', '**')}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="粗体"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertMarkdown('*', '*')}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="斜体"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertMarkdown('`', '`')}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="行内代码"
                >
                  <Code className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertMarkdown('\n- ')}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="无序列表"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertMarkdown('\n1. ')}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="有序列表"
                >
                  <span className="w-4 h-4 text-xs font-bold flex items-center justify-center">1.</span>
                </button>
                <button
                  onClick={() => insertMarkdown('\n> ')}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="引用"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertMarkdown('[', '](url)')}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="链接"
                >
                  <Link className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Markdown 格式化工具栏 - 小屏幕下拉菜单 */}
             {(viewMode === 'edit' || viewMode === 'split') && 
              !document.filePath?.endsWith('.docx') && 
              !document.filePath?.endsWith('.doc') && (
               <div className="lg:hidden relative dropdown-container">
                 <button
                   onClick={() => setFormatDropdownOpen(!formatDropdownOpen)}
                   className="p-1.5 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                   title="格式化工具"
                 >
                   <Menu className="w-4 h-4" />
                   <ChevronDown className="w-3 h-3" />
                 </button>
                
                {formatDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                    <div className="p-1">
                      <button
                        onClick={() => { insertMarkdown('**', '**'); setFormatDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                      >
                        <Bold className="w-4 h-4" />
                        粗体
                      </button>
                      <button
                        onClick={() => { insertMarkdown('*', '*'); setFormatDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                      >
                        <Italic className="w-4 h-4" />
                        斜体
                      </button>
                      <button
                        onClick={() => { insertMarkdown('`', '`'); setFormatDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                      >
                        <Code className="w-4 h-4" />
                        行内代码
                      </button>
                      <button
                        onClick={() => { insertMarkdown('\n- '); setFormatDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                      >
                        <List className="w-4 h-4" />
                        无序列表
                      </button>
                      <button
                        onClick={() => { insertMarkdown('\n1. '); setFormatDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                      >
                        <span className="w-4 h-4 text-xs font-bold flex items-center justify-center">1.</span>
                        有序列表
                      </button>
                      <button
                        onClick={() => { insertMarkdown('\n> '); setFormatDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                      >
                        <Quote className="w-4 h-4" />
                        引用
                      </button>
                      <button
                        onClick={() => { insertMarkdown('[', '](url)'); setFormatDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                      >
                        <Link className="w-4 h-4" />
                        链接
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 视图模式切换 - 桌面端显示 */}
          <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1 relative z-10">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors relative z-10 cursor-pointer ${
                viewMode === 'edit' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              编辑
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 relative z-10 cursor-pointer ${
                viewMode === 'split' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <Split className="w-4 h-4" />
              分屏
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 relative z-10 cursor-pointer ${
                viewMode === 'preview' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              预览
            </button>
          </div>
          
          {/* 移动端视图模式切换 */}
          <div className="md:hidden flex items-center gap-1 relative z-10">
            <button
              onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
              className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 touch-manipulation relative z-10 cursor-pointer"
            >
              {viewMode === 'edit' ? (
                <>
                  <Eye className="w-4 h-4" />
                  预览
                </>
              ) : (
                <>
                  <span>编辑</span>
                </>
              )}
            </button>
          </div>
          

        </div>
      </div>
      
      {/* 编辑器内容区域 */}
      <div className="flex-1 flex">
        {/* 编辑区域 */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col relative`}>
            {/* 编辑器状态栏 */}
            <div className="px-3 md:px-4 py-1 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 flex justify-between">
              <span>
                {document.filePath?.endsWith('.docx') || document.filePath?.endsWith('.doc') 
                  ? 'Word 文档编辑器' 
                  : document.filePath?.endsWith('.txt')
                  ? '文本编辑器'
                  : 'Markdown 编辑器'
                }
              </span>
              <span>{content.length} 字符 | {content.split('\n').length} 行</span>
            </div>
            
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onMouseUp={handleTextSelection}
                onKeyUp={handleTextSelection}
                className="w-full h-full p-3 md:p-4 border-none outline-none resize-none font-mono text-sm md:text-base leading-relaxed bg-white focus:bg-gray-50/30 transition-colors touch-manipulation"
placeholder={
                  document.filePath?.endsWith('.docx') || document.filePath?.endsWith('.doc')
                    ? '开始编写您的Word文档内容...\n\n提示：\n- 支持纯文本编辑\n- 自动保存到Word格式\n- 可以使用AI助手优化内容\n- 支持划词翻译和改写'
                    : document.filePath?.endsWith('.txt')
                    ? '开始编写您的文本内容...\n\n提示：\n- 纯文本编辑\n- 支持AI辅助功能\n- 自动保存'
                    : '# 开始写作...\n\n在这里输入您的 Markdown 内容。\n\n**提示：**\n- 使用 # 创建标题\n- 使用 **文本** 创建粗体\n- 使用 *文本* 创建斜体\n- 使用 \`代码\` 创建行内代码\n- 使用 > 创建引用\n- 使用 - 创建列表'
                }
                spellCheck={false}
                style={{
                  fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
                  lineHeight: '1.6',
                  tabSize: 2,
                  minHeight: isMobile ? 'calc(100vh - 200px)' : 'auto'
                }}
                onKeyDown={(e) => {
                   // Tab键插入空格
                   if (e.key === 'Tab') {
                     e.preventDefault();
                     const start = e.currentTarget.selectionStart;
                     const end = e.currentTarget.selectionEnd;
                     const newContent = content.substring(0, start) + '  ' + content.substring(end);
                     handleContentChange(newContent);
                     setTimeout(() => {
                       e.currentTarget.setSelectionRange(start + 2, start + 2);
                     }, 0);
                   }
                   
                   // 快捷键支持
                   if (e.ctrlKey || e.metaKey) {
                     switch (e.key) {
                       case 'b':
                         e.preventDefault();
                         insertMarkdown('**', '**');
                         break;
                       case 'i':
                         e.preventDefault();
                         insertMarkdown('*', '*');
                         break;
                       case 'k':
                         e.preventDefault();
                         insertMarkdown('[', '](url)');
                         break;
                       case '`':
                         e.preventDefault();
                         insertMarkdown('`', '`');
                         break;
                     }
                   }
                 }}
              />
              
              {/* 编辑器增强功能提示 */}
              {content.length === 0 && (
                <div className="absolute top-4 right-4 text-xs text-gray-400 pointer-events-none">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-gray-200">
                    <div className="font-medium mb-1">快捷键：</div>
                    <div>Tab - 缩进</div>
                    <div>Ctrl+B - 粗体</div>
                    <div>Ctrl+I - 斜体</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 分隔线 */}
        {viewMode === 'split' && (
          <div className="w-px bg-gray-200"></div>
        )}
        
        {/* 预览区域 */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
            {/* 预览状态栏 */}
            <div className="px-3 md:px-4 py-1 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 flex justify-between">
              <span>
                {document.filePath?.endsWith('.docx') || document.filePath?.endsWith('.doc')
                  ? 'Word 文档预览'
                  : document.filePath?.endsWith('.txt')
                  ? '文本预览'
                  : 'Markdown 预览'
                }
              </span>
              <span>实时渲染</span>
            </div>
            
            <div className="flex-1 overflow-auto bg-white">
              {content.trim() ? (
                document.filePath?.endsWith('.docx') || document.filePath?.endsWith('.doc') || document.filePath?.endsWith('.txt') ? (
                  // Word文档和文本文件的预览
                  <div className="p-4 md:p-6 whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                    {content}
                  </div>
                ) : (
                  // Markdown文件的预览
                  <div 
                    className="p-4 md:p-6 markdown-preview prose prose-gray max-w-none prose-sm md:prose-base"
                    style={{
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                      lineHeight: '1.7'
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 p-4">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl mb-4">📝</div>
                    <div className="text-base md:text-lg font-medium mb-2">开始写作</div>
                    <div className="text-sm">
                      在{viewMode === 'split' ? '左侧' : ''}编辑器中输入
                      {document.filePath?.endsWith('.docx') || document.filePath?.endsWith('.doc')
                        ? ' Word 文档'
                        : document.filePath?.endsWith('.txt')
                        ? '文本'
                        : ' Markdown'
                      }内容，这里将显示实时预览
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* 划词工具栏 */}
      {showSelectionToolbar && selectedText && selectionPosition && (
        <SelectionToolbar
          selectedText={selectedText}
          position={selectionPosition}
          onClose={closeSelectionToolbar}
          document={document}
          onDocumentChange={handleDocumentChangeWithHistory}
          onToggleSidebar={onToggleSidebar}
        />
      )}
    </div>
  );
};

export default Editor;