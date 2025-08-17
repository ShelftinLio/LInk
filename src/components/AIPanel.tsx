import React, { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw, Copy, Check, AlertCircle } from 'lucide-react';
import { AIService, AIConfigManager, AIRequest, AIResponse } from '../services/aiService';
import { PromptManager, PromptTemplate } from '../services/promptService';
import { FileDocument } from '../services/fileService';

type Document = FileDocument;

interface AIPanelProps {
  onClose: () => void;
  document: Document;
  onDocumentChange: (document: Document) => void;
}

type AIFunction = 'full-summary' | 'full-abstract' | 'full-translate' | 'outline-generate' | 'mindmap-generate';

const AIPanel: React.FC<AIPanelProps> = ({ onClose, document, onDocumentChange }) => {
  const [selectedFunction, setSelectedFunction] = useState<AIFunction>('full-summary');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [showFunctionSelection, setShowFunctionSelection] = useState(true);
  // 移除selectedText状态，专注于全文处理

  // 初始化AI服务
  useEffect(() => {
    const config = AIConfigManager.loadConfig();
    if (config) {
      setAiService(new AIService(config));
    }
  }, []);

  // 全文处理模块不需要选中文本功能

  const aiFunctions = [
    {
      id: 'full-summary' as AIFunction,
      name: '全文总结',
      description: '对整篇文档进行智能总结',
      icon: '📄'
    },
    {
      id: 'full-abstract' as AIFunction,
      name: '全文摘要',
      description: '生成文档核心要点摘要',
      icon: '📝'
    },
    {
      id: 'full-translate' as AIFunction,
      name: '全文翻译',
      description: '将整篇文档翻译为其他语言',
      icon: '🌐'
    },
    {
      id: 'outline-generate' as AIFunction,
      name: '大纲生成',
      description: '基于全文内容生成结构化大纲',
      icon: '📋'
    },
    {
      id: 'mindmap-generate' as AIFunction,
      name: '思维导图生成',
      description: '将文档内容转换为思维导图结构',
      icon: '🧠'
    }
  ];

  const handleAIProcess = async () => {
    if (!aiService) {
      setError('请先配置AI服务');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult('');
    
    try {
      // 全文处理 - 始终使用完整文档内容
      const fullContent = document.content;
      
      if (!fullContent.trim()) {
        setError('文档内容为空，请先添加内容');
        setIsLoading(false);
        return;
      }

      // 根据功能类型构建不同的请求
      let functionType: 'continue' | 'rewrite' | 'summarize' | 'translate' | 'outline';
      let prompt: string;
      
      switch (selectedFunction) {
        case 'full-summary':
          functionType = 'summarize';
          prompt = `请对以下文档进行全面总结，提取主要观点和核心内容：\n\n${fullContent}`;
          break;
        case 'full-abstract':
          functionType = 'summarize';
          prompt = `请为以下文档生成简洁的摘要，突出关键要点：\n\n${fullContent}`;
          break;
        case 'full-translate':
          functionType = 'translate';
          prompt = `请将以下完整文档翻译为英文：\n\n${fullContent}`;
          break;
        case 'outline-generate':
          functionType = 'outline';
          prompt = `请基于以下文档内容生成详细的结构化大纲：\n\n${fullContent}`;
          break;
        case 'mindmap-generate':
          functionType = 'outline';
          prompt = `请将以下文档内容转换为思维导图结构，使用层次化的要点组织：\n\n${fullContent}`;
          break;
        default:
          functionType = 'summarize';
          prompt = fullContent;
      }

      // 使用自定义Prompt模板
      const promptTemplate = PromptManager.getPromptById(selectedFunction);
      let finalPrompt: string;
      let finalFunctionType: AIRequest['functionType'];
      
      if (promptTemplate) {
        // 使用自定义模板
        finalPrompt = PromptManager.renderPrompt(promptTemplate.template, {
          text: fullContent,
          language: '英文' // 可以根据需要调整
        });
        
        // 根据模板分类确定功能类型
        switch (promptTemplate.category) {
          case 'writing':
            finalFunctionType = 'continue';
            break;
          case 'polish':
            finalFunctionType = 'rewrite';
            break;
          case 'translate':
            finalFunctionType = 'translate';
            break;
          case 'explain':
          case 'summary':
            finalFunctionType = 'summarize';
            break;
          default:
            finalFunctionType = 'summarize';
        }
      } else {
        // 回退到默认处理
        finalPrompt = prompt;
        finalFunctionType = functionType;
      }
      
      const request: AIRequest = {
        prompt: finalPrompt,
        functionType: finalFunctionType
      };

      const response: AIResponse = await aiService.processText(request);
      
      if (response.success) {
        setResult(response.content);
      } else {
        setError(response.error || 'AI处理失败');
      }
    } catch (error) {
      console.error('AI处理错误:', error);
      setError(error instanceof Error ? error.message : '处理过程中发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 插入到当前文档（光标位置）
  const handleInsertToDocument = () => {
    if (!result) return;
    
    const newContent = document.content + '\n\n' + result;
    onDocumentChange({
      ...document,
      content: newContent,
      updatedAt: new Date()
    });
    setResult('');
    onClose();
  };

  // 追加到文档末尾
  const handleAppendToDocument = () => {
    if (!result) return;
    
    const newContent = document.content + '\n\n' + result;
    onDocumentChange({
      ...document,
      content: newContent,
      updatedAt: new Date()
    });
    setResult('');
    onClose();
  };

  // 创建新文档
  const handleCreateNewDocument = () => {
    if (!result) return;
    
    // 这里应该调用创建新文档的函数
    // 暂时使用当前文档替换内容的方式
    onDocumentChange({
      ...document,
      title: `AI生成-${selectedFunction}`,
      content: result,
      updatedAt: new Date()
    });
    setResult('');
    onClose();
  };

  // 保存为模板
  const handleSaveAsTemplate = () => {
    if (!result) return;
    
    // 这里应该实现保存为模板的逻辑
    // 暂时复制到剪贴板
    copyToClipboard();
    alert('模板已保存到剪贴板');
  };

  const insertToDocument = () => {
    const newContent = document.content + result;
    onDocumentChange({
      ...document,
      content: newContent,
      updatedAt: new Date()
    });
    setResult('');
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* AI面板头部 */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI 助手</h3>
              <p className="text-sm text-gray-500">当前文档：{document.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* 可滚动内容区域 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-4" style={{maxHeight: 'calc(100vh - 200px)'}}>
        {/* AI功能选择 - 只在点击开始按钮后显示 */}
        {showFunctionSelection && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">选择AI功能</h4>
            <div className="space-y-2">
              {aiFunctions.map((func) => (
                <button
                  key={func.id}
                  onClick={() => setSelectedFunction(func.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedFunction === func.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{func.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{func.name}</div>
                      <div className="text-sm text-gray-500">{func.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* 确认生成按钮 */}
            <div className="mt-4">
              <button
                onClick={handleAIProcess}
                disabled={isLoading || !aiService}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    开始生成
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* 错误提示 */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        {/* 配置状态提示 */}
        {!aiService && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-700">
              请先在设置中配置AI服务才能使用AI功能
            </div>
          </div>
        )}
        
        {/* 全文处理提示 */}
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-600 mb-1">处理范围：</div>
          <div className="text-sm text-blue-800">
            将对整篇文档内容进行AI处理
          </div>
        </div>
        

      </div>
      
      {/* AI结果确认界面 */}
      {result && (
        <div className="flex flex-col h-full">
          {/* 结果标题 */}
          <div className="flex-shrink-0 border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">生成结果确认</h4>
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="复制"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              请确认以下生成的内容，然后选择操作方式
            </p>
          </div>
          
          {/* 生成内容展示 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                {result}
              </div>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="space-y-3">
              <button
                onClick={handleInsertToDocument}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                确认插入到当前文档
              </button>
              <button
                onClick={handleAppendToDocument}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                确认追加到文档末尾
              </button>
              <button
                onClick={handleCreateNewDocument}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                确认创建新文档
              </button>
              <button
                onClick={handleSaveAsTemplate}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                保存为模板
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setResult('')}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  重新生成
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      

    </div>
  );
};

export default AIPanel;