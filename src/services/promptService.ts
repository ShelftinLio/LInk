export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  category: 'writing' | 'polish' | 'translate' | 'explain' | 'summary';
  variables?: string[]; // 模板中的变量，如 {text}, {language}
}

export interface PromptConfig {
  templates: PromptTemplate[];
  version: string;
}

export class PromptManager {
  private static readonly STORAGE_KEY = 'ai-writing-prompts';
  private static readonly VERSION = '1.0.0';

  // 默认Prompt模板
  private static getDefaultPrompts(): PromptTemplate[] {
    return [
      // AI写作类
      {
        id: 'continue-writing',
        name: '续写',
        description: '基于现有内容继续写作',
        template: '请基于以下内容继续写作，保持风格和语调一致：\n\n{text}',
        category: 'writing',
        variables: ['text']
      },
      {
        id: 'generate-from-title',
        name: '根据标题生成',
        description: '根据标题生成文章内容',
        template: '请根据以下标题生成一篇文章：\n\n标题：{text}\n\n要求：内容丰富、结构清晰、语言流畅。',
        category: 'writing',
        variables: ['text']
      },
      
      // AI润色类
      {
        id: 'tone-serious',
        name: '严肃语调',
        description: '调整为严肃正式的语调',
        template: '请将以下文本调整为更严肃正式的语调：\n\n{text}',
        category: 'polish',
        variables: ['text']
      },
      {
        id: 'tone-lively',
        name: '活泼语调',
        description: '调整为活泼生动的语调',
        template: '请将以下文本调整为更活泼的语调：\n\n{text}',
        category: 'polish',
        variables: ['text']
      },
      {
        id: 'length-expand',
        name: '扩展内容',
        description: '扩展文本内容',
        template: '请将以下文本扩展得更丰富详细：\n\n{text}',
        category: 'polish',
        variables: ['text']
      },
      {
        id: 'length-compress',
        name: '精简内容',
        description: '精简压缩文本',
        template: '请将以下文本精炼压缩：\n\n{text}',
        category: 'polish',
        variables: ['text']
      },
      {
        id: 'grammar-check',
        name: '语法检查',
        description: '检查并修正语法错误',
        template: '请检查并修正以下文本的语法和拼写错误：\n\n{text}',
        category: 'polish',
        variables: ['text']
      },
      
      // AI翻译类
      {
        id: 'to-english',
        name: '翻译为英文',
        description: '将文本翻译为英文',
        template: '请将以下文本翻译为英文：\n\n{text}',
        category: 'translate',
        variables: ['text']
      },
      {
        id: 'to-chinese',
        name: '翻译为中文',
        description: '将文本翻译为中文',
        template: '请将以下文本翻译为中文：\n\n{text}',
        category: 'translate',
        variables: ['text']
      },
      {
        id: 'to-japanese',
        name: '翻译为日文',
        description: '将文本翻译为日文',
        template: '请将以下文本翻译为日文：\n\n{text}',
        category: 'translate',
        variables: ['text']
      },
      {
        id: 'to-korean',
        name: '翻译为韩文',
        description: '将文本翻译为韩文',
        template: '请将以下文本翻译为韩文：\n\n{text}',
        category: 'translate',
        variables: ['text']
      },
      
      // AI解释类
      {
        id: 'explain-content',
        name: '内容解释',
        description: '详细解释内容含义',
        template: '请用中文详细解释以下内容：\n\n{text}',
        category: 'explain',
        variables: ['text']
      },
      
      // AI总结类
      {
        id: 'full-summary',
        name: '全文总结',
        description: '对整篇文档进行智能总结',
        template: '请对以下文档进行智能总结：\n\n{text}',
        category: 'summary',
        variables: ['text']
      },
      {
        id: 'full-abstract',
        name: '全文摘要',
        description: '生成文档核心要点摘要',
        template: '请为以下文档生成核心要点摘要：\n\n{text}',
        category: 'summary',
        variables: ['text']
      },
      {
        id: 'outline-generate',
        name: '大纲生成',
        description: '基于全文内容生成结构化大纲',
        template: '请基于以下文档内容生成结构化大纲：\n\n{text}',
        category: 'summary',
        variables: ['text']
      },
      {
        id: 'mindmap-generate',
        name: '思维导图生成',
        description: '将文档内容转换为思维导图结构',
        template: '请将以下文档内容转换为思维导图结构：\n\n{text}',
        category: 'summary',
        variables: ['text']
      }
    ];
  }

  // 加载Prompt配置
  static loadPromptConfig(): PromptConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored) as PromptConfig;
        // 检查版本，如果版本不匹配则合并默认模板
        if (config.version !== this.VERSION) {
          return this.migratePromptConfig(config);
        }
        return config;
      }
    } catch (error) {
      console.error('Failed to load prompt config:', error);
    }
    
    // 返回默认配置
    return {
      templates: this.getDefaultPrompts(),
      version: this.VERSION
    };
  }

  // 保存Prompt配置
  static savePromptConfig(config: PromptConfig): void {
    try {
      config.version = this.VERSION;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save prompt config:', error);
    }
  }

  // 迁移旧版本配置
  private static migratePromptConfig(oldConfig: PromptConfig): PromptConfig {
    const defaultTemplates = this.getDefaultPrompts();
    const existingIds = new Set(oldConfig.templates.map(t => t.id));
    
    // 添加新的默认模板
    const newTemplates = defaultTemplates.filter(t => !existingIds.has(t.id));
    
    return {
      templates: [...oldConfig.templates, ...newTemplates],
      version: this.VERSION
    };
  }

  // 根据ID获取Prompt模板
  static getPromptById(id: string): PromptTemplate | null {
    const config = this.loadPromptConfig();
    return config.templates.find(t => t.id === id) || null;
  }

  // 根据分类获取Prompt模板
  static getPromptsByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    const config = this.loadPromptConfig();
    return config.templates.filter(t => t.category === category);
  }

  // 更新Prompt模板
  static updatePrompt(id: string, updates: Partial<PromptTemplate>): void {
    const config = this.loadPromptConfig();
    const index = config.templates.findIndex(t => t.id === id);
    
    if (index !== -1) {
      config.templates[index] = { ...config.templates[index], ...updates };
      this.savePromptConfig(config);
    }
  }

  // 添加新的Prompt模板
  static addPrompt(template: Omit<PromptTemplate, 'id'>): string {
    const config = this.loadPromptConfig();
    const id = `custom-${Date.now()}`;
    const newTemplate: PromptTemplate = { ...template, id };
    
    config.templates.push(newTemplate);
    this.savePromptConfig(config);
    
    return id;
  }

  // 删除Prompt模板
  static deletePrompt(id: string): void {
    const config = this.loadPromptConfig();
    config.templates = config.templates.filter(t => t.id !== id);
    this.savePromptConfig(config);
  }

  // 重置为默认Prompt
  static resetToDefaults(): void {
    const config: PromptConfig = {
      templates: this.getDefaultPrompts(),
      version: this.VERSION
    };
    this.savePromptConfig(config);
  }

  // 渲染Prompt模板（替换变量）
  static renderPrompt(template: string, variables: Record<string, string>): string {
    let rendered = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return rendered;
  }

  // 提取模板中的变量
  static extractVariables(template: string): string[] {
    const matches = template.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    
    return matches.map(match => match.slice(1, -1)).filter((v, i, arr) => arr.indexOf(v) === i);
  }

  // 验证模板格式
  static validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!template.trim()) {
      errors.push('模板内容不能为空');
    }
    
    // 检查变量格式
    const variables = this.extractVariables(template);
    variables.forEach(variable => {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable)) {
        errors.push(`变量名 "${variable}" 格式不正确，只能包含字母、数字和下划线，且不能以数字开头`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}