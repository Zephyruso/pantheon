import AutoLaunch from 'auto-launch'
import { App } from 'electron'
import { join } from 'path'

let appLauncher: AutoLaunch

const getAppImagePath = (): string | null => {
  if (process.env.APPIMAGE) {
    return process.env.APPIMAGE
  }
  return null
}

export const initAutoLaunch = async (app: App): Promise<void> => {
  let appPath: string

  if (process.platform === 'linux') {
    const appImagePath = getAppImagePath()
    if (appImagePath) {
      appPath = appImagePath
    } else {
      appPath = join(app.getPath('exe'), '..', 'resources', 'app.asar')
    }
  } else {
    appPath = app.getPath('exe')
  }

  appLauncher = new AutoLaunch({
    name: 'Pantheon',
    path: appPath,
    isHidden: true,
  })
}

export const shouldAutoStartCore = async (): Promise<boolean> => {
  try {
    return await appLauncher.isEnabled()
  } catch (error) {
    console.error('Failed to check auto-launch status:', error)
    return false
  }
}

export const enableAutoLaunch = async (): Promise<void> => {
  try {
    await appLauncher.enable()
  } catch (error) {
    console.error('Failed to enable auto-launch:', error)
    throw error
  }
}

export const disableAutoLaunch = async (): Promise<void> => {
  try {
    await appLauncher.disable()
  } catch (error) {
    console.error('Failed to disable auto-launch:', error)
    throw error
  }
}
