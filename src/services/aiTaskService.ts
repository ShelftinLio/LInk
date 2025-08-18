// AI任务管理服务 - 处理后台AI任务的状态管理和通知

export interface AITask {
  id: string;
  type: 'selection' | 'fulltext';
  action: string;
  input: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  documentId?: string;
  documentTitle?: string;
}

export interface AITaskNotification {
  id: string;
  taskId: string;
  type: 'success' | 'error';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

type TaskStatusListener = (task: AITask) => void;
type NotificationListener = (notification: AITaskNotification) => void;

export class AITaskService {
  private static tasks: Map<string, AITask> = new Map();
  private static notifications: AITaskNotification[] = [];
  private static taskListeners: Set<TaskStatusListener> = new Set();
  private static notificationListeners: Set<NotificationListener> = new Set();
  private static nextTaskId = 1;
  
  // 创建新任务
  static createTask(
    type: 'selection' | 'fulltext',
    action: string,
    input: string,
    documentId?: string,
    documentTitle?: string
  ): string {
    const taskId = `task_${this.nextTaskId++}_${Date.now()}`;
    
    const task: AITask = {
      id: taskId,
      type,
      action,
      input,
      status: 'pending',
      createdAt: new Date(),
      documentId,
      documentTitle
    };
    
    this.tasks.set(taskId, task);
    this.notifyTaskListeners(task);
    
    return taskId;
  }
  
  // 更新任务状态
  static updateTaskStatus(taskId: string, status: AITask['status'], result?: string, error?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    task.status = status;
    if (result) task.result = result;
    if (error) task.error = error;
    
    if (status === 'completed' || status === 'error') {
      task.completedAt = new Date();
      
      // 创建通知
      this.createNotification(task);
    }
    
    this.notifyTaskListeners(task);
  }
  
  // 获取任务
  static getTask(taskId: string): AITask | undefined {
    return this.tasks.get(taskId);
  }
  
  // 获取所有任务
  static getAllTasks(): AITask[] {
    return Array.from(this.tasks.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
  
  // 获取运行中的任务
  static getRunningTasks(): AITask[] {
    return this.getAllTasks().filter(task => 
      task.status === 'pending' || task.status === 'running'
    );
  }
  
  // 获取已完成的任务
  static getCompletedTasks(): AITask[] {
    return this.getAllTasks().filter(task => 
      task.status === 'completed' || task.status === 'error'
    );
  }
  
  // 删除任务
  static deleteTask(taskId: string): void {
    this.tasks.delete(taskId);
    // 同时删除相关通知
    this.notifications = this.notifications.filter(n => n.taskId !== taskId);
    this.notifyNotificationListeners();
  }
  
  // 清理旧任务（保留最近50个）
  static cleanupOldTasks(): void {
    const allTasks = this.getAllTasks();
    if (allTasks.length > 50) {
      const tasksToDelete = allTasks.slice(50);
      tasksToDelete.forEach(task => {
        this.tasks.delete(task.id);
      });
    }
  }
  
  // 创建通知
  private static createNotification(task: AITask): void {
    const notificationId = `notification_${Date.now()}`;
    
    const notification: AITaskNotification = {
      id: notificationId,
      taskId: task.id,
      type: task.status === 'completed' ? 'success' : 'error',
      title: task.status === 'completed' ? 'AI 任务完成' : 'AI 任务失败',
      message: task.status === 'completed' 
        ? `${this.getActionDisplayName(task.action)}已完成`
        : `${this.getActionDisplayName(task.action)}失败: ${task.error || '未知错误'}`,
      createdAt: new Date(),
      read: false
    };
    
    this.notifications.unshift(notification);
    
    // 限制通知数量
    if (this.notifications.length > 20) {
      this.notifications = this.notifications.slice(0, 20);
    }
    
    this.notifyNotificationListeners(notification);
  }
  
  // 获取操作显示名称
  private static getActionDisplayName(action: string): string {
    const actionMap: Record<string, string> = {
      'continue': '智能续写',
      'rewrite': '内容改写',
      'summarize': '智能总结',
      'translate': '多语言翻译',
      'outline': '大纲生成',
      'full-summary': '全文总结',
      'full-abstract': '全文摘要',
      'full-translate': '全文翻译',
      'outline-generate': '大纲生成',
      'mindmap-generate': '思维导图'
    };
    
    return actionMap[action] || action;
  }
  
  // 通知管理
  static getNotifications(): AITaskNotification[] {
    return [...this.notifications];
  }
  
  static getUnreadNotifications(): AITaskNotification[] {
    return this.notifications.filter(n => !n.read);
  }
  
  static markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyNotificationListeners();
    }
  }
  
  static markAllNotificationsAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notifyNotificationListeners();
  }
  
  static deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifyNotificationListeners();
  }
  
  // 监听器管理
  static addTaskListener(listener: TaskStatusListener): void {
    this.taskListeners.add(listener);
  }
  
  static removeTaskListener(listener: TaskStatusListener): void {
    this.taskListeners.delete(listener);
  }
  
  static addNotificationListener(listener: NotificationListener): void {
    this.notificationListeners.add(listener);
  }
  
  static removeNotificationListener(listener: NotificationListener): void {
    this.notificationListeners.delete(listener);
  }
  
  // 通知监听器
  private static notifyTaskListeners(task: AITask): void {
    this.taskListeners.forEach(listener => {
      try {
        listener(task);
      } catch (error) {
        console.error('Task listener error:', error);
      }
    });
  }
  
  private static notifyNotificationListeners(notification?: AITaskNotification): void {
    this.notificationListeners.forEach(listener => {
      try {
        if (notification) {
          listener(notification);
        }
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  }
  
  // 浏览器通知
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  static showBrowserNotification(notification: AITaskNotification): void {
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: notification.taskId
      });
      
      // 3秒后自动关闭
      setTimeout(() => {
        browserNotification.close();
      }, 3000);
      
      // 点击通知时的处理
      browserNotification.onclick = () => {
        window.focus();
        // 这里可以添加跳转到任务详情的逻辑
        browserNotification.close();
      };
    }
  }
}