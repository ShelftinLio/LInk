import React, { useState, useEffect } from 'react';
import { X, Key, Globe, Palette, Save, CheckCircle, AlertCircle, Plus, Trash2, Edit3, Copy, RotateCcw } from 'lucide-react';
import { AIService, AIConfigManager, AIConfig as ServiceAIConfig, MultiProviderConfig } from '../services/aiService';
import { PromptManager, PromptTemplate, PromptConfig } from '../services/promptService';

interface SettingsModalProps {
  onClose: () => void;
}

type AIProvider = 'openai' | 'claude' | 'gemini' | 'azure' | 'deepseek' | 'siliconflow' | 'glm' | 'custom';

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'general' | 'appearance' | 'prompt'>('ai');
  const [multiConfig, setMultiConfig] = useState<MultiProviderConfig>(AIConfigManager.getDefaultMultiProviderConfig());
  const [newModelName, setNewModelName] = useState('');
  const [showAddModel, setShowAddModel] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Prompt管理相关状态
  const [promptConfig, setPromptConfig] = useState<PromptConfig>(PromptManager.loadPromptConfig());
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplate | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PromptTemplate['category']>('writing');
  
  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 加载保存的配置
  useEffect(() => {
    const savedMultiConfig = AIConfigManager.loadMultiProviderConfig();
    if (savedMultiConfig) {
      setMultiConfig(savedMultiConfig);
    } else {
      // 尝试从旧配置迁移
      const legacyConfig = AIConfigManager.loadConfig();
      if (legacyConfig) {
        const defaultMultiConfig = AIConfigManager.getDefaultMultiProviderConfig();
        defaultMultiConfig.currentProvider = legacyConfig.provider;
        defaultMultiConfig.currentModel = legacyConfig.model;
        defaultMultiConfig.maxTokens = legacyConfig.maxTokens;
        defaultMultiConfig.temperature = legacyConfig.temperature;
        defaultMultiConfig.providers[legacyConfig.provider].apiKey = legacyConfig.apiKey;
        if (legacyConfig.baseURL) {
          defaultMultiConfig.providers[legacyConfig.provider].baseURL = legacyConfig.baseURL;
        }
        setMultiConfig(defaultMultiConfig);
        AIConfigManager.saveMultiProviderConfig(defaultMultiConfig);
      }
    }
  }, []);

  const aiProviders = [
    {
      id: 'openai' as AIProvider,
      name: 'OpenAI',
      description: 'GPT-4, GPT-3.5 Turbo',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
    },
    {
      id: 'claude' as AIProvider,
      name: 'Anthropic Claude',
      description: 'Claude-3 系列模型',
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
    },
    {
      id: 'gemini' as AIProvider,
      name: 'Google Gemini',
      description: 'Gemini Pro 系列',
      models: ['gemini-pro', 'gemini-pro-vision']
    },
    {
      id: 'azure' as AIProvider,
      name: 'Azure OpenAI',
      description: 'Azure 托管的 OpenAI 服务',
      models: ['gpt-4', 'gpt-35-turbo']
    },
    {
      id: 'deepseek' as AIProvider,
      name: 'Deepseek',
      description: 'Deepseek V3 和 R1 系列模型',
      models: ['deepseek-chat', 'deepseek-reasoner']
    },
    {
      id: 'siliconflow' as AIProvider,
      name: '硅基流动',
      description: 'SiliconFlow 云端推理服务',
      models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'llama-3-8b', 'llama-3-70b']
    },
    {
      id: 'glm' as AIProvider,
      name: 'GLM (智谱AI)',
      description: 'ChatGLM 系列模型',
      models: ['glm-4', 'glm-3-turbo']
    },
    {
      id: 'custom' as AIProvider,
      name: '自定义API',
      description: '兼容 OpenAI API 的自定义服务',
      models: ['custom-model']
    }
  ];

  const handleSave = () => {
    try {
      AIConfigManager.saveMultiProviderConfig(multiConfig);
      // 同时保存为旧格式以保持兼容性
      const legacyConfig = AIConfigManager.convertToLegacyConfig(multiConfig);
      AIConfigManager.saveConfig(legacyConfig);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存配置失败，请重试');
    }
  };

  const testConnection = async () => {
    const currentProviderConfig = multiConfig.providers[multiConfig.currentProvider];
    if (!currentProviderConfig?.apiKey.trim()) {
      setTestResult({ success: false, error: '请先输入API Key' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const legacyConfig = AIConfigManager.convertToLegacyConfig(multiConfig);
      const aiService = new AIService(legacyConfig);
      const result = await aiService.testConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : '连接测试失败'
      });
    } finally {
      setTesting(false);
    }
  };

  // 添加自定义模型
  const handleAddCustomModel = () => {
    if (newModelName.trim()) {
      AIConfigManager.addCustomModel(multiConfig.currentProvider, newModelName.trim());
      const updatedConfig = { ...multiConfig };
      if (!updatedConfig.providers[multiConfig.currentProvider].customModels) {
        updatedConfig.providers[multiConfig.currentProvider].customModels = [];
      }
      updatedConfig.providers[multiConfig.currentProvider].customModels!.push(newModelName.trim());
      setMultiConfig(updatedConfig);
      setNewModelName('');
      setShowAddModel(false);
    }
  };

  // 删除自定义模型
  const handleRemoveCustomModel = (modelName: string) => {
    AIConfigManager.removeCustomModel(multiConfig.currentProvider, modelName);
    const updatedConfig = { ...multiConfig };
    updatedConfig.providers[multiConfig.currentProvider].customModels = 
      updatedConfig.providers[multiConfig.currentProvider].customModels?.filter(m => m !== modelName) || [];
    setMultiConfig(updatedConfig);
  };

  // 获取当前提供商的所有模型
  const getCurrentProviderModels = () => {
    const provider = multiConfig.providers[multiConfig.currentProvider];
    if (!provider) return [];
    return [...provider.models, ...(provider.customModels || [])];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div className={`bg-white shadow-xl w-full h-full md:max-w-4xl md:max-h-[90vh] md:rounded-lg overflow-hidden flex flex-col`}>
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                aria-label="切换导航"
              >
                <Key className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            aria-label="关闭设置"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 relative">
          {/* 移动端侧边栏遮罩 */}
          {isMobile && showMobileSidebar && (
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 z-10"
              onClick={() => setShowMobileSidebar(false)}
            />
          )}
          
          {/* 侧边栏 */}
          <div className={`${
            isMobile 
              ? `absolute left-0 top-0 h-full z-20 transform transition-transform duration-300 ${
                  showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
                }`
              : 'relative'
          } w-64 md:w-64 bg-gray-50 border-r border-gray-200 p-3 md:p-4 shadow-lg md:shadow-none`}>
            <nav className="space-y-2">
              <button
                onClick={() => {
                  setActiveTab('ai');
                  if (isMobile) setShowMobileSidebar(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-left transition-colors touch-manipulation ${
                  activeTab === 'ai' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                <Key className="w-4 h-4" />
                AI 配置
              </button>
              <button
                onClick={() => {
                  setActiveTab('general');
                  if (isMobile) setShowMobileSidebar(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-left transition-colors touch-manipulation ${
                  activeTab === 'general' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                <Globe className="w-4 h-4" />
                通用设置
              </button>
              <button
                onClick={() => {
                  setActiveTab('appearance');
                  if (isMobile) setShowMobileSidebar(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-left transition-colors touch-manipulation ${
                  activeTab === 'appearance' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                <Palette className="w-4 h-4" />
                外观设置
              </button>
              <button
                onClick={() => {
                  setActiveTab('prompt');
                  if (isMobile) setShowMobileSidebar(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-left transition-colors touch-manipulation ${
                  activeTab === 'prompt' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                Prompt自定义
              </button>
            </nav>
          </div>

          {/* 主内容区域 */}
          <div className="flex-1 p-4 md:p-6 overflow-auto">
            {activeTab === 'ai' && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">AI 服务配置</h3>
                  
                  {/* AI 提供商选择 */}
                  <div className="mb-4 md:mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      选择 AI 提供商
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {aiProviders.map((provider) => (
                        <button
                          key={provider.id}
                          onClick={() => {
                            const updatedConfig = { ...multiConfig };
                            updatedConfig.currentProvider = provider.id;
                            // 设置推荐的默认模型
                            switch (provider.id) {
                              case 'deepseek':
                                updatedConfig.currentModel = 'deepseek-chat';
                                break;
                              case 'glm':
                                updatedConfig.currentModel = 'glm-4.5-flash';
                                break;
                              case 'openai':
                                updatedConfig.currentModel = 'gpt-5';
                                break;
                              case 'claude':
                                updatedConfig.currentModel = 'claude-3.7-sonnet';
                                break;
                              case 'gemini':
                                updatedConfig.currentModel = 'gemini-pro';
                                break;
                              default:
                                const providerModels = getCurrentProviderModels();
                                if (providerModels.length > 0) {
                                  updatedConfig.currentModel = providerModels[0];
                                }
                                break;
                            }
                            setMultiConfig(updatedConfig);
                          }}
                          className={`p-4 md:p-4 border rounded-lg text-left transition-colors touch-manipulation ${
                            multiConfig.currentProvider === provider.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300 active:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium text-gray-900">{provider.name}</div>
                          <div className="text-sm text-gray-500 mt-1">{provider.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* API Key 配置 */}
                  <div className="mb-4 md:mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key ({aiProviders.find(p => p.id === multiConfig.currentProvider)?.name})
                    </label>
                    <input
                      type="password"
                      value={multiConfig.providers[multiConfig.currentProvider]?.apiKey || ''}
                      onChange={(e) => {
                        const updatedConfig = { ...multiConfig };
                        if (!updatedConfig.providers[multiConfig.currentProvider]) {
                          updatedConfig.providers[multiConfig.currentProvider] = {
                            apiKey: '',
                            models: [],
                            customModels: []
                          };
                        }
                        updatedConfig.providers[multiConfig.currentProvider].apiKey = e.target.value;
                        setMultiConfig(updatedConfig);
                      }}
                      className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base md:text-sm touch-manipulation"
                      placeholder="输入您的 API Key"
                    />
                  </div>

                  {/* Base URL 配置（可选） */}
                  <div className="mb-4 md:mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base URL (可选)
                    </label>
                    <input
                      type="url"
                      value={multiConfig.providers[multiConfig.currentProvider]?.baseURL || ''}
                      onChange={(e) => {
                        const updatedConfig = { ...multiConfig };
                        if (!updatedConfig.providers[multiConfig.currentProvider]) {
                          updatedConfig.providers[multiConfig.currentProvider] = {
                            apiKey: '',
                            models: [],
                            customModels: []
                          };
                        }
                        updatedConfig.providers[multiConfig.currentProvider].baseURL = e.target.value;
                        setMultiConfig(updatedConfig);
                      }}
                      className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base md:text-sm touch-manipulation"
                      placeholder={(() => {
                        switch (multiConfig.currentProvider) {
                          case 'openai':
                            return 'https://api.openai.com/v1';
                          case 'claude':
                            return 'https://api.anthropic.com';
                          case 'gemini':
                            return 'https://generativelanguage.googleapis.com/v1beta';
                          case 'azure':
                            return 'https://your-resource.openai.azure.com';
                          case 'deepseek':
                            return 'https://api.deepseek.com/v1';
                          case 'siliconflow':
                            return 'https://api.siliconflow.cn/v1';
                          case 'glm':
                            return 'https://open.bigmodel.cn/api/paas/v4';
                          case 'custom':
                            return '输入您的自定义API地址';
                          default:
                            return 'https://api.example.com/v1';
                        }
                      })()}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      {(() => {
                        switch (multiConfig.currentProvider) {
                          case 'openai':
                            return '留空使用默认OpenAI API地址';
                          case 'claude':
                            return '留空使用默认Anthropic API地址';
                          case 'gemini':
                            return '留空使用默认Google Gemini API地址';
                          case 'azure':
                            return '请输入您的Azure OpenAI资源地址';
                          case 'deepseek':
                            return '留空使用默认Deepseek API地址';
                          case 'siliconflow':
                            return '留空使用默认硅基流动API地址';
                          case 'glm':
                            return '留空使用默认智谱AI API地址';
                          case 'custom':
                            return '请输入兼容OpenAI格式的API地址';
                          default:
                            return '留空使用默认API地址';
                        }
                      })()}
                    </div>
                  </div>

                  {/* 模型选择 */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      模型名称
                    </label>
                    
                    <input
                      type="text"
                      value={multiConfig.currentModel}
                      onChange={(e) => {
                        const updatedConfig = { ...multiConfig };
                        updatedConfig.currentModel = e.target.value;
                        setMultiConfig(updatedConfig);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder={(() => {
                        switch (multiConfig.currentProvider) {
                          case 'deepseek':
                            return 'deepseek-chat';
                          case 'glm':
                            return 'glm-4.5-flash';
                          case 'openai':
                            return 'gpt-4';
                          case 'claude':
                            return 'claude-3-sonnet';
                          case 'gemini':
                            return 'gemini-pro';
                          default:
                            return '输入模型名称';
                        }
                      })()} 
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      {(() => {
                        switch (multiConfig.currentProvider) {
                          case 'deepseek':
                            return '推荐：deepseek-chat 或 deepseek-reasoner';
                          case 'glm':
                            return '推荐：glm-4.5-flash 或 glm-4';
                          case 'openai':
                            return '推荐：gpt-4 或 gpt-3.5-turbo';
                          case 'claude':
                            return '推荐：claude-3-sonnet 或 claude-3-opus';
                          case 'gemini':
                            return '推荐：gemini-pro 或 gemini-pro-vision';
                          default:
                            return '请输入有效的模型名称';
                        }
                      })()} 
                    </div>

                    {/* 自定义模型列表 */}
                    {multiConfig.providers[multiConfig.currentProvider]?.customModels && 
                     multiConfig.providers[multiConfig.currentProvider].customModels!.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-600 mb-2">自定义模型：</div>
                        <div className="space-y-1">
                          {multiConfig.providers[multiConfig.currentProvider].customModels!.map((model) => (
                            <div key={model} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                              <span className="text-sm">{model}</span>
                              <button
                                onClick={() => handleRemoveCustomModel(model)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 添加自定义模型对话框 */}
                    {showAddModel && (
                      <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newModelName}
                            onChange={(e) => setNewModelName(e.target.value)}
                            placeholder="输入模型名称"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddCustomModel();
                              }
                            }}
                          />
                          <button
                            onClick={handleAddCustomModel}
                            className="px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                          >
                            添加
                          </button>
                          <button
                            onClick={() => {
                              setShowAddModel(false);
                              setNewModelName('');
                            }}
                            className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 高级参数 */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        最大 Token 数
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="8000"
                        value={multiConfig.maxTokens}
                        onChange={(e) => {
                          const updatedConfig = { ...multiConfig };
                          updatedConfig.maxTokens = parseInt(e.target.value) || 2000;
                          setMultiConfig(updatedConfig);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        温度 (0-1)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={multiConfig.temperature}
                        onChange={(e) => {
                          const updatedConfig = { ...multiConfig };
                          updatedConfig.temperature = parseFloat(e.target.value) || 0.7;
                          setMultiConfig(updatedConfig);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* 测试连接 */}
                  <div className="mb-6">
                    <button
                      onClick={testConnection}
                      disabled={testing}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {testing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {testing ? '测试中...' : '测试连接'}
                    </button>
                    
                    {testResult && (
                      <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
                        testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {testResult.success ? (
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="text-sm">
                          {testResult.success ? '连接测试成功！' : testResult.error}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">通用设置</h3>
                <p className="text-gray-600">通用设置功能开发中...</p>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-3 md:mb-4">外观设置</h3>
                <p className="text-gray-600">外观设置功能开发中...</p>
              </div>
            )}
            
            {activeTab === 'prompt' && (
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-medium text-gray-900">Prompt自定义</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingPrompt(null);
                        setShowPromptEditor(true);
                      }}
                      className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      新建Prompt
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('确定要重置所有Prompt为默认设置吗？此操作不可撤销。')) {
                          PromptManager.resetToDefaults();
                          setPromptConfig(PromptManager.loadPromptConfig());
                          setSaved(true);
                          setTimeout(() => setSaved(false), 2000);
                        }
                      }}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      重置默认
                    </button>
                  </div>
                </div>
                
                {/* 分类选择 */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8">
                    {[
                      { id: 'writing', name: 'AI写作' },
                      { id: 'polish', name: 'AI润色' },
                      { id: 'translate', name: 'AI翻译' },
                      { id: 'explain', name: 'AI解释' },
                      { id: 'summary', name: 'AI总结' }
                    ].map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id as PromptTemplate['category'])}
                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                          selectedCategory === category.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </nav>
                </div>
                
                {/* Prompt列表 */}
                <div className="space-y-3">
                  {promptConfig.templates
                    .filter(template => template.category === selectedCategory)
                    .map((template) => (
                      <div
                        key={template.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{template.name}</h4>
                              {template.id.startsWith('custom-') && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  自定义
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                            <div className="bg-gray-50 rounded p-3 text-sm font-mono text-gray-700 max-h-20 overflow-y-auto">
                              {template.template}
                            </div>
                            {template.variables && template.variables.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500">变量: </span>
                                {template.variables.map((variable, index) => (
                                  <span
                                    key={variable}
                                    className="inline-block px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded mr-1"
                                  >
                                    {variable}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 ml-4">
                            <button
                              onClick={() => {
                                setEditingPrompt(template);
                                setShowPromptEditor(true);
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="编辑"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const newTemplate = {
                                  ...template,
                                  name: `${template.name} (副本)`,
                                  id: undefined
                                };
                                delete (newTemplate as any).id;
                                const newId = PromptManager.addPrompt(newTemplate);
                                setPromptConfig(PromptManager.loadPromptConfig());
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="复制"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {(template.id.startsWith('custom-') || (!['to-english', 'to-chinese'].includes(template.id))) && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`确定要删除 "${template.name}" 吗？`)) {
                                    PromptManager.deletePrompt(template.id);
                                    setPromptConfig(PromptManager.loadPromptConfig());
                                  }
                                }}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
          <div className="p-4 md:p-6">
            {/* 移动端垂直布局，桌面端水平布局 */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
              <div className="flex items-center gap-2 order-2 md:order-1">
                {saved && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">配置已保存</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 order-1 md:order-2">
                <button
                  onClick={onClose}
                  className="flex-1 md:flex-none px-4 py-2.5 md:py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors touch-manipulation text-base md:text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 md:flex-none px-4 py-2.5 md:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 touch-manipulation text-base md:text-sm"
                >
                  <Save className="w-4 h-4" />
                  保存设置
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Prompt编辑器模态框 */}
      {showPromptEditor && (
        <PromptEditor
          prompt={editingPrompt}
          onSave={(prompt) => {
            if (editingPrompt) {
              PromptManager.updatePrompt(editingPrompt.id, prompt);
            } else {
              PromptManager.addPrompt(prompt);
            }
            setPromptConfig(PromptManager.loadPromptConfig());
            setShowPromptEditor(false);
            setEditingPrompt(null);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
          onCancel={() => {
            setShowPromptEditor(false);
            setEditingPrompt(null);
          }}
        />
      )}
    </div>
  );
};

// Prompt编辑器组件
interface PromptEditorProps {
  prompt: PromptTemplate | null;
  onSave: (prompt: Omit<PromptTemplate, 'id'>) => void;
  onCancel: () => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ prompt, onSave, onCancel }) => {
  const [name, setName] = useState(prompt?.name || '');
  const [description, setDescription] = useState(prompt?.description || '');
  const [template, setTemplate] = useState(prompt?.template || '');
  const [category, setCategory] = useState<PromptTemplate['category']>(prompt?.category || 'writing');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSave = () => {
    const validation = PromptManager.validateTemplate(template);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    
    if (!name.trim()) {
      setErrors(['名称不能为空']);
      return;
    }
    
    if (!description.trim()) {
      setErrors(['描述不能为空']);
      return;
    }
    
    const variables = PromptManager.extractVariables(template);
    
    onSave({
      name: name.trim(),
      description: description.trim(),
      template: template.trim(),
      category,
      variables
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {prompt ? '编辑Prompt' : '新建Prompt'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 错误提示 */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">请修正以下错误：</h4>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                名称 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="输入Prompt名称"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分类 *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PromptTemplate['category'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="writing">AI写作</option>
                <option value="polish">AI润色</option>
                <option value="translate">AI翻译</option>
                <option value="explain">AI解释</option>
                <option value="summary">AI总结</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述 *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="简要描述这个Prompt的用途"
            />
          </div>
          
          {/* Prompt模板 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt模板 *
            </label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              placeholder="输入Prompt模板，使用 {变量名} 来定义变量，例如：请将以下文本翻译为{language}：\n\n{text}"
            />
            <div className="mt-2 text-xs text-gray-500">
              <p>• 使用 {'{变量名}'} 来定义变量，如 {'{text}'}, {'{language}'} 等</p>
              <p>• 变量名只能包含字母、数字和下划线，且不能以数字开头</p>
              <p>• 常用变量：{'{text}'} (文本内容), {'{language}'} (目标语言)</p>
            </div>
          </div>
          
          {/* 变量预览 */}
          {template && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                检测到的变量
              </label>
              <div className="flex flex-wrap gap-2">
                {PromptManager.extractVariables(template).map((variable) => (
                  <span
                    key={variable}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                  >
                    {variable}
                  </span>
                ))}
                {PromptManager.extractVariables(template).length === 0 && (
                  <span className="text-gray-500 text-sm">未检测到变量</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;