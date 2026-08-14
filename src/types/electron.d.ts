// src/electron.d.ts
export interface ElectronAPI {
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
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
