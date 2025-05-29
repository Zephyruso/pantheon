import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export const resourcesDir = (): string => {
  return join(__dirname, '../../resources')
}

export const binaryPath = (): string => {
  const binaryName = process.platform === 'win32' ? 'pantheon-core.exe' : 'pantheon-core'

  return join(resourcesDir(), binaryName)
}

export const helperBinaryPath = (): string => {
  const binaryName = process.platform === 'win32' ? 'pantheon-helper.exe' : 'pantheon-helper'

  return join(resourcesDir(), binaryName)
}

export const dataDir = (): string => {
  return app.getPath('userData')
}

export const runtimeDir = (): string => {
  return join(dataDir(), 'runtime')
}

export const configDir = (): string => {
  return join(dataDir(), 'config')
}

const initDirIfNotExist = (dir: string): void => {
  if (!existsSync(dir)) {
    mkdirSync(dir)
  }
}

export const initDir = (): void => {
  initDirIfNotExist(runtimeDir())
  initDirIfNotExist(configDir())
}
