const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  // Ambil list printer terpasang di OS
  getPrinters: () => ipcRenderer.invoke("get-printers"),
  // Cetak Raw ESC/POS lewat Driver OS
  printRawDriver: (payload) => ipcRenderer.invoke("print-raw-driver", payload),
  // Cetak Raw ESC/POS lewat LAN/Network IP
  printRawNetwork: (payload) => ipcRenderer.invoke("print-raw-network", payload)
});
