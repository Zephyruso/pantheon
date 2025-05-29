import { app, BrowserWindow, Menu, Tray } from 'electron'
import { join } from 'path'
import { watch } from 'vue'
import { t } from '../i18n.js'
import { resourcesDir } from '../utils/dir.js'
import { isCoreRunning, startCore, stopCore } from './core.js'

let trayInstance: Tray | null = null

app.on('before-quit', () => {
  destroyTray()
})

export const createTray = async (mainWindow: BrowserWindow): Promise<void> => {
  if (trayInstance) {
    return
  }
  const iconPath = join(resourcesDir(), 'icon.png')
  trayInstance = new Tray(iconPath)

  const updateContextMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: t('startCore'),
        click: async () => {
          await startCore()
          updateContextMenu()
        },
        enabled: !isCoreRunning.value,
      },
      {
        label: t('stopCore'),
        click: async () => {
          await stopCore()
          updateContextMenu()
        },
        enabled: isCoreRunning.value,
      },
      { type: 'separator' },
      {
        label: t('coreIsRunning'),
        enabled: false,
        visible: isCoreRunning.value,
      },
      {
        label: t('coreIsNotRunning'),
        enabled: false,
        visible: !isCoreRunning.value,
      },
      { type: 'separator' },
      {
        label: t('showMainWindow'),
        click: () => {
          mainWindow.show()
        },
      },
      {
        label: t('quit'),
        click: () => {
          mainWindow.destroy()
          app.quit()
        },
      },
    ])

    trayInstance!.setContextMenu(contextMenu)
  }

  trayInstance!.setToolTip('Pantheon')
  trayInstance!.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  })

  updateContextMenu()
  watch(isCoreRunning, () => {
    updateContextMenu()
  })
}

export const destroyTray = (): void => {
  if (trayInstance) {
    trayInstance.destroy()
    trayInstance = null
  }
}
