import { registerDocumentHandlers } from './documentService'

app.whenReady().then(() => {
  createWindow()
  registerSerialHandlers()
  registerSaveFileHandler(() => win)
  registerDocumentHandlers() // ← tambahan baru
})
