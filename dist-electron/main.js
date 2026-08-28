import { ipcMain, dialog, app, Notification, BrowserWindow, shell } from "electron";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";
import { spawn } from "node:child_process";
import { SerialPort } from "serialport";
import fs$1 from "node:fs/promises";
function registerSerialHandlers() {
  ipcMain.handle("list-serial-ports", async () => {
    try {
      const ports = await SerialPort.list();
      return ports.map((p) => ({ path: p.path, manufacturer: p.manufacturer }));
    } catch (err) {
      console.error("[Serial] Gagal list port:", err);
      return [];
    }
  });
  ipcMain.handle("print-raw-serial", async (_, { path: path2, baudRate, rawBuffer }) => {
    return new Promise((resolve) => {
      try {
        const port = new SerialPort({ path: path2, baudRate }, (err) => {
          if (err) {
            resolve({ success: false, error: `Gagal membuka port ${path2}: ${err.message}` });
            return;
          }
          port.write(Buffer.from(rawBuffer), (writeErr) => {
            if (writeErr) {
              resolve({ success: false, error: writeErr.message });
              port.close();
              return;
            }
            port.drain(() => {
              port.close();
              resolve({ success: true });
            });
          });
        });
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  });
}
function registerSaveFileHandler(getWin) {
  ipcMain.handle("save-file-dialog", async (_, { fileName, fileBuffer, mimeType }) => {
    const win2 = getWin();
    if (!win2) return { success: false, error: "Window tidak tersedia." };
    const filters = mimeType === "application/pdf" ? [{ name: "PDF", extensions: ["pdf"] }] : mimeType.includes("sheet") ? [{ name: "Excel", extensions: ["xlsx"] }] : [{ name: "All Files", extensions: ["*"] }];
    const { canceled, filePath } = await dialog.showSaveDialog(win2, {
      defaultPath: fileName,
      filters
    });
    if (canceled || !filePath) {
      return { success: false, error: "Dibatalkan oleh user." };
    }
    try {
      await fs$1.writeFile(filePath, Buffer.from(fileBuffer));
      return { success: true, path: filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}
app.commandLine.appendSwitch("enable-web-bluetooth", "true");
app.commandLine.appendSwitch(
  "enable-experimental-web-platform-features",
  "true"
);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
let win = null;
let splash = null;
function createSplashWindow() {
  splash = new BrowserWindow({
    width: 420,
    height: 320,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    transparent: false,
    backgroundColor: "#0f172a",
    center: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  splash.loadFile("./splash.html").catch(() => {
    splash == null ? void 0 : splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
      <!DOCTYPE html>
      <html>
      <body style="background:#0f172a;color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;user-select:none;">
        <div style="width:50px;height:50px;background:#10b981;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:24px;margin-bottom:12px;">R</div>
        <h3 style="margin:0;letter-spacing:1px;">REVO-CORE</h3>
        <p style="font-size:12px;color:#64748b;margin-top:6px;">Memuat aplikasi...</p>
      </body>
      </html>
    `)}`);
  });
  splash.once("ready-to-show", () => {
    splash == null ? void 0 : splash.show();
  });
}
function createWindow() {
  win = new BrowserWindow({
    width: 1080,
    height: 720,
    show: false,
    // Disembunyikan dulu sampai sinyal 'app-ready' dari Vue diterima
    frame: true,
    // Menampilkan titlebar bawaan OS beserta tombol Close, Minimize, dan Maximize
    backgroundColor: "#1e293b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      experimentalFeatures: false
    }
  });
  win.webContents.on(
    "select-bluetooth-device",
    (event, deviceList, callback) => {
      event.preventDefault();
      if (deviceList && deviceList.length > 0) {
        callback(deviceList[0].deviceId);
      } else {
        callback("");
      }
    }
  );
  win.webContents.session.setBluetoothPairingHandler((details, callback) => {
    if (details.pairingKind === "confirmPin") {
      callback({ response: "confirm" });
    } else if (details.pairingKind === "providePin") {
      callback({ response: "success", pin: "0000" });
    } else {
      callback({ response: "cancel" });
    }
  });
  if (VITE_DEV_SERVER_URL) {
    console.log("[Electron] Memuat Dev Server:", VITE_DEV_SERVER_URL);
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    const indexPath = path.join(RENDERER_DIST, "index.html");
    console.log("[Electron] Memuat File Lokal:", indexPath);
    win.loadFile(indexPath);
  }
  win.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("[Electron] Gagal load URL:", errorCode, errorDescription);
  });
}
ipcMain.on("app-ready", () => {
  if (splash && !splash.isDestroyed()) {
    splash.close();
    splash = null;
  }
  if (win && !win.isVisible()) {
    win.maximize();
    win.show();
    win.focus();
  }
});
ipcMain.on("window:maximize", () => {
  if (win) {
    win.maximize();
  }
});
ipcMain.handle(
  "show-notification",
  async (_, payload) => {
    if (!Notification.isSupported()) {
      return { success: false, error: "Notifikasi tidak didukung" };
    }
    const notification = new Notification({
      title: payload.title,
      body: payload.body
    });
    notification.on("click", async () => {
      const targetWin = BrowserWindow.getFocusedWindow() || win;
      if (targetWin) {
        if (targetWin.isFullScreen()) {
          targetWin.setFullScreen(false);
        }
        if (targetWin.isMinimized()) targetWin.restore();
        targetWin.show();
        targetWin.focus();
      }
      if (payload.filePath) {
        const errorMsg = await shell.openPath(payload.filePath);
        if (errorMsg) {
          console.error("[Shell Open Error]:", errorMsg);
        }
      }
    });
    notification.show();
    return { success: true };
  }
);
ipcMain.handle("get-printers", async () => {
  if (!win) return [];
  return await win.webContents.getPrintersAsync();
});
ipcMain.handle("print-raw-driver", async (_, { printerName, rawBuffer }) => {
  return new Promise((resolve) => {
    try {
      const cleanPrinterName = String(printerName || "").trim();
      if (!cleanPrinterName) {
        return resolve({
          success: false,
          error: "Nama printer belum dipilih atau kosong di aplikasi."
        });
      }
      const base64Data = Buffer.from(rawBuffer).toString("base64");
      const psScript = `
Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] bytes) {
        if (bytes == null || bytes.Length == 0) return false;
        
        IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
        Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
        
        IntPtr hPrinter = new IntPtr(0);
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "RAW Receipt Job";
        di.pDataType = "RAW";
        
        bool bSuccess = false;
        if (OpenPrinter(szPrinterName.Normalize(), out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di)) {
                if (StartPagePrinter(hPrinter)) {
                    int dwWritten = 0;
                    bSuccess = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        Marshal.FreeCoTaskMem(pUnmanagedBytes);
        return bSuccess;
    }
}
"@

$targetPrinter = $env:TARGET_PRINTER
if ([string]::IsNullOrWhiteSpace($targetPrinter)) {
    throw "Target printer environment variable kosong."
}

$base64Input = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($base64Input)) {
    throw "Data buffer biner struk kosong."
}

$rawBytes = [System.Convert]::FromBase64String($base64Input.Trim())
$success = [RawPrinterHelper]::SendBytesToPrinter($targetPrinter, $rawBytes)

if (-not $success) {
    throw "Gagal mengirim data RAW ke spooler Windows untuk printer: '$targetPrinter'. Pastikan printer terhubung dan online."
}
`;
      const ps = spawn(
        "powershell",
        [
          "-NoProfile",
          "-NonInteractive",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          psScript
        ],
        {
          env: {
            ...process.env,
            TARGET_PRINTER: cleanPrinterName
          }
        }
      );
      let stderr = "";
      ps.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      ps.on("close", (code) => {
        if (code !== 0 || stderr) {
          console.error("[PrintRawDriver Error]:", stderr);
          resolve({
            success: false,
            error: stderr || `Process exited with code ${code}`
          });
        } else {
          resolve({ success: true });
        }
      });
      ps.stdin.write(base64Data);
      ps.stdin.end();
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
ipcMain.handle("render-pdf-from-html", async (event, { html, pageSize, options }) => {
  let offscreenWindow = null;
  try {
    offscreenWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    const encodedHtml = encodeURIComponent(html);
    await offscreenWindow.loadURL(`data:text/html;charset=utf-8,${encodedHtml}`);
    const pdfOptions = {
      printBackground: true,
      preferCSSPageSize: true,
      ...options
    };
    const pdfData = await offscreenWindow.webContents.printToPDF(pdfOptions);
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: "Simpan PDF Struk",
      defaultPath: `Struk-${Date.now()}.pdf`,
      filters: [{ name: "PDF Files", extensions: ["pdf"] }]
    });
    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }
    await fs.promises.writeFile(filePath, pdfData);
    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    if (offscreenWindow) {
      offscreenWindow.destroy();
    }
  }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
    splash = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSplashWindow();
    createWindow();
  }
});
app.whenReady().then(() => {
  createSplashWindow();
  createWindow();
  registerSerialHandlers();
  registerSaveFileHandler(() => win);
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
