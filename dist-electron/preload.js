"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // --- yang sudah ada ---
  getPrinters: () => electron.ipcRenderer.invoke("get-printers"),
  printRawDriver: (args) => electron.ipcRenderer.invoke("print-raw-driver", args),
  printRawNetwork: (args) => electron.ipcRenderer.invoke("print-raw-network", args),
  // --- BARU: tambahkan ini ---
  printRawSerial: (args) => electron.ipcRenderer.invoke("print-raw-serial", args),
  listSerialPorts: () => electron.ipcRenderer.invoke("list-serial-ports"),
  saveFileDialog: (args) => electron.ipcRenderer.invoke("save-file-dialog", args),
  renderPdf: (data) => electron.ipcRenderer.invoke("render-pdf", data),
  renderXlsx: (data) => electron.ipcRenderer.invoke("render-xlsx", data)
});
