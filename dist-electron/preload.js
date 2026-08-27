"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  getPrinters: () => electron.ipcRenderer.invoke("get-printers"),
  printRawDriver: (args) => electron.ipcRenderer.invoke("print-raw-driver", args),
  printRawNetwork: (args) => electron.ipcRenderer.invoke("print-raw-network", args),
  printRawSerial: (args) => electron.ipcRenderer.invoke("print-raw-serial", args),
  listSerialPorts: () => electron.ipcRenderer.invoke("list-serial-ports"),
  saveFileDialog: (args) => electron.ipcRenderer.invoke("save-file-dialog", args),
  renderPdf: (data) => electron.ipcRenderer.invoke("render-pdf", data),
  renderXlsx: (data) => electron.ipcRenderer.invoke("render-xlsx", data),
  showNotification: (payload) => electron.ipcRenderer.invoke("show-notification", payload),
  maximizeWindow: () => electron.ipcRenderer.send("window:maximize")
});
