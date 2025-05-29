const messages = {
  'zh-CN': {
    startCore: '启动核心',
    stopCore: '停止核心',
    coreIsRunning: '核心正在运行',
    coreIsNotRunning: '核心未运行',
    showMainWindow: '显示主窗口',
    quit: '退出',
  },
  'en-US': {
    startCore: 'Start Core',
    stopCore: 'Stop Core',
    coreIsRunning: 'Core is running',
    coreIsNotRunning: 'Core is not running',
    showMainWindow: 'Show Main Window',
    quit: 'Quit',
  },
  'ru-RU': {
    startCore: 'Запустить ядро',
    stopCore: 'Остановить ядро',
    coreIsRunning: 'Ядро запущено',
    coreIsNotRunning: 'Ядро не запущено',
    showMainWindow: 'Показать главное окно',
    quit: 'Выход',
  },
}

export const t = (key: string, locale: string = 'zh-CN'): string => {
  return messages[locale as keyof typeof messages]?.[key as keyof (typeof messages)['zh-CN']] || key
}
