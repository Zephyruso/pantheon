import Store from 'electron-store'
import { writeFileSync } from 'fs'
import { set } from 'lodash-es'
import { join } from 'path'
import { v4 as uuid } from 'uuid'
import { Config } from '../../shared/type.js'
import { runtimeDir } from '../utils/dir.js'
import {
  deleteConfigFile,
  readConfigFile,
  readRuntimeConfigFile,
  writeConfigFile,
} from './content.js'

interface StoreConfig {
  configs: Config[]
}

interface StoreType extends Store<StoreConfig> {
  set: (key: keyof StoreConfig, value: StoreConfig[keyof StoreConfig]) => void
  get: (key: keyof StoreConfig) => StoreConfig[keyof StoreConfig]
}

export const store = new Store<StoreConfig>({
  defaults: {
    configs: [],
  },
}) as StoreType

// 获取所有配置文件列表
export const getConfigList = (): Config[] => {
  const configs = store.get('configs')

  if (!configs) {
    return []
  }

  return configs.filter((c) => readConfigFile(c.name))
}

// 保存配置文件
export const saveConfig = async (config: Config, content?: string): Promise<void> => {
  const cfgs = getConfigList()

  if (!cfgs.find((c) => c.name === config.name)) {
    store.set('configs', [...getConfigList(), config])
  } else {
    store.set(
      'configs',
      getConfigList().map((c) => (c.name === config.name ? config : c)),
    )
  }

  if (config.type === 'local') {
    writeConfigFile(config.name, content!)
  } else {
    const data = await fetch(config.url)
    const result = await data.text()

    writeConfigFile(config.name, result)
  }
}

// 更新远程配置文件
export const updateRemoteConfig = async (name: string): Promise<void> => {
  const config = getConfigList().find((c) => c.name === name)
  if (!config || config.type !== 'remote') {
    return
  }
  const data = await fetch(config.url)
  const result = await data.text()

  writeConfigFile(config.name, result)
}

// 删除配置文件
export const deleteConfig = (name: string): void => {
  store.set(
    'configs',
    getConfigList().filter((config) => config.name !== name),
  )

  deleteConfigFile(name)
}

// 获取当前激活的配置文件名
export const getActiveConfigName = (): string => {
  const cfgs = getConfigList()

  return cfgs.find((c) => c.isActive)?.name || ''
}

// 设置激活的配置文件
export const setActiveConfig = (name: string): void => {
  store.set(
    'configs',
    getConfigList().map((config) => ({ ...config, isActive: config.name === name })),
  )
}

// 准备激活的配置文件
export const prepareActiveConfig = (): void => {
  if (!getActiveConfigName()) {
    setActiveConfig(getConfigList()[0].name)
  }

  const config = getActiveConfigName()
  const configContent = JSON.parse(readConfigFile(config))

  set(configContent, 'experimental.clash_api', {
    access_control_allow_private_network: true,
    external_controller: '127.0.0.1:9999',
    external_ui: './zashboard',
    external_ui_download_url:
      'https://github.com/Zephyruso/zashboard/archive/refs/heads/gh-pages.zip',
    secret: uuid(),
  })

  writeFileSync(join(runtimeDir(), 'config.json'), JSON.stringify(configContent))
}

// 获取Clash API配置
export const getClashAPIConfig = (): {
  access_control_allow_private_network: boolean
  external_controller: string
  external_ui: string
  external_ui_download_url: string
  secret: string
} => {
  const configContent = readRuntimeConfigFile()

  return JSON.parse(configContent).experimental.clash_api
}
