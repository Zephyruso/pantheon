import { BrowserWindow } from 'electron'
import { IS_CORE_RUNNING } from '../../shared/event.js'

export const sendToMainWindow = (channel: string, ...args: unknown[]): void => {
  const mainWindow = BrowserWindow.getAllWindows()[0]
  if (mainWindow) {
    mainWindow.webContents.send(channel, ...args)
  }
}

export const sendCoreRunningStatus = (isRunning: boolean): void => {
  sendToMainWindow(IS_CORE_RUNNING, isRunning)
}
