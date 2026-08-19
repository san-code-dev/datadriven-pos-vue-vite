// electron/serialHandler.ts
// Tambahkan import ini ke main.ts, dan panggil registerSerialHandlers() setelah app.whenReady()
import { ipcMain } from 'electron'
import { SerialPort } from 'serialport' // npm install serialport

export function registerSerialHandlers() {
    ipcMain.handle('list-serial-ports', async () => {
        try {
            const ports = await SerialPort.list()
            return ports.map((p) => ({ path: p.path, manufacturer: p.manufacturer }))
        } catch (err) {
            console.error('[Serial] Gagal list port:', err)
            return []
        }
    })

    ipcMain.handle('print-raw-serial', async (_, { path, baudRate, rawBuffer }) => {
        return new Promise((resolve) => {
            try {
                const port = new SerialPort({ path, baudRate }, (err) => {
                    if (err) {
                        resolve({ success: false, error: `Gagal membuka port ${path}: ${err.message}` })
                        return
                    }

                    port.write(Buffer.from(rawBuffer), (writeErr) => {
                        if (writeErr) {
                            resolve({ success: false, error: writeErr.message })
                            port.close()
                            return
                        }
                        port.drain(() => {
                            port.close()
                            resolve({ success: true })
                        })
                    })
                })
            } catch (error: any) {
                resolve({ success: false, error: error.message })
            }
        })
    })
}
