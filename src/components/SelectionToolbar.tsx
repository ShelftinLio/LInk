import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Globe, BookOpen, X, ChevronDown, Folder } from 'lucide-react';
import { AIService, AIConfigManager, AIRequest } from '../services/aiService';
import { FileDocument } from '../services/fileService';
import { PromptManager, PromptTemplate } from '../services/promptService';

type Document = FileDocument;

interface SelectionToolbarProps {
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
  document: Document;
  onDocumentChange: (document: Document) => void;
  onToggleSidebar?: () => void;
}

type ToolbarAction = 'ai-writing' | 'ai-polish' | 'ai-translate' | 'ai-explain';
type WritingSubAction = 'continue' | 'generate-from-title';
type PolishSubAction = 'tone-serious' | 'tone-lively' | 'length-expand' | 'length-compress' | 'grammar-check';
type TranslateSubAction = 'to-english' | 'to-chinese' | 'to-japanese' | 'to-korean';

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedText,
  position,
  onClose,
  document,
  onDocumentChange,
  onToggleSidebar
}) => {
  const [expandedAction, setExpandedAction] = useState<ToolbarAction | null>(null);
  const [selectedSubAction, setSelectedSubAction] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // 初始化AI服务
  useEffect(() => {
    const config = AIConfigManager.loadConfig();
    if (config) {
      setAiService(new AIService(config));
    }
  }, []);

  const handleAction = async (action: ToolbarAction) => {
    if (expandedAction === action) {
      setExpandedAction(null);
      setShowDialog(false);
      return;
    }

    setExpandedAction(action);
    setResult('');
    setSelectedSubAction(null);
    setCustomPrompt('');
    
    // AI润色功能显示对话框
    if (action === 'ai-polish') {
      setShowDialog(true);
      return;
    }
    
    // 其他功能直接处理
    setIsLoading(true);

    if (!aiService) {
      setResult('请先配置AI服务');
      setIsLoading(false);
      return;
    }

    try {
      let request: AIRequest;
      
      switch (action) {
        case 'ai-writing':
          request = {
            prompt: selectedText,
            functionType: 'continue'
          };
          break;
        case 'ai-translate':
          setShowDialog(true);
          setIsLoading(false);
          return;
        case 'ai-explain':
          request = {
            prompt: selectedText,
            functionType: 'summarize'
          };
          break;
        default:
          setResult('功能开发中...');
          setIsLoading(false);
          return;
      }

      const response = await aiService.processText(request);
      
      if (response.success) {
        setResult(response.content);
      } else {
        setResult(response.error || '处理失败');
      }
    } catch (error) {
      setResult('处理出错: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetAction = async (templateId: string) => {
    if (!aiService) {
      setResult('请先配置AI服务');
      return;
    }

    setIsLoading(true);
    setResult('');
    setShowDialog(false);

    try {
      // 检查是否是Prompt模板
      const promptTemplate = PromptManager.getPromptById(templateId);
      if (promptTemplate) {
        let promptText = selectedText;
        let targetLanguage = '英文'; // 默认语言
        
        // 根据模板分类确定功能类型
        let functionType: 'continue' | 'rewrite' | 'translate' | 'summarize' = 'rewrite';
        switch (promptTemplate.category) {
          case 'writing':
            functionType = 'continue';
            break;
          case 'polish':
            functionType = 'rewrite';
            break;
          case 'translate':
            functionType = 'translate';
            // 对于翻译模板，根据模板ID确定目标语言
            switch (templateId) {
              case 'to-english':
                targetLanguage = '英文';
                break;
              case 'to-chinese':
                targetLanguage = '中文';
                break;
              case 'to-japanese':
                targetLanguage = '日文';
                break;
              case 'to-korean':
                targetLanguage = '韩文';
                break;
              case 'to-french':
                targetLanguage = '法文';
                break;
              case 'to-german':
                targetLanguage = '德文';
                break;
              case 'to-spanish':
                targetLanguage = '西班牙文';
                break;
              default:
                targetLanguage = '目标语言';
            }
            break;
          case 'explain':
          case 'summary':
            functionType = 'summarize';
            break;
        }
        
        const renderedPrompt = PromptManager.renderPrompt(promptTemplate.template, {
          text: promptText,
          language: targetLanguage
        });
        
        const request = {
          prompt: renderedPrompt,
          functionType
        };

        const response = await aiService.processText(request);
        
        if (response.success) {
          setResult(response.content);
        } else {
          setResult(response.error || '处理失败');
        }
        return;
      }

      // 原有的预设操作处理
      let request: AIRequest;
      let promptText = selectedText;
      
      // 根据预设选项构建请求
      switch (templateId) {
        case 'tone-serious':
          request = {
            prompt: `请将以下文本调整为更严肃的语调：${promptText}`,
            functionType: 'rewrite'
          };
          break;
        case 'tone-lively':
          request = {
            prompt: `请将以下文本调整为更活泼的语调：${promptText}`,
            functionType: 'rewrite'
          };
          break;
        case 'length-expand':
          request = {
            prompt: `请将以下文本扩展得更丰富详细：${promptText}`,
            functionType: 'rewrite'
          };
          break;
        case 'length-compress':
          request = {
            prompt: `请将以下文本精炼压缩：${promptText}`,
            functionType: 'rewrite'
          };
          break;
        case 'grammar-check':
          request = {
            prompt: `请检查并修正以下文本的语法和拼写错误：${promptText}`,
            functionType: 'rewrite'
          };
          break;
        default:
          request = {
            prompt: `请润色以下文本：${promptText}`,
            functionType: 'rewrite'
          };
      }

      const response = await aiService.processText(request);
      
      if (response.success) {
        setResult(response.content);
      } else {
        setResult(response.error || '处理失败');
      }
    } catch (error) {
      setResult('处理出错: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogSend = async () => {
    if (!aiService) {
      setResult('请先配置AI服务');
      return;
    }

    setIsLoading(true);
    setResult('');
    setShowDialog(false);

    try {
      let request: AIRequest;
      let promptText = selectedText;
      
      if (selectedSubAction) {
        // 使用预设选项
        switch (selectedSubAction) {
          case 'tone-serious':
            request = {
              prompt: `请将以下文本调整为更严肃的语调：${promptText}`,
              functionType: 'rewrite'
            };
            break;
          case 'tone-lively':
            request = {
              prompt: `请将以下文本调整为更活泼的语调：${promptText}`,
              functionType: 'rewrite'
            };
            break;
          case 'length-expand':
            request = {
              prompt: `请将以下文本扩展得更丰富详细：${promptText}`,
              functionType: 'rewrite'
            };
            break;
          case 'length-compress':
            request = {
              prompt: `请将以下文本精炼压缩：${promptText}`,
              functionType: 'rewrite'
            };
            break;
          case 'grammar-check':
            request = {
              prompt: `请检查并修正以下文本的语法和拼写错误：${promptText}`,
              functionType: 'rewrite'
            };
            break;
          default:
            request = {
              prompt: promptText,
              functionType: 'rewrite'
            };
        }
      } else if (customPrompt.trim()) {
        // 使用自定义输入
        request = {
          prompt: `${customPrompt}\n\n原文：${promptText}`,
          functionType: 'rewrite'
        };
      } else {
        // 默认润色
        request = {
          prompt: `请润色以下文本：${promptText}`,
          functionType: 'rewrite'
        };
      }

      const response = await aiService.processText(request);
      
      if (response.success) {
        setResult(response.content);
      } else {
        setResult(response.error || '处理失败');
      }
    } catch (error) {
      setResult('处理出错: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  // 在选中文本位置插入结果
  const insertAtSelection = () => {
    if (!result) return;
    
    const content = document.content;
    const selectionStart = content.indexOf(selectedText);
    
    if (selectionStart !== -1) {
      const selectionEnd = selectionStart + selectedText.length;
      const newContent = content.substring(0, selectionEnd) + '\n\n' + result + content.substring(selectionEnd);
      onDocumentChange({
        ...document,
        content: newContent,
        updatedAt: new Date()
      });
    }
    onClose();
  };

  // 插入到文档最后
  const insertAtEnd = () => {
    if (!result) return;
    
    const newContent = document.content + '\n\n' + result;
    onDocumentChange({
      ...document,
      content: newContent,
      updatedAt: new Date()
    });
    onClose();
  };

  // 替换选中文本
  const replaceSelection = () => {
    if (!result) return;
    
    const content = document.content;
    const newContent = content.replace(selectedText, result);
    onDocumentChange({
      ...document,
      content: newContent,
      updatedAt: new Date()
    });
    onClose();
  };

  const copyResult = async () => {
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(result);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleSubAction = async () => {
    if (!selectedSubAction || !aiService) {
      setResult('请先选择具体操作');
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      let request: AIRequest;
      let promptText = selectedText;

      // 根据不同的子操作构建请求，使用自定义Prompt模板
      let promptTemplate: PromptTemplate | null = null;
      
      if (selectedSubAction) {
        promptTemplate = PromptManager.getPromptById(selectedSubAction);
      } else if (expandedAction === 'ai-explain') {
        promptTemplate = PromptManager.getPromptById('explain-content');
      }
      
      if (promptTemplate) {
         // 使用自定义Prompt模板
         let targetLanguage = '英文'; // 默认语言
         
         // 根据选择的翻译选项确定目标语言
         if (promptTemplate.category === 'translate') {
           switch (selectedSubAction) {
             case 'to-english':
               targetLanguage = '英文';
               break;
             case 'to-chinese':
               targetLanguage = '中文';
               break;
             case 'to-japanese':
               targetLanguage = '日文';
               break;
             case 'to-korean':
               targetLanguage = '韩文';
               break;
             default:
               // 对于自定义翻译模板，从模板描述或名称中提取语言信息
               // 或者使用模板中定义的默认语言
               targetLanguage = '目标语言';
           }
         }
         
         const renderedPrompt = PromptManager.renderPrompt(promptTemplate.template, {
           text: promptText,
           language: targetLanguage
         });
         
         // 根据模板分类确定功能类型
          let functionType: 'continue' | 'rewrite' | 'translate' | 'summarize' = 'rewrite';
          switch (promptTemplate.category) {
            case 'writing':
              functionType = 'continue';
              break;
            case 'polish':
              functionType = 'rewrite';
              break;
            case 'translate':
              functionType = 'translate';
              break;
            case 'explain':
            case 'summary':
              functionType = 'summarize';
              break;
          }
         
         request = {
           prompt: renderedPrompt,
           functionType
         };
       } else {
         // 默认处理
         request = {
           prompt: `请处理以下文本：${promptText}`,
           functionType: 'rewrite'
         };
       }

      const response = await aiService.processText(request);
      
      if (response.success) {
        setResult(response.content);
      } else {
        setResult(response.error || '处理失败');
      }
    } catch (error) {
      setResult('处理出错: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  // 计算最佳显示位置（解决内容溢出和位置偏移问题）
  const calculatePosition = () => {
    // 动态计算工具栏尺寸
    let toolbarHeight = 50; // 基础高度
    let toolbarWidth = 320; // 增加基础宽度以显示所有按钮
    
    if (expandedAction) {
      toolbarWidth = 320; // 展开时宽度，进一步减小
      if (showDialog) {
        toolbarHeight = Math.min(500, window.innerHeight * 0.7); // 限制最大高度为屏幕70%
      } else {
        toolbarHeight = 320;
      }
    }
    
    // 直接使用视口边界，简化计算
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 计算可用区域
    let availableLeft = 20;
    let availableRight = viewportWidth - 40; // 增加右边距
    let availableTop = 20;
    let availableBottom = viewportHeight - 40;
    
    // 检测侧边栏并调整可用区域
    const sidebar = window.document.querySelector('.w-12.bg-white.border-r, .w-72.md\\:w-80.bg-white.border-r');
    if (sidebar) {
      const sidebarRect = sidebar.getBoundingClientRect();
      if (sidebarRect.width > 0 && sidebarRect.right > availableLeft) {
        availableLeft = Math.max(availableLeft, sidebarRect.right + 10);
      }
    }
    
    // 计算可用空间
    const availableWidth = availableRight - availableLeft;
    const availableHeight = availableBottom - availableTop;
    
    // 如果工具栏太大，调整尺寸
    if (toolbarWidth > availableWidth) {
      toolbarWidth = Math.max(availableWidth - 20, 250); // 最小宽度250px
    }
    if (toolbarHeight > availableHeight) {
      toolbarHeight = Math.max(availableHeight - 20, 100); // 最小高度100px
    }
    
    // 计算理想位置（紧跟鼠标位置）
    let left = position.x;
    let top = position.y;
    
    // 水平位置优化 - 确保工具栏完全在可视区域内
    const halfWidth = toolbarWidth / 2;
    
    // 考虑translateX(-50%)的影响，确保工具栏不会被截断
    if (left - halfWidth < availableLeft) {
      left = availableLeft + halfWidth;
    } else if (left + halfWidth > availableRight) {
      left = availableRight - halfWidth;
    }
    
    // 额外检查：确保即使使用transform也不会超出边界
    const actualLeft = left - halfWidth;
    const actualRight = left + halfWidth;
    
    if (actualLeft < availableLeft) {
      left = availableLeft + halfWidth;
    }
    if (actualRight > availableRight) {
      left = availableRight - halfWidth;
    }
    
    // 垂直位置优化 - 智能选择上方或下方
    const spaceAbove = position.y - availableTop;
    const spaceBelow = availableBottom - position.y;
    const preferredGap = 8; // 与鼠标位置的间距
    
    let finalTop;
    let transform = 'translateX(-50%)';
    
    if (spaceAbove >= toolbarHeight + preferredGap) {
      // 显示在上方
      finalTop = top - toolbarHeight - preferredGap;
      if (finalTop < availableTop) {
        finalTop = availableTop;
      }
    } else if (spaceBelow >= toolbarHeight + preferredGap) {
      // 显示在下方
      finalTop = top + preferredGap;
      if (finalTop + toolbarHeight > availableBottom) {
        finalTop = availableBottom - toolbarHeight;
      }
    } else {
      // 空间不足时，选择空间较大的一侧
      if (spaceAbove > spaceBelow) {
        finalTop = availableTop;
      } else {
        finalTop = availableBottom - toolbarHeight;
      }
    }
    
    return {
      left: left,
      top: finalTop,
      transform: transform,
      width: toolbarWidth,
      maxHeight: toolbarHeight,
      zIndex: 9999
    };
  };

  const positionStyle = calculatePosition();
  
  return (
    <div
      className="absolute bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
      style={{
        left: positionStyle.left,
        top: positionStyle.top,
        transform: positionStyle.transform,
        width: positionStyle.width,
        maxHeight: positionStyle.maxHeight,
        zIndex: positionStyle.zIndex
      }}
    >
      {!expandedAction ? (
        // 工具栏选项 - 优化尺寸和布局
        <div className="flex items-center p-1.5 gap-0.5 whitespace-nowrap">
          <button
            onClick={() => handleAction('ai-writing')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            title="AI辅助写作"
          >
            <Sparkles className="w-3.5 h-3.5 icon-gradient" />
            <span className="whitespace-nowrap">AI写作</span>
          </button>
          
          <button
            onClick={() => handleAction('ai-polish')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            title="AI文本润色"
          >
            <Wand2 className="w-3.5 h-3.5 icon-gradient" />
            <span className="whitespace-nowrap">AI润色</span>
          </button>
          
          <button
            onClick={() => handleAction('ai-translate')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            title="AI翻译"
          >
            <Globe className="w-3.5 h-3.5 icon-gradient" />
            <span className="whitespace-nowrap">AI翻译</span>
          </button>
          
          <button
            onClick={() => handleAction('ai-explain')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            title="AI解释"
          >
            <BookOpen className="w-3.5 h-3.5 icon-gradient" />
            <span className="whitespace-nowrap">AI解释</span>
          </button>
          
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs hover:bg-gray-100 rounded transition-colors flex-shrink-0 border-l border-gray-200 ml-1 pl-2"
              title="文件管理"
            >
              <Folder className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">文件</span>
            </button>
          )}
          
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors ml-1 border-l border-gray-200 flex-shrink-0"
            title="关闭"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        // 展开的内容区域
        <div className="flex flex-col h-full overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {expandedAction === 'ai-writing' && <><Sparkles className="w-4 h-4" />AI辅助写作</>}
              {expandedAction === 'ai-polish' && <><Wand2 className="w-4 h-4" />AI文本润色</>}
              {expandedAction === 'ai-translate' && <><Globe className="w-4 h-4" />AI翻译</>}
              {expandedAction === 'ai-explain' && <><BookOpen className="w-4 h-4" />AI解释</>}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* 选中的文本 */}
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="text-xs text-gray-500 mb-1">选中文本：</div>
            <div className="text-sm text-gray-800 max-h-20 overflow-y-auto">
              {selectedText}
            </div>
          </div>
          
          {/* AI润色对话框 */}
          {showDialog && expandedAction === 'ai-polish' && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="p-4 overflow-y-auto flex-1 min-h-0">
              {/* 建议选项 */}
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-3">建议</div>
                <div className="space-y-2">
                  <button
                     onClick={() => handlePresetAction('tone-serious')}
                     className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors text-left bg-white border-gray-200 hover:bg-gray-50"
                   >
                     <Sparkles className="w-4 h-4" />
                     调整语调：更严肃
                   </button>
                   <button
                     onClick={() => handlePresetAction('tone-lively')}
                     className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors text-left bg-white border-gray-200 hover:bg-gray-50"
                   >
                     <Sparkles className="w-4 h-4" />
                     调整语调：更活泼
                   </button>
                   <button
                     onClick={() => handlePresetAction('length-expand')}
                     className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors text-left bg-white border-gray-200 hover:bg-gray-50"
                   >
                     <Wand2 className="w-4 h-4" />
                     调整长度：更丰富
                   </button>
                   <button
                     onClick={() => handlePresetAction('length-compress')}
                     className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors text-left bg-white border-gray-200 hover:bg-gray-50"
                   >
                     <Wand2 className="w-4 h-4" />
                     调整长度：更精炼
                   </button>
                   <button
                     onClick={() => handlePresetAction('grammar-check')}
                     className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors text-left bg-white border-gray-200 hover:bg-gray-50"
                   >
                     <BookOpen className="w-4 h-4" />
                     语法与拼写检查
                   </button>
                </div>
              </div>
              
              {/* 输入框 */}
              <div className="mb-4">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="告诉AI你想要如何改进这段文字..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              </div>
               
               {/* 发送按钮 - 固定在底部 */}
               <div className="p-4 border-t border-gray-200">
                 <div className="flex justify-end">
                   <button
                     onClick={handleDialogSend}
                     disabled={!customPrompt.trim()}
                     className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                   >
                     发送
                   </button>
                 </div>
               </div>
             </div>
           )}
          
          {/* 其他功能的子选项区域 */}
          {!result && !isLoading && (
            <div className="p-3 border-b border-gray-200">
              {expandedAction === 'ai-writing' && !showDialog && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 mb-2">选择写作类型：</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedSubAction('continue')}
                      className={`px-3 py-2 text-sm rounded border transition-colors ${
                        selectedSubAction === 'continue' ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      续写内容
                    </button>
                    <button
                      onClick={() => setSelectedSubAction('generate-from-title')}
                      className={`px-3 py-2 text-sm rounded border transition-colors ${
                        selectedSubAction === 'generate-from-title' ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      标题生成
                    </button>
                  </div>
                </div>
              )}
              
              {expandedAction === 'ai-translate' && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 mb-2">选择翻译语言：</div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {/* 获取所有翻译模板并显示 */}
                    {PromptManager.getPromptsByCategory('translate').map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handlePresetAction(template.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors text-left bg-white border-gray-200 hover:bg-gray-50"
                      >
                        <Globe className="w-4 h-4" />
                        {template.name}
                      </button>
                    ))}
                    
                    {/* 如果没有翻译模板，显示提示 */}
                    {PromptManager.getPromptsByCategory('translate').length === 0 && (
                      <div className="text-xs text-gray-500 italic text-center py-4">
                        暂无翻译模板，请在设置中的"Prompt自定义"添加
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedSubAction && !showDialog && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleSubAction()}
                    className="w-full px-4 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                  >
                    开始处理
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* 结果区域 */}
          <div className="flex flex-col h-80">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 p-3">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                处理中...
              </div>
            ) : (
              <>
                {result ? (
                  <div className="flex-1 overflow-y-auto p-3 min-h-0">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                      {result}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-3">
                    <div className="text-sm text-gray-500 text-center">
                      {expandedAction === 'ai-explain' ? '点击下方按钮开始解释' : '请选择具体操作后点击开始处理'}
                    </div>
                  </div>
                )}
                
                {/* 操作按钮区域 - 始终显示 */}
                <div className="flex flex-col gap-2 p-3 border-t border-gray-200 flex-shrink-0 bg-white">
                  {result ? (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={insertAtSelection}
                          className="flex-1 px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                        >
                          插入
                        </button>
                        <button
                          onClick={insertAtEnd}
                          className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          插入到最后
                        </button>
                        <button
                          onClick={replaceSelection}
                          className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          替换
                        </button>
                      </div>
                      <button
                        onClick={copyResult}
                        className="w-full px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                      >
                        复制
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleSubAction()}
                      className="w-full px-4 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                      disabled={!selectedSubAction && expandedAction !== 'ai-explain'}
                    >
                      {expandedAction === 'ai-explain' ? '开始解释' : '开始处理'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionToolbar;