import { ipcMain, app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import { exec } from "node:child_process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
ipcMain.handle("get-printers", async () => {
  if (!win) return [];
  return await win.webContents.getPrintersAsync();
});
ipcMain.handle("print-raw-driver", async (_, { printerName, rawBuffer }) => {
  return new Promise((resolve) => {
    try {
      const tempFilePath = path.join(os.tmpdir(), `receipt_${Date.now()}.bin`);
      fs.writeFileSync(tempFilePath, Buffer.from(rawBuffer));
      const psCommand = `Get-Content -Path "${tempFilePath}" -Encoding Byte -Raw | Out-Printer -Name "${printerName}"`;
      exec(`powershell -Command "${psCommand}"`, (err) => {
        try {
          fs.unlinkSync(tempFilePath);
        } catch {
        }
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true });
        }
      });
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
});
ipcMain.handle(
  "print-raw-network",
  async (_, { host, port = 9100, rawBuffer }) => {
    return new Promise((resolve) => {
      const client = new net.Socket();
      const buffer = Buffer.from(rawBuffer);
      client.connect(port, host, () => {
        client.write(buffer, () => {
          client.end();
          resolve({ success: true });
        });
      });
      client.on("error", (err) => {
        client.destroy();
        resolve({ success: false, error: err.message });
      });
      client.setTimeout(5e3, () => {
        client.destroy();
        resolve({
          success: false,
          error: "Koneksi ke printer timeout (IP tidak merespons)"
        });
      });
    });
  }
);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
