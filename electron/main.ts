// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import net from 'node:net'
import fs from 'node:fs'
import os from 'node:os'
import { exec } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// 1. Ambil daftar printer OS bawaan Electron
ipcMain.handle('get-printers', async () => {
  if (!win) return []
  return await win.webContents.getPrintersAsync()
})

// 2. Cetak Raw ESC/POS ke Printer OS Driver (Windows Raw Spooler)
ipcMain.handle('print-raw-driver', async (_, { printerName, rawBuffer }) => {
  return new Promise((resolve) => {
    try {
      const tempFilePath = path.join(os.tmpdir(), `receipt_${Date.now()}.bin`)
      fs.writeFileSync(tempFilePath, Buffer.from(rawBuffer))

      // Perintah PowerShell untuk mengirim raw bytes langsung ke printer spooler
      const psCommand = `Get-Content -Path "${tempFilePath}" -Encoding Byte -Raw | Out-Printer -Name "${printerName}"`

      exec(`powershell -Command "${psCommand}"`, (err) => {
        // Hapus file temporary
        try {
          fs.unlinkSync(tempFilePath)
        } catch {}

        if (err) {
          resolve({ success: false, error: err.message })
        } else {
          resolve({ success: true })
        }
      })
    } catch (error: any) {
      resolve({ success: false, error: error.message })
    }
  })
})

// 3. Cetak Raw ESC/POS ke Network / LAN Printer (IP:Port)
ipcMain.handle(
  'print-raw-network',
  async (_, { host, port = 9100, rawBuffer }) => {
    return new Promise((resolve) => {
      const client = new net.Socket()
      const buffer = Buffer.from(rawBuffer)

      client.connect(port, host, () => {
        client.write(buffer, () => {
          client.end()
          resolve({ success: true })
        })
      })

      client.on('error', (err) => {
        client.destroy()
        resolve({ success: false, error: err.message })
      })

      client.setTimeout(5000, () => {
        client.destroy()
        resolve({
          success: false,
          error: 'Koneksi ke printer timeout (IP tidak merespons)',
        })
      })
    })
  },
)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.whenReady().then(createWindow)
