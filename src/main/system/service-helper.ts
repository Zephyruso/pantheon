import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import sudo from 'sudo-prompt'
import { binaryPath, helperBinaryPath, runtimeDir } from '../utils/dir.js'

const SERVICE_NAME = 'pantheon'
const LINUX_SERVICE_FILE = `/etc/systemd/system/${SERVICE_NAME}.service`

const getAppDir = () => {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'Pantheon')
  }
  return path.join('/usr', 'local', 'bin')
}

const sudoExec = (cmd: string, options?: { name: string }): Promise<string> => {
  return new Promise((resolve, reject) => {
    sudo.exec(cmd, options, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr)
        reject(error)
        return
      }
      resolve(String(stdout))
    })
  })
}

export const isServiceInstalled = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`sc query "${SERVICE_NAME}"`, (error, stdout) => {
        resolve(!error && stdout.includes('STATE'))
      })
    } else {
      fs.access(LINUX_SERVICE_FILE, fs.constants.F_OK, (err) => {
        resolve(!err)
      })
    }
  })
}

export const installService = async (): Promise<string> => {
  try {
    const coreSourcePath = binaryPath()
    const helperSourcePath = helperBinaryPath()
    const appDir = getAppDir()
    const coreDestPath = path.join(appDir, 'pantheon-core')
    const helperDestPath = path.join(appDir, 'pantheon-helper')

    if (!fs.existsSync(coreSourcePath)) {
      throw new Error(`pantheon-core binary not found in resources at ${coreSourcePath}`)
    }

    if (!fs.existsSync(helperSourcePath)) {
      throw new Error(`pantheon-helper binary not found at ${helperSourcePath}`)
    }

    if (process.platform === 'win32') {
      const installCmd = `copy "${coreSourcePath}" "${coreDestPath}" && copy "${helperSourcePath}" "${helperDestPath}" && sc create "${SERVICE_NAME}" binPath= "${helperDestPath}" start= auto && sc start "${SERVICE_NAME}"`
      return await sudoExec(installCmd, { name: 'Pantheon Installer' })
    } else {
      const serviceContent = `
[Unit]
Description=pantheon Service
After=network.target nss-lookup.target network-online.target

[Service]
User=root
ExecStart=${helperDestPath}
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=10s
LimitNOFILE=infinity
Environment=PANTEHON_CORE_PATH=${coreDestPath}
Environment=PANTEHON_CONFIG_DIR=${runtimeDir()}

[Install]
WantedBy=multi-user.target

`
      const tmpServicePath = '/tmp/pantheon.service'
      fs.writeFileSync(tmpServicePath, serviceContent)
      const installCmd = `mkdir -p ${appDir} && \
        cp ${coreSourcePath} ${coreDestPath} && \
        cp ${helperSourcePath} ${helperDestPath} && \
        chmod 755 ${coreDestPath} ${helperDestPath} && \
        cp ${tmpServicePath} ${LINUX_SERVICE_FILE} && \
        systemctl daemon-reload && \
        systemctl enable ${SERVICE_NAME} --now`
      return await sudoExec(installCmd, { name: 'Pantheon Installer' })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to install service: ${errorMessage}`)
  }
}

export const uninstallSerivce = (): Promise<string> => {
  if (process.platform === 'win32') {
    const uninstallCmd = `sc stop "${SERVICE_NAME}" && sc delete "${SERVICE_NAME}"`
    return sudoExec(uninstallCmd, { name: 'Pantheon Uninstaller' })
  } else {
    const uninstallCmd = `systemctl stop ${SERVICE_NAME} && systemctl disable ${SERVICE_NAME} && rm ${LINUX_SERVICE_FILE} && systemctl daemon-reload`
    return sudoExec(uninstallCmd, { name: 'Pantheon Uninstaller' })
  }
}

export const isServiceRunning = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`sc query "${SERVICE_NAME}"`, (error, stdout) => {
        if (error || !stdout.includes('STATE')) return resolve(false)
        const running = stdout.match(/STATE\s+:\s+\d+\s+RUNNING/)
        resolve(!!running)
      })
    } else {
      exec(`systemctl is-active ${SERVICE_NAME}`, (_, stdout) => {
        resolve(stdout.trim() === 'active')
      })
    }
  })
}
