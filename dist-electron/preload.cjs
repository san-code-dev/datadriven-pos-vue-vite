var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var require_preload = __commonJS({
  "preload.cjs"() {
    const { contextBridge, ipcRenderer } = require("electron");
    contextBridge.exposeInMainWorld("electronAPI", {
      getPrinters: () => ipcRenderer.invoke("get-printers")
    });
  }
});
export default require_preload();
