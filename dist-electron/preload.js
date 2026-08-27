import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  // --- yang sudah ada ---
  getPrinters: () => ipcRenderer.invoke("get-printers"),
  printRawDriver: (args) => ipcRenderer.invoke("print-raw-driver", args),
  printRawNetwork: (args) => ipcRenderer.invoke("print-raw-network", args),
  // --- BARU: tambahkan ini ---
  printRawSerial: (args) => ipcRenderer.invoke("print-raw-serial", args),
  listSerialPorts: () => ipcRenderer.invoke("list-serial-ports"),
  saveFileDialog: (args) => ipcRenderer.invoke("save-file-dialog", args),
  renderPdf: (data) => ipcRenderer.invoke("render-pdf", data),
  renderXlsx: (data) => ipcRenderer.invoke("render-xlsx", data),
  showNotification: (payload) => ipcRenderer.invoke("show-notification", payload)
});
tification: (payload) => electron.ipcRenderer.invoke("show-notification", payload)
});
