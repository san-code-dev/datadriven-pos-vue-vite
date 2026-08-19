// electron/saveFileHandler.ts
// Tambahkan import ini ke main.ts, panggil registerSaveFileHandler(win) setelah createWindow()
import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'node:fs/promises'

export function registerSaveFileHandler(getWin: () => BrowserWindow | null) {
    ipcMain.handle('save-file-dialog', async (_, { fileName, fileBuffer, mimeType }) => {
        const win = getWin()
        if (!win) return { success: false, error: 'Window tidak tersedia.' }

        const filters =
            mimeType === 'application/pdf'
                ? [{ name: 'PDF', extensions: ['pdf'] }]
                : mimeType.includes('sheet')
                ? [{ name: 'Excel', extensions: ['xlsx'] }]
                : [{ name: 'All Files', extensions: ['*'] }]

        const { canceled, filePath } = await dialog.showSaveDialog(win, {
            defaultPath: fileName,
            filters,
        })

        if (canceled || !filePath) {
            return { success: false, error: 'Dibatalkan oleh user.' }
        }

        try {
            await fs.writeFile(filePath, Buffer.from(fileBuffer))
            return { success: true, path: filePath }
        } catch (err: any) {
            return { success: false, error: err.message }
        }
    })
}
