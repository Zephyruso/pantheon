import { ipcMain } from 'electron'
import {
  DELETE_CONFIG,
  DELETE_CONFIG_CONTENT,
  DISABLE_AUTO_LAUNCH,
  ENABLE_AUTO_LAUNCH,
  GET_ACTIVE_CONFIG,
  GET_CLASH_API_ENDPOINT,
  GET_CONFIG_CONTENT,
  GET_CONFIGS,
  GET_RUNTIME_CONFIG_CONTENT,
  INSTALL_SERVICE_MODE,
  IS_AUTO_LAUNCH_ENABLED,
  IS_SERVICE_MODE_INSTALLED,
  REMOVE_SERVICE_MODE,
  RESTART_CORE,
  SET_ACTIVE_CONFIG,
  SET_CONFIG,
  SET_CONFIG_CONTENT,
  START_CORE,
  STOP_CORE,
  UPDATE_CONFIG,
} from '../../shared/event.js'
import {
  deleteConfigFile,
  readConfigFile,
  readRuntimeConfigFile,
  writeConfigFile,
} from '../config/content.js'
import {
  deleteConfig,
  getActiveConfigName,
  getClashAPIConfig,
  getConfigList,
  saveConfig,
  setActiveConfig,
  updateRemoteConfig,
} from '../config/store.js'
import { disableAutoLaunch, enableAutoLaunch, shouldAutoStartCore } from '../system/auto-launch.js'
import { restartCore, startCore, stopCore } from '../system/core.js'
import { installService, isServiceInstalled, uninstallSerivce } from '../system/service-helper.js'

export function registerIPCListener(): void {
  // core
  ipcMain.handle(START_CORE, () => {
    return startCore()
  })
  ipcMain.handle(STOP_CORE, () => {
    return stopCore()
  })
  ipcMain.handle(RESTART_CORE, () => {
    return restartCore()
  })

  // auto-launch
  ipcMain.handle(IS_AUTO_LAUNCH_ENABLED, () => {
    return shouldAutoStartCore()
  })
  ipcMain.handle(ENABLE_AUTO_LAUNCH, () => {
    return enableAutoLaunch()
  })
  ipcMain.handle(DISABLE_AUTO_LAUNCH, () => {
    return disableAutoLaunch()
  })

  // service-mode
  ipcMain.handle(IS_SERVICE_MODE_INSTALLED, () => {
    return isServiceInstalled()
  })
  ipcMain.handle(INSTALL_SERVICE_MODE, () => {
    return installService()
  })
  ipcMain.handle(REMOVE_SERVICE_MODE, () => {
    return uninstallSerivce()
  })

  ipcMain.handle(GET_CLASH_API_ENDPOINT, () => {
    return getClashAPIConfig()
  })

  ipcMain.handle(GET_CONFIGS, () => {
    return getConfigList()
  })
  ipcMain.handle(SET_CONFIG, (_, { config, content }) => {
    return saveConfig(config, content)
  })
  ipcMain.handle(DELETE_CONFIG, (_, name) => {
    return deleteConfig(name)
  })
  ipcMain.handle(UPDATE_CONFIG, (_, name) => {
    return updateRemoteConfig(name)
  })

  ipcMain.handle(GET_ACTIVE_CONFIG, () => {
    return getActiveConfigName()
  })
  ipcMain.handle(SET_ACTIVE_CONFIG, (_, name) => {
    return setActiveConfig(name)
  })
  ipcMain.handle(GET_RUNTIME_CONFIG_CONTENT, () => {
    return readRuntimeConfigFile()
  })
  ipcMain.handle(GET_CONFIG_CONTENT, (_, name) => {
    return readConfigFile(name)
  })
  ipcMain.handle(SET_CONFIG_CONTENT, (_, { name, config }) => {
    writeConfigFile(name, config)
  })
  ipcMain.handle(DELETE_CONFIG_CONTENT, (_, name) => {
    deleteConfigFile(name)
  })
}
