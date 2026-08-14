import { ipcMain, app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";
import { spawn } from "node:child_process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
let win = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    // 1. Buat window tersembunyi terlebih dahulu
    backgroundColor: "#1e293b",
    // Warna latar belakang agar tidak layar putih sesaat
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.once("ready-to-show", () => {
    win == null ? void 0 : win.show();
    win == null ? void 0 : win.focus();
  });
  win.webContents.on(
    "select-bluetooth-device",
    (event, deviceList, callback) => {
      event.preventDefault();
      if (deviceList && deviceList.length > 0) {
        callback(deviceList[0].deviceId);
      }
    }
  );
  if (VITE_DEV_SERVER_URL) {
    console.log("[Electron] Memuat Dev Server:", VITE_DEV_SERVER_URL);
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(RENDERER_DIST, "index.html");
    console.log("[Electron] Memuat File Lokal:", indexPath);
    win.loadFile(indexPath);
  }
  win.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("[Electron] Gagal load URL:", errorCode, errorDescription);
  });
}
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
