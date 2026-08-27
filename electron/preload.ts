// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // --- yang sudah ada ---
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printRawDriver: (args: any) => ipcRenderer.invoke('print-raw-driver', args),
  printRawNetwork: (args: any) => ipcRenderer.invoke('print-raw-network', args),

  // --- BARU: tambahkan ini ---
  printRawSerial: (args: any) => ipcRenderer.invoke('print-raw-serial', args),
  listSerialPorts: () => ipcRenderer.invoke('list-serial-ports'),
  saveFileDialog: (args: any) => ipcRenderer.invoke('save-file-dialog', args),

  renderPdf: (data: any) => ipcRenderer.invoke('render-pdf', data),
  renderXlsx: (data: any) => ipcRenderer.invoke('render-xlsx', data),

  showNotification: (payload: { title: string; body: string }) =>
    ipcRenderer.invoke('show-notification', payload),
})
