export interface IElectronAPI {
  getPrinters: () => Promise<Electron.PrinterInfo[]>
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI
  }
}
