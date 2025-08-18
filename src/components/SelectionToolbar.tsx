import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Globe, BookOpen, X, ChevronDown, Folder, Minimize2, Settings, Menu, Plus, Copy } from 'lucide-react';
import { AIService, AIConfigManager, AIRequest } from '../services/aiService';
import { FileDocument } from '../services/fileService';
import { PromptManager, PromptTemplate } from '../services/promptService';
import { AITaskService } from '../services/aiTaskService';

type Document = FileDocument;

interface SelectionToolbarProps {
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
  document: Document;
  onDocumentChange: (document: Document) => void;
  onToggleSidebar?: () => void;
}

type ToolbarAction = 'ai-writing' | 'ai-polish' | 'ai-translate' | 'ai-explain' | 'ai-more';
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
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showCustomMenu, setShowCustomMenu] = useState(false);
  const [showMoreWindow, setShowMoreWindow] = useState(false);
  const [customActions, setCustomActions] = useState<Array<{id: string, name: string, prompt: string}>>([]);

  // 初始化AI服务和自定义操作
  useEffect(() => {
    const config = AIConfigManager.loadConfig();
    if (config && config.apiKey) {
      setAiService(new AIService(config));
    }
    
    // 加载自定义操作
    const loadCustomActions = () => {
      try {
        const saved = localStorage.getItem('customSelectionActions');
        if (saved) {
          setCustomActions(JSON.parse(saved));
        }
      } catch (error) {
        console.error('加载自定义操作失败:', error);
      }
    };
    
    loadCustomActions();
    // 移除演示用默认结果，保持真实 AI 流程
  }, []);
  
  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.selection-toolbar-menu')) {
        setShowSettingsMenu(false);
        setShowCustomMenu(false);
      }
    };
    
    if (showSettingsMenu || showCustomMenu) {
      window.document.addEventListener('mousedown', handleClickOutside);
      return () => window.document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSettingsMenu, showCustomMenu]);

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
      let actionName: string;
      
      switch (action) {
        case 'ai-writing':
          request = {
            prompt: selectedText,
            functionType: 'continue'
          };
          actionName = 'continue';
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
          actionName = 'explain';
          break;
        default:
          // 移除功能开发中提示
          setIsLoading(false);
          return;
      }
      
      // 创建AI任务
      const taskId = AITaskService.createTask(
        'selection',
        actionName,
        selectedText,
        document.id,
        document.title
      );
      setCurrentTaskId(taskId);
      
      // 更新任务状态为运行中
      AITaskService.updateTaskStatus(taskId, 'running');

      const response = await aiService.processText(request);
      
      if (response.success) {
        setResult(response.content);
        // 更新任务状态为完成
        AITaskService.updateTaskStatus(taskId, 'completed', response.content);
      } else {
        const errorMsg = response.error || '处理失败';
        setResult(errorMsg);
        // 更新任务状态为失败
        AITaskService.updateTaskStatus(taskId, 'error', undefined, errorMsg);
      }
    } catch (error) {
      const errorMsg = '处理出错: ' + (error instanceof Error ? error.message : '未知错误');
      setResult(errorMsg);
      // 更新任务状态为失败
      if (currentTaskId) {
        AITaskService.updateTaskStatus(currentTaskId, 'error', undefined, errorMsg);
      }
    } finally {
      setIsLoading(false);
      setCurrentTaskId(null);
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
      // 创建AI任务
      const taskId = AITaskService.createTask(
        'selection',
        templateId,
        selectedText,
        document.id,
        document.title
      );
      setCurrentTaskId(taskId);
      
      // 更新任务状态为运行中
      AITaskService.updateTaskStatus(taskId, 'running');
      
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
        case 'to-english':
          request = {
            prompt: `请将以下文本翻译为英文，输出要求如下：\n仅输出翻译结果，绝对不添加任何解释、解说、注释（包括括号内的补充文字），也不要有任何与翻译内容无关的文字。\n参考以下示例格式：\n【原文示例】：请你描述今天的天气。\n【翻译示例】：Please describe the weather today.\n现在请翻译：\n${promptText}`,
            functionType: 'translate'
          };
          break;
        case 'to-chinese':
          request = {
            prompt: `请将以下文本翻译为中文，输出要求如下：\n仅输出翻译结果，绝对不添加任何解释、解说、注释（包括括号内的补充文字），也不要有任何与翻译内容无关的文字。\n参考以下示例格式：\n【原文示例】：Please describe the weather today.\n【翻译示例】：请你描述今天的天气。\n现在请翻译：\n${promptText}`,
            functionType: 'translate'
          };
          break;
        case 'to-japanese':
          request = {
            prompt: `请将以下文本翻译为日文，输出要求如下：\n仅输出翻译结果，绝对不添加任何解释、解说、注释（包括括号内的补充文字），也不要有任何与翻译内容无关的文字。\n参考以下示例格式：\n【原文示例】：请你描述今天的天气。\n【翻译示例】：今日の天気を説明してください。\n现在请翻译：\n${promptText}`,
            functionType: 'translate'
          };
          break;
        case 'to-korean':
          request = {
            prompt: `请将以下文本翻译为韩文，输出要求如下：\n仅输出翻译结果，绝对不添加任何解释、解说、注释（包括括号内的补充文字），也不要有任何与翻译内容无关的文字。\n参考以下示例格式：\n【原文示例】：请你描述今天的天气。\n【翻译示例】：오늘 날씨를 설명해 주세요.\n现在请翻译：\n${promptText}`,
            functionType: 'translate'
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
        // 更新任务状态为完成
        AITaskService.updateTaskStatus(taskId, 'completed', response.content);
      } else {
        const errorMsg = response.error || '处理失败';
        setResult(errorMsg);
        // 更新任务状态为失败
        AITaskService.updateTaskStatus(taskId, 'error', undefined, errorMsg);
      }
    } catch (error) {
      const errorMsg = '处理出错: ' + (error instanceof Error ? error.message : '未知错误');
      setResult(errorMsg);
      // 更新任务状态为失败
      if (currentTaskId) {
        AITaskService.updateTaskStatus(currentTaskId, 'error', undefined, errorMsg);
      }
    } finally {
      setIsLoading(false);
      setCurrentTaskId(null);
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
      // 创建AI任务
      const taskId = AITaskService.createTask(
        'selection',
        'custom-polish',
        selectedText,
        document.id,
        document.title
      );
      setCurrentTaskId(taskId);
      
      // 更新任务状态为运行中
      AITaskService.updateTaskStatus(taskId, 'running');
      
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
        // 更新任务状态为完成
        AITaskService.updateTaskStatus(taskId, 'completed', response.content);
      } else {
        const errorMsg = response.error || '处理失败';
        setResult(errorMsg);
        // 更新任务状态为失败
        AITaskService.updateTaskStatus(taskId, 'error', undefined, errorMsg);
      }
    } catch (error) {
      const errorMsg = '处理出错: ' + (error instanceof Error ? error.message : '未知错误');
      setResult(errorMsg);
      // 更新任务状态为失败
      if (currentTaskId) {
        AITaskService.updateTaskStatus(currentTaskId, 'error', undefined, errorMsg);
      }
    } finally {
      setIsLoading(false);
      setCurrentTaskId(null);
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
      
      // 成功后不再弹出提示框，保持静默
      // alert('内容已插入到选中文本后');
    }
    // 不要自动关闭，让用户可以继续操作
    // onClose();
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
    
    // 成功后不再弹出提示框，保持静默
    // alert('内容已插入到文档末尾');
    
    // 不要自动关闭，让用户可以继续操作
    // onClose();
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
    
    // 成功后不再弹出提示框，保持静默
    // alert('已替换选中文本');
    
    // 不要自动关闭，让用户可以继续操作
    // onClose();
  };

  const copyResult = async () => {
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(result);
      // 成功后不再弹出提示框，保持静默
      // alert('已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败: ' + error);
    }
  };
  
  // 保存自定义操作
  const saveCustomActions = (actions: Array<{id: string, name: string, prompt: string}>) => {
    try {
      localStorage.setItem('customSelectionActions', JSON.stringify(actions));
      setCustomActions(actions);
    } catch (error) {
      console.error('保存自定义操作失败:', error);
    }
  };
  
  // 添加自定义操作
  const addCustomAction = () => {
    const name = prompt('请输入操作名称:');
    if (!name) return;
    
    const promptText = prompt('请输入AI提示词:');
    if (!promptText) return;
    
    const newAction = {
      id: Date.now().toString(),
      name: name.trim(),
      prompt: promptText.trim()
    };
    
    const newActions = [...customActions, newAction];
    saveCustomActions(newActions);
  };
  
  // 删除自定义操作
  const deleteCustomAction = (id: string) => {
    if (confirm('确定要删除这个自定义操作吗？')) {
      const newActions = customActions.filter(action => action.id !== id);
      saveCustomActions(newActions);
    }
  };
  
  // 执行自定义操作
  const executeCustomAction = async (action: {id: string, name: string, prompt: string}) => {
    if (!aiService) {
      setResult('请先配置AI服务');
      return;
    }
    
    setIsLoading(true);
    setResult('');
    setShowCustomMenu(false);
    
    try {
      const taskId = AITaskService.createTask(
        'selection',
        action.name,
        selectedText,
        document.id,
        document.title
      );
      setCurrentTaskId(taskId);
      
      AITaskService.updateTaskStatus(taskId, 'running');
      
      const request: AIRequest = {
        prompt: `${action.prompt}\n\n原文：${selectedText}`,
        functionType: 'rewrite'
      };
      
      const response = await aiService.processText(request);
      
      if (response.success) {
        setResult(response.content);
        AITaskService.updateTaskStatus(taskId, 'completed', response.content);
      } else {
        const errorMsg = response.error || '处理失败';
        setResult(errorMsg);
        AITaskService.updateTaskStatus(taskId, 'error', undefined, errorMsg);
      }
    } catch (error) {
      const errorMsg = '处理出错: ' + (error instanceof Error ? error.message : '未知错误');
      setResult(errorMsg);
      if (currentTaskId) {
        AITaskService.updateTaskStatus(currentTaskId, 'error', undefined, errorMsg);
      }
    } finally {
      setIsLoading(false);
      setCurrentTaskId(null);
    }
  };

  const handleSubAction = async () => {
    if (!selectedSubAction && expandedAction !== 'ai-explain') {
      setResult('请先选择具体操作');
      return;
    }
    
    if (!aiService) {
      setResult('请先配置AI服务');
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      let request: AIRequest;
      let promptText = selectedText;
      let actionName = selectedSubAction || 'explain';

      // 根据不同的子操作构建请求，使用自定义Prompt模板
      let promptTemplate: PromptTemplate | null = null;
      
      if (selectedSubAction) {
        promptTemplate = PromptManager.getPromptById(selectedSubAction);
      } else if (expandedAction === 'ai-explain') {
        promptTemplate = PromptManager.getPromptById('explain-content');
      }
      
      // 创建AI任务
      const taskId = AITaskService.createTask(
        'selection',
        actionName,
        selectedText,
        document.id,
        document.title
      );
      setCurrentTaskId(taskId);
      
      // 更新任务状态为运行中
      AITaskService.updateTaskStatus(taskId, 'running');
      
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
    let toolbarWidth = 460; // 增加基础宽度以显示所有按钮（包括菜单和设置）
    
    if (expandedAction) {
      toolbarWidth = 320; // 展开时宽度
      if (showDialog) {
        toolbarHeight = Math.min(560, window.innerHeight * 0.8); // 对话框给更高阈值
      } else {
        // 保证有结果时，预留足够空间：头部(48) + 选中文本(<=80) + 操作区(结果时~96) + 结果最小高度(160) + 内边距
        const headerH = 48;
        const selectedMaxH = 80; // 与 max-h-20 对齐
        const actionsH = result ? 96 : 0;
        const minResultH = result ? 160 : 120; // 没有结果时也留一点空间给提示
        const padding = 24;
        const minNeeded = headerH + selectedMaxH + actionsH + minResultH + padding; // 约 408px（有结果）
        const maxAllowed = window.innerHeight - 40;
        // 限制最大高度，同时确保不少于所需最小高度
        toolbarHeight = Math.min(Math.max(minNeeded, 260), Math.max(320, maxAllowed));
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
      toolbarHeight = Math.max(availableHeight - 20, 180); // 最小高度，略大以保证可滚动
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
  
  console.log('SelectionToolbar渲染，showMoreWindow状态:', showMoreWindow);
  
  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col"
      style={{
        left: positionStyle.left,
        top: positionStyle.top,
        transform: positionStyle.transform,
        width: positionStyle.width,
        maxHeight: positionStyle.maxHeight,
        height: expandedAction ? positionStyle.maxHeight : undefined,
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
          
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(selectedText);
                // 可以添加成功提示
              } catch (error) {
                console.error('复制失败:', error);
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs hover:bg-gray-100 rounded transition-colors flex-shrink-0 border-l border-gray-200 ml-1 pl-2"
            title="复制选中文本"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">复制</span>
          </button>
          
          <button
            onClick={() => handleAction('ai-more' as ToolbarAction)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs hover:bg-gray-100 rounded transition-colors flex-shrink-0 border-l border-gray-200 ml-1 pl-2"
            title="更多功能"
          >
            <Menu className="w-3.5 h-3.5 icon-gradient" />
            <span className="whitespace-nowrap">更多</span>
          </button>
           
           {/* 设置菜单 */}
           <div className="relative selection-toolbar-menu">
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setShowSettingsMenu(!showSettingsMenu);
               }}
               className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs hover:bg-gray-100 rounded transition-colors flex-shrink-0 border-l border-gray-200 ml-1 pl-2"
               title="设置"
             >
               <Settings className="w-3.5 h-3.5" />
             </button>
             
             {showSettingsMenu && (
               <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                 <div className="p-2">
                   <button
                     onClick={() => {
                       setShowSettingsMenu(false);
                       // 这里可以添加打开设置页面的逻辑
                     }}
                     className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-gray-100 rounded transition-colors text-left"
                   >
                     <Settings className="w-3 h-3" />
                     AI设置
                   </button>
                   <button
                     onClick={() => {
                       setShowSettingsMenu(false);
                       // 这里可以添加最小化的逻辑
                     }}
                     className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-gray-100 rounded transition-colors text-left"
                   >
                     <Minimize2 className="w-3 h-3" />
                     最小化
                   </button>
                 </div>
               </div>
             )}
           </div>
          
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
        <div className="flex flex-col h-full min-h-0">
          {/* 头部 */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {expandedAction === 'ai-writing' && <><Sparkles className="w-4 h-4" />AI辅助写作</>}
              {expandedAction === 'ai-polish' && <><Wand2 className="w-4 h-4" />AI文本润色</>}
              {expandedAction === 'ai-translate' && <><Globe className="w-4 h-4" />AI翻译</>}
              {expandedAction === 'ai-explain' && <><BookOpen className="w-4 h-4" />AI解释</>}
              {expandedAction === 'ai-more' && <><Menu className="w-4 h-4" />更多功能</>}
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
          
          {/* 更多功能选项 */}
          {!showDialog && expandedAction === 'ai-more' && (
            <div className="p-3">
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-3">功能选项</div>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowDialog(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors text-left bg-white border-gray-200 hover:bg-gray-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    问问LInk
                  </button>
                  <button
                    onClick={() => {
                      // 这里应该打开设置页面的Prompt自定义界面
                      alert('打开自定义设置界面');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors text-left bg-white border-gray-200 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    自定义设置
                  </button>
                  
                  {/* 显示自定义Prompt */}
                  {customActions.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 pt-2 mt-3">
                        <div className="text-sm text-gray-600 mb-2">自定义Prompt</div>
                        {customActions.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => executeCustomAction(action)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors text-left bg-white border-gray-200 hover:bg-gray-50 mb-2"
                            title={action.prompt}
                          >
                            <Plus className="w-4 h-4" />
                            {action.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* 告诉Link对话框 */}
          {showDialog && expandedAction === 'ai-more' && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="p-4 overflow-y-auto flex-1 min-h-0">
                {/* 对话输入框 */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">与Link对话</div>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="请输入您想要告诉Link的内容或问题..."
                    className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                {/* 发送按钮 */}
                 <div className="mb-4">
                   <button
                     onClick={async () => {
                       if (!customPrompt.trim() || !aiService) {
                         setResult('请先配置AI服务');
                         return;
                       }
                       
                       setIsLoading(true);
                        try {
                          const request: AIRequest = {
                            prompt: selectedText ? `请对以下文本执行指令："${customPrompt}"\n\n文本内容：\n${selectedText}` : customPrompt,
                            context: selectedText,
                            functionType: 'rewrite'
                          };
                          
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
                     }}
                     disabled={!customPrompt.trim() || isLoading}
                     className="w-full px-4 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isLoading ? '处理中...' : '发送给Link'}
                   </button>
                 </div>
                

              </div>
            </div>
          )}
          
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
                    {/* 默认翻译选项 */}
                    <button
                      onClick={() => handlePresetAction('to-english')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors text-left bg-white border-gray-200 hover:bg-gray-50"
                    >
                      <Globe className="w-4 h-4" />
                      翻译为英文
                    </button>
                    <button
                      onClick={() => handlePresetAction('to-chinese')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors text-left bg-white border-gray-200 hover:bg-gray-50"
                    >
                      <Globe className="w-4 h-4" />
                      翻译为中文
                    </button>
                    <button
                      onClick={() => handlePresetAction('to-japanese')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors text-left bg-white border-gray-200 hover:bg-gray-50"
                    >
                      <Globe className="w-4 h-4" />
                      翻译为日文
                    </button>
                    <button
                      onClick={() => handlePresetAction('to-korean')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors text-left bg-white border-gray-200 hover:bg-gray-50"
                    >
                      <Globe className="w-4 h-4" />
                      翻译为韩文
                    </button>
                    
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
          
          {/* 结果显示区域 */}
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 p-3">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              处理中...
            </div>
          ) : (
            <>
              {result ? (
                <div className="overflow-y-auto">
                  <div className="p-3">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                      {result}
                    </div>
                  </div>
                </div>
              ) : (
                expandedAction === 'ai-explain' ? (
                  <div className="flex items-center justify-center p-3 min-h-[100px]">
                    <div className="text-sm text-gray-500 text-center">
                      点击下方按钮开始解释
                    </div>
                  </div>
                ) : null
              )}
            </>
          )}
          
          {/* 操作按钮区域 - 只在有结果时显示，且固定在底部 */}
          {result && (
            <div className="flex-shrink-0 border-t border-gray-100 bg-white">
              <div className="p-3">
                <div className="flex gap-2">
                  <button
                    onClick={insertAtSelection}
                    className="flex-1 flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors duration-200 group"
                  >
                    <svg className="w-5 h-5 text-purple-600 mb-1 group-hover:text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-xs text-purple-700 font-medium">插入</span>
                  </button>
                  <button
                    type="button"
                    onClick={insertAtEnd}
                    className="flex-1 flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors duration-200 group"
                  >
                    <svg className="w-5 h-5 text-blue-600 mb-1 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs text-blue-700 font-medium">到末尾</span>
                  </button>
                  <button
                    type="button"
                    onClick={replaceSelection}
                    className="flex-1 flex flex-col items-center justify-center p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors duration-200 group"
                  >
                    <svg className="w-5 h-5 text-green-600 mb-1 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-xs text-green-700 font-medium">替换</span>
                  </button>
                  <button
                    type="button"
                    onClick={copyResult}
                    className="flex-1 flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors duration-200 group"
                  >
                    <svg className="w-5 h-5 text-gray-600 mb-1 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-gray-700 font-medium">复制</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 特定功能的开始处理按钮 */}
          {!result && !isLoading && (expandedAction === 'ai-explain' || (expandedAction === 'ai-writing' && selectedSubAction)) && (
            <div className="flex flex-col gap-2 p-3 border-t border-gray-200 bg-white flex-shrink-0">
              <button
                onClick={() => handleSubAction()}
                className="w-full px-4 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                disabled={!selectedSubAction && expandedAction !== 'ai-explain'}
              >
                {expandedAction === 'ai-explain' ? '开始解释' : '开始处理'}
              </button>
            </div>
          )}
        </div>
      )}

      </div>
    );
  };
  
  export default SelectionToolbar;