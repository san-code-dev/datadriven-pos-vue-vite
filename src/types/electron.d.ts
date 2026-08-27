// src/electron.d.ts

// 1. Definisikan Interface Utama API
interface ElectronAPI {
  getPrinters: () => Promise<Array<{ name: string; isDefault: boolean }>>
  printRawDriver: (payload: {
    printerName: string
    rawBuffer: Uint8Array
  }) => Promise<{ success: boolean; error?: string }>
  printRawNetwork: (payload: {
    host: string
    port: number
    rawBuffer: Uint8Array
  }) => Promise<{ success: boolean; error?: string }>
  exportReceiptPdf: (payload: {
    paperWidth: number
  }) => Promise<{ success: boolean; filePath?: string; error?: string }>

  // Method Baru
  printRawSerial: (args: any) => Promise<{ success: boolean; error?: string }>
  listSerialPorts: () => Promise<any[]>
  saveFileDialog: (args: any) => Promise<any>
  renderPdf: (payload: { blueprint: any; options?: any }) => Promise<{
    success: boolean
    filePath?: string
    canceled?: boolean
    error?: string
  }>
  renderXlsx: (data: any) => Promise<{ success: boolean; error?: string }>
  showNotification: (payload: {
    title: string
    body: string
    filePath?: string
  }) => Promise<{ success: boolean; error?: string }>
}

// 2. Inject ke Objek Global Window
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export { } // PENTING: Menandakan file ini adalah modul TypeScript yang aman untuk ambient declaration
