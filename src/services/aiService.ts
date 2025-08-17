// AI服务模块 - 统一管理各种AI API调用

export interface AIConfig {
  provider: 'openai' | 'claude' | 'gemini' | 'azure' | 'deepseek' | 'siliconflow' | 'glm' | 'custom';
  apiKey: string;
  baseURL?: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  models: string[];
  customModels?: string[];
}

export interface MultiProviderConfig {
  currentProvider: 'openai' | 'claude' | 'gemini' | 'azure' | 'deepseek' | 'siliconflow' | 'glm' | 'custom';
  currentModel: string;
  maxTokens: number;
  temperature: number;
  providers: {
    [key: string]: ProviderConfig;
  };
}

export interface AIRequest {
  prompt: string;
  context?: string;
  functionType: 'continue' | 'rewrite' | 'summarize' | 'translate' | 'outline';
}

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
}

// OpenAI格式的API调用（适用于OpenAI、Deepseek、硅基流动、GLM等）
class OpenAICompatibleService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  private getBaseURL(): string {
    // 优先使用用户自定义的 Base URL
    if (this.config.baseURL && this.config.baseURL.trim()) {
      return this.config.baseURL.trim();
    }
    
    // 使用默认的 Base URL
    switch (this.config.provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'deepseek':
        return 'https://api.deepseek.com/v1';
      case 'siliconflow':
        return 'https://api.siliconflow.cn/v1';
      case 'glm':
        return 'https://open.bigmodel.cn/api/paas/v4';
      case 'azure':
        return '';
      default:
        return 'https://api.openai.com/v1';
    }
  }

  private buildPrompt(request: AIRequest): string {
    const { prompt, context, functionType } = request;
    
    // 如果prompt已经是完整的指令（包含模板渲染的结果），直接使用
    if (prompt.includes('请将') || prompt.includes('翻译') || prompt.includes('Please translate')) {
      return prompt;
    }
    
    switch (functionType) {
      case 'continue':
        return `请基于以下内容进行续写，保持风格一致：\n\n${context || ''}\n\n${prompt}\n\n`;
      case 'rewrite':
        return `请改写以下文本，使其更加清晰、准确和流畅：\n\n${prompt}\n\n`;
      case 'summarize':
        return `请总结以下内容的要点：\n\n${prompt}\n\n`;
      case 'translate':
        return prompt; // 直接使用传入的prompt，因为它已经包含了完整的翻译指令
      case 'outline':
        return `请为以下内容生成的大纲，要求精简：\n\n${prompt}\n\n`;
      default:
        return prompt;
    }
  }

  async callAPI(request: AIRequest): Promise<AIResponse> {
    try {
      const baseURL = this.getBaseURL();
      const prompt = this.buildPrompt(request);
      
      // 构建完整的API端点URL
      let apiURL = baseURL;
      if (!apiURL.endsWith('/v1') && !apiURL.includes('/chat/completions')) {
        apiURL = apiURL.endsWith('/') ? `${apiURL}v1` : `${apiURL}/v1`;
      }
      
      const requestBody = {
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      };

      console.log('API调用详情:', {
        url: `${apiURL}/chat/completions`,
        provider: this.config.provider,
        model: this.config.model,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey.substring(0, 10)}...`
        },
        bodyPreview: {
          model: requestBody.model,
          messageCount: requestBody.messages.length,
          max_tokens: requestBody.max_tokens,
          temperature: requestBody.temperature
        }
      });

      const response = await fetch(`${apiURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorData = await response.text();
          errorDetails = errorData;
          console.error('API错误响应:', errorData);
        } catch (e) {
          console.error('无法读取错误响应:', e);
        }
        
        throw new Error(`API调用失败: ${response.status} ${response.statusText}${errorDetails ? ` - ${errorDetails}` : ''}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          content: data.choices[0].message.content,
          success: true
        };
      } else {
        throw new Error('API返回格式错误');
      }
    } catch (error) {
      console.error('AI API调用错误:', error);
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }
}

// Claude API调用
class ClaudeService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async callAPI(request: AIRequest): Promise<AIResponse> {
    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API调用失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.content && data.content[0] && data.content[0].text) {
        return {
          content: data.content[0].text,
          success: true
        };
      } else {
        throw new Error('Claude API返回格式错误');
      }
    } catch (error) {
      console.error('Claude API调用错误:', error);
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  private buildPrompt(request: AIRequest): string {
    const { prompt, context, functionType } = request;
    
    switch (functionType) {
      case 'continue':
        return `请基于以下内容进行续写，保持风格一致：\n\n${context || ''}\n\n${prompt}\n\n续写：`;
      case 'rewrite':
        return `请改写以下文本，使其更加清晰、准确和流畅：\n\n${prompt}\n\n改写后：`;
      case 'summarize':
        return `请总结以下内容的要点：\n\n${prompt}\n\n总结：`;
      case 'translate':
        return `请将以下文本翻译为英文：\n\n${prompt}\n\n翻译：`;
      case 'outline':
        return `请为以下内容生成详细的大纲：\n\n${prompt}\n\n大纲：`;
      default:
        return prompt;
    }
  }
}

// Deepseek API调用
class DeepseekService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async callAPI(request: AIRequest): Promise<AIResponse> {
    try {
      const prompt = this.buildPrompt(request);
      const baseURL = this.config.baseURL || 'https://api.deepseek.com';
      
      // Deepseek API 特殊处理
      const requestBody = {
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: false
      };

      console.log('Deepseek API调用详情:', {
        url: `${baseURL}/chat/completions`,
        model: this.config.model,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey.substring(0, 10)}...`
        },
        bodyPreview: requestBody
      });

      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorData = await response.text();
          errorDetails = errorData;
          console.error('Deepseek API错误响应:', errorData);
        } catch (e) {
          console.error('无法读取Deepseek错误响应:', e);
        }
        
        throw new Error(`Deepseek API调用失败: ${response.status} ${response.statusText}${errorDetails ? ` - ${errorDetails}` : ''}`);
      }

      const data = await response.json();
      console.log('Deepseek API响应:', data);
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          content: data.choices[0].message.content,
          success: true
        };
      } else {
        throw new Error('Deepseek API返回格式错误');
      }
    } catch (error) {
      console.error('Deepseek API调用错误:', error);
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  private buildPrompt(request: AIRequest): string {
    const { prompt, context, functionType } = request;
    
    switch (functionType) {
      case 'continue':
        return `请基于以下内容进行续写，保持风格一致：\n\n${context || ''}\n\n${prompt}\n\n续写：`;
      case 'rewrite':
        return `请改写以下文本，使其更加清晰、准确和流畅：\n\n${prompt}\n\n改写后：`;
      case 'summarize':
        return `请总结以下内容的要点：\n\n${prompt}\n\n总结：`;
      case 'translate':
        return `请将以下文本翻译为英文：\n\n${prompt}\n\n翻译：`;
      case 'outline':
        return `请为以下内容生成详细的大纲：\n\n${prompt}\n\n大纲：`;
      default:
        return prompt;
    }
  }
}

// GLM API调用
class GLMService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async callAPI(request: AIRequest): Promise<AIResponse> {
    try {
      const prompt = this.buildPrompt(request);
      const baseURL = this.config.baseURL || 'https://open.bigmodel.cn/api/paas/v4';
      
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`GLM API调用失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          content: data.choices[0].message.content,
          success: true
        };
      } else {
        throw new Error('GLM API返回格式错误');
      }
    } catch (error) {
      console.error('GLM API调用错误:', error);
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  private buildPrompt(request: AIRequest): string {
    const { prompt, context, functionType } = request;
    
    switch (functionType) {
      case 'continue':
        return `请基于以下内容进行续写，保持风格一致：\n\n${context || ''}\n\n${prompt}\n\n续写：`;
      case 'rewrite':
        return `请改写以下文本，使其更加清晰、准确和流畅：\n\n${prompt}\n\n改写后：`;
      case 'summarize':
        return `请总结以下内容的要点：\n\n${prompt}\n\n总结：`;
      case 'translate':
        return `请将以下文本翻译为英文：\n\n${prompt}\n\n翻译：`;
      case 'outline':
        return `请为以下内容生成详细的大纲：\n\n${prompt}\n\n大纲：`;
      default:
        return prompt;
    }
  }
}

// Gemini API调用
class GeminiService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async callAPI(request: AIRequest): Promise<AIResponse> {
    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: this.config.temperature,
            maxOutputTokens: this.config.maxTokens,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API调用失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return {
          content: data.candidates[0].content.parts[0].text,
          success: true
        };
      } else {
        throw new Error('Gemini API返回格式错误');
      }
    } catch (error) {
      console.error('Gemini API调用错误:', error);
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  private buildPrompt(request: AIRequest): string {
    const { prompt, context, functionType } = request;
    
    switch (functionType) {
      case 'continue':
        return `请基于以下内容进行续写，保持风格一致：\n\n${context || ''}\n\n${prompt}\n\n续写：`;
      case 'rewrite':
        return `请改写以下文本，使其更加清晰、准确和流畅：\n\n${prompt}\n\n改写后：`;
      case 'summarize':
        return `请总结以下内容的要点：\n\n${prompt}\n\n总结：`;
      case 'translate':
        return `请将以下文本翻译为英文：\n\n${prompt}\n\n翻译：`;
      case 'outline':
        return `请为以下内容生成详细的大纲：\n\n${prompt}\n\n大纲：`;
      default:
        return prompt;
    }
  }
}

// AI服务工厂
export class AIService {
  private config: AIConfig;
  private service: OpenAICompatibleService | ClaudeService | GeminiService | GLMService | DeepseekService;

  constructor(config: AIConfig) {
    this.config = config;
    this.service = this.createService();
  }

  private createService(): OpenAICompatibleService | ClaudeService | GeminiService | GLMService | DeepseekService {
    switch (this.config.provider) {
      case 'claude':
        return new ClaudeService(this.config);
      case 'gemini':
        return new GeminiService(this.config);
      case 'glm':
        return new GLMService(this.config);
      case 'deepseek':
        return new DeepseekService(this.config);
      case 'openai':
      case 'azure':
      case 'siliconflow':
      case 'custom':
      default:
        return new OpenAICompatibleService(this.config);
    }
  }

  async processText(request: AIRequest): Promise<AIResponse> {
    return await this.service.callAPI(request);
  }

  // API连接测试
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // 先进行基础诊断
      const diagnostics = await this.runDiagnostics();
      if (!diagnostics.success) {
        return { success: false, error: diagnostics.error };
      }

      const testRequest: AIRequest = {
        prompt: '测试连接',
        functionType: 'continue'
      };
      
      const result = await this.service.callAPI(testRequest);
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error || '连接测试失败' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  private async runDiagnostics(): Promise<{ success: boolean; error?: string }> {
    console.log('开始API诊断...');
    
    // 1. 检查API Key格式
    if (!this.config.apiKey || this.config.apiKey.trim().length === 0) {
      return { success: false, error: 'API Key不能为空' };
    }

    // 2. 检查API Key格式（针对不同服务商）
    const apiKeyValidation = this.validateApiKey();
    if (!apiKeyValidation.valid) {
      return { success: false, error: apiKeyValidation.error };
    }

    // 3. 检查模型名称
    if (!this.config.model || this.config.model.trim().length === 0) {
      return { success: false, error: '模型名称不能为空' };
    }

    // 4. 检查参数范围
    if (this.config.maxTokens <= 0 || this.config.maxTokens > 4096) {
      return { success: false, error: 'max_tokens参数应在1-4096范围内' };
    }

    if (this.config.temperature < 0 || this.config.temperature > 2) {
      return { success: false, error: 'temperature参数应在0-2范围内' };
    }

    console.log('API诊断通过');
     return { success: true };
  }

  private validateApiKey(): { valid: boolean; error?: string } {
    const { provider, apiKey } = this.config;
    
    switch (provider) {
      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          return { valid: false, error: 'OpenAI API Key应以"sk-"开头' };
        }
        break;
      case 'deepseek':
        if (!apiKey.startsWith('sk-')) {
          return { valid: false, error: 'Deepseek API Key应以"sk-"开头' };
        }
        break;
      case 'glm':
        // GLM API Key格式检查
        if (apiKey.length < 32) {
          return { valid: false, error: 'GLM API Key长度不足' };
        }
        break;
      case 'claude':
        if (!apiKey.startsWith('sk-ant-')) {
          return { valid: false, error: 'Claude API Key应以"sk-ant-"开头' };
        }
        break;
      // 其他服务商的验证规则可以在这里添加
    }
    
    return { valid: true };
  }

  // 网络连通性检查已移除，直接通过API调用来验证连接
  // 这样可以避免浏览器CORS策略导致的误报
}

// 配置管理
export class AIConfigManager {
  private static readonly STORAGE_KEY = 'ai-writing-config';
  private static readonly MULTI_PROVIDER_KEY = 'ai-writing-multi-config';

  // 向后兼容的方法
  static saveConfig(config: AIConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('保存AI配置失败:', error);
    }
  }

  static loadConfig(): AIConfig | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('加载AI配置失败:', error);
    }
    return null;
  }

  static clearConfig(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('清除AI配置失败:', error);
    }
  }

  // 新的多提供商配置方法
  static saveMultiProviderConfig(config: MultiProviderConfig): void {
    try {
      localStorage.setItem(this.MULTI_PROVIDER_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('保存多提供商配置失败:', error);
    }
  }

  static loadMultiProviderConfig(): MultiProviderConfig | null {
    try {
      const saved = localStorage.getItem(this.MULTI_PROVIDER_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('加载多提供商配置失败:', error);
    }
    return null;
  }

  static getDefaultMultiProviderConfig(): MultiProviderConfig {
    return {
      currentProvider: 'openai',
      currentModel: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7,
      providers: {
        openai: {
          apiKey: '',
          models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
          customModels: []
        },
        claude: {
          apiKey: '',
          models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
          customModels: []
        },
        gemini: {
          apiKey: '',
          models: ['gemini-pro', 'gemini-pro-vision'],
          customModels: []
        },
        azure: {
          apiKey: '',
          models: ['gpt-4', 'gpt-35-turbo'],
          customModels: []
        },
        deepseek: {
          apiKey: '',
          models: ['deepseek-chat', 'deepseek-reasoner'],
          customModels: []
        },
        siliconflow: {
          apiKey: '',
          models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'llama-3-8b', 'llama-3-70b'],
          customModels: []
        },
        glm: {
          apiKey: '',
          models: ['glm-4', 'glm-3-turbo'],
          customModels: []
        },
        custom: {
          apiKey: '',
          models: ['custom-model'],
          customModels: []
        }
      }
    };
  }

  // 转换为旧格式以保持兼容性
  static convertToLegacyConfig(multiConfig: MultiProviderConfig): AIConfig {
    const currentProvider = multiConfig.providers[multiConfig.currentProvider];
    return {
      provider: multiConfig.currentProvider,
      apiKey: currentProvider?.apiKey || '',
      baseURL: currentProvider?.baseURL,
      model: multiConfig.currentModel,
      maxTokens: multiConfig.maxTokens,
      temperature: multiConfig.temperature
    };
  }

  // 添加自定义模型
  static addCustomModel(provider: string, modelName: string): void {
    const config = this.loadMultiProviderConfig() || this.getDefaultMultiProviderConfig();
    if (config.providers[provider]) {
      if (!config.providers[provider].customModels) {
        config.providers[provider].customModels = [];
      }
      if (!config.providers[provider].customModels!.includes(modelName)) {
        config.providers[provider].customModels!.push(modelName);
        this.saveMultiProviderConfig(config);
      }
    }
  }

  // 删除自定义模型
  static removeCustomModel(provider: string, modelName: string): void {
    const config = this.loadMultiProviderConfig() || this.getDefaultMultiProviderConfig();
    if (config.providers[provider] && config.providers[provider].customModels) {
      config.providers[provider].customModels = config.providers[provider].customModels!.filter(
        model => model !== modelName
      );
      this.saveMultiProviderConfig(config);
    }
  }

  // 获取提供商的所有模型（包括自定义模型）
  static getProviderModels(provider: string): string[] {
    const config = this.loadMultiProviderConfig() || this.getDefaultMultiProviderConfig();
    const providerConfig = config.providers[provider];
    if (!providerConfig) return [];
    
    return [...providerConfig.models, ...(providerConfig.customModels || [])];
  }
}