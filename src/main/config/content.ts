import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { configDir, runtimeDir } from '../utils/dir.js'

// 检查路径是否存在
export const isPathExist = (path: string): boolean => {
  return existsSync(path)
}

// 读取配置文件列表
export const readConfigList = (): string[] => {
  return readdirSync(configDir())
}

// 读取运行时配置文件内容
export const readRuntimeConfigFile = (): string => {
  return readFileSync(join(runtimeDir(), 'config.json'), 'utf-8')
}

// 读取指定配置文件内容
export const readConfigFile = (name: string): string => {
  const path = join(configDir(), name)

  if (!isPathExist(path)) {
    return ''
  }

  return readFileSync(join(configDir(), name), 'utf-8')
}

// 写入配置文件内容
export const writeConfigFile = (name: string, content: string): void => {
  return writeFileSync(join(configDir(), name), content)
}

// 删除配置文件
export const deleteConfigFile = (name: string): void => {
  return unlinkSync(join(configDir(), name))
}
