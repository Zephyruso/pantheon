import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      send: (channel: string, data: unknown) => void
      invoke: <T>(channel: string, ...args: unknown[]) => Promise<T>
      on: (channel: string, func: (...args: unknown[]) => void) => void
    }
  }
}

type LocalConfig = {
  isActive: boolean
  name: string
  type: 'local'
}

type RemoteConfig = {
  isActive: boolean
  name: string
  type: 'remote'
  url: string
}

type Config = LocalConfig | RemoteConfig
