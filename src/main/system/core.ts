import { get } from 'http'
import { createConnection } from 'net'
import { platform } from 'os'
import { ref, watch } from 'vue'
import { prepareActiveConfig } from '../config/store.js'
import { sendCoreRunningStatus } from '../utils/window-msg.js'

const SOCKET_PATH =
  platform() === 'win32' ? '\\\\.\\pipe\\pantheon-helper' : '/tmp/pantheon-helper.sock'

interface CommandResponse {
  status?: string
  running?: boolean
}

export const isCoreRunning = ref(false)

watch(
  isCoreRunning,
  (val) => {
    sendCoreRunningStatus(val)
  },
  { immediate: true },
)

const sendCommand = async (action: string): Promise<CommandResponse> => {
  return new Promise((resolve, reject) => {
    const client = createConnection(SOCKET_PATH, () => {
      client.write(JSON.stringify({ action }))
    })

    let responseData = ''

    client.on('data', (data) => {
      responseData += data.toString()
      try {
        const response = JSON.parse(responseData) as CommandResponse
        client.end()
        resolve(response)
      } catch {}
    })

    client.on('error', (error) => {
      reject(error)
    })

    client.on('end', () => {
      if (responseData) {
        try {
          const response = JSON.parse(responseData) as CommandResponse
          resolve(response)
        } catch {
          reject(new Error('Invalid response format'))
        }
      }
    })
  })
}

const checkVersionEndpoint = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const req = get('http://127.0.0.1:9999/version', () => {
      resolve(true)
    })

    req.on('error', () => {
      resolve(false)
    })

    req.setTimeout(200, () => {
      req.destroy()
      resolve(false)
    })
  })
}

const waitForVersionEndpoint = async (): Promise<void> => {
  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      const isReady = await checkVersionEndpoint()
      if (isReady) {
        clearInterval(checkInterval)
        resolve()
      }
    }, 200)
  })
}

export const startCore = async (): Promise<void> => {
  prepareActiveConfig()
  await sendCommand('start')
  await waitForVersionEndpoint()
  await fetchCoreRunning()
}

export const stopCore = async (): Promise<void> => {
  await sendCommand('stop')
  await fetchCoreRunning()
}

export const fetchCoreRunning = async (): Promise<boolean> => {
  try {
    const response = await sendCommand('status')
    isCoreRunning.value = response.running ?? false
  } catch (error) {
    console.error('Failed to check core status:', error)
    isCoreRunning.value = false
  }
  return isCoreRunning.value
}

export const restartCore = async (): Promise<void> => {
  await stopCore()
  await startCore()
}
