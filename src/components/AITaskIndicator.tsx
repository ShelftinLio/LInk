import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronUp, 
  ChevronDown,
  X,
  RotateCw,
  Bell,
  BellOff
} from 'lucide-react';
import { AITaskService, AITask, AITaskNotification } from '../services/aiTaskService';

interface AITaskIndicatorProps {
  onTaskClick?: (task: AITask) => void;
}

const AITaskIndicator: React.FC<AITaskIndicatorProps> = ({ onTaskClick }) => {
  const [runningTasks, setRunningTasks] = useState<AITask[]>([]);
  const [notifications, setNotifications] = useState<AITaskNotification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  
  useEffect(() => {
    // 初始化数据
    setRunningTasks(AITaskService.getRunningTasks());
    setNotifications(AITaskService.getNotifications());
    
    // 检查通知权限
    checkNotificationPermission();
    
    // 监听任务状态变化
    const taskListener = (task: AITask) => {
      setRunningTasks(AITaskService.getRunningTasks());
    };
    
    // 监听通知变化
    const notificationListener = (notification: AITaskNotification) => {
      setNotifications(AITaskService.getNotifications());
      
      // 显示浏览器通知
      if (notificationPermission) {
        AITaskService.showBrowserNotification(notification);
      }
    };
    
    AITaskService.addTaskListener(taskListener);
    AITaskService.addNotificationListener(notificationListener);
    
    return () => {
      AITaskService.removeTaskListener(taskListener);
      AITaskService.removeNotificationListener(notificationListener);
    };
  }, [notificationPermission]);
  
  const checkNotificationPermission = async () => {
    const hasPermission = await AITaskService.requestNotificationPermission();
    setNotificationPermission(hasPermission);
  };
  
  const unreadNotifications = notifications.filter(n => !n.read);
  const hasRunningTasks = runningTasks.length > 0;
  const hasUnreadNotifications = unreadNotifications.length > 0;
  
  // 如果没有运行中的任务且没有未读通知，不显示指示器
  if (!hasRunningTasks && !hasUnreadNotifications && !isExpanded) {
    return null;
  }
  
  const handleTaskClick = (task: AITask) => {
    onTaskClick?.(task);
    setIsExpanded(false);
  };
  
  const handleNotificationClick = (notification: AITaskNotification) => {
    AITaskService.markNotificationAsRead(notification.id);
    const task = AITaskService.getTask(notification.taskId);
    if (task) {
      handleTaskClick(task);
    }
  };
  
  const getTaskIcon = (task: AITask) => {
    switch (task.status) {
      case 'pending':
      case 'running':
        return <RotateCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const getTaskStatusText = (task: AITask) => {
    switch (task.status) {
      case 'pending':
        return '等待中';
      case 'running':
        return '运行中';
      case 'completed':
        return '已完成';
      case 'error':
        return '失败';
      default:
        return '未知';
    }
  };
  
  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* 展开的面板 */}
      {isExpanded && (
        <div className="mb-2 bg-white rounded-lg shadow-lg border border-gray-200 w-80 max-h-96 overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-gray-900">AI 任务中心</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                  hasUnreadNotifications ? 'text-red-500' : 'text-gray-500'
                }`}
                title={showNotifications ? '隐藏通知' : '显示通知'}
              >
                {hasUnreadNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                {hasUnreadNotifications && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* 内容区域 */}
          <div className="max-h-80 overflow-y-auto">
            {showNotifications ? (
              // 通知列表
              <div className="p-2">
                {notifications.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">暂无通知</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          notification.read
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-2">
                          {notification.type === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.createdAt.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // 任务列表
              <div className="p-2">
                {/* 运行中的任务 */}
                {runningTasks.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">运行中</h4>
                    <div className="space-y-2">
                      {runningTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className="flex items-center gap-2">
                            {getTaskIcon(task)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {task.action} - {task.type === 'selection' ? '划词' : '全文'}
                              </p>
                              <p className="text-xs text-gray-600">
                                {getTaskStatusText(task)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 最近完成的任务 */}
                {(() => {
                  const completedTasks = AITaskService.getCompletedTasks().slice(0, 5);
                  return completedTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">最近完成</h4>
                      <div className="space-y-2">
                        {completedTasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="flex items-center gap-2">
                              {getTaskIcon(task)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {task.action} - {task.type === 'selection' ? '划词' : '全文'}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {task.completedAt?.toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                
                {runningTasks.length === 0 && AITaskService.getCompletedTasks().length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">暂无AI任务</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 浮动按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative w-12 h-12 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
          hasRunningTasks
            ? 'bg-blue-500 hover:bg-blue-600'
            : hasUnreadNotifications
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-gray-500 hover:bg-gray-600'
        }`}
      >
        {hasRunningTasks ? (
          <RotateCw className="w-6 h-6 text-white animate-spin" />
        ) : (
          <Sparkles className="w-6 h-6 text-white" />
        )}
        
        {/* 未读通知徽章 */}
        {hasUnreadNotifications && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
          </span>
        )}
        
        {/* 展开指示器 */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-white" />
          ) : (
            <ChevronUp className="w-4 h-4 text-white" />
          )}
        </div>
      </button>
    </div>
  );
};

export default AITaskIndicator;