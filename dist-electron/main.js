var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { ipcMain, dialog, app, Notification, BrowserWindow } from "electron";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";
import { spawn } from "node:child_process";
import puppeteer from "puppeteer";
import { SerialPort } from "serialport";
import fs$1 from "node:fs/promises";
class HtmlRenderer {
  constructor() {
    __publicField(this, "name", "html");
  }
  async render(blueprint, options = {}) {
    const isThermal = blueprint.pageSize === "thermal58" || blueprint.pageSize === "thermal80";
    const pageWidthCss = blueprint.pageSize === "thermal58" ? "58mm" : blueprint.pageSize === "thermal80" ? "80mm" : "210mm";
    const pageCssSize = blueprint.pageSize === "thermal58" ? "58mm auto" : blueprint.pageSize === "thermal80" ? "80mm auto" : blueprint.pageSize === "A5" ? "A5" : "A4";
    const body = blueprint.elements.map((el) => this.renderElement(el)).join("\n");
    return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<style>
  /* === STYLING UTAMA (Untuk Preview di iframe / UI) === */
  html, body {
    margin: 0;
    padding: 20px 0;
    background: #333333; /* Background gelap kontras kembali untuk Preview iframe */
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    box-sizing: border-box;
  }

  /* Kertas Struk / Dokumen */
  .document-sheet {
    font-family: ${isThermal ? "'Courier New', monospace" : "'Helvetica Neue', Arial, sans-serif"};
    width: ${pageWidthCss};
    background: #ffffff;
    padding: ${isThermal ? "8px" : "24px"};
    font-size: ${isThermal ? "11px" : "13px"};
    color: #111;
    box-sizing: border-box;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); /* Efek bayangan kertas saat di iframe */
  }

  .align-center { text-align: center; }
  .align-right { text-align: right; }
  .align-left { text-align: left; }
  .bold { font-weight: 700; }
  .italic { font-style: italic; }
  .separator { border-bottom: 1px dashed #999; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; margin: 4px 0; }
  th { text-align: left; border-bottom: 1px solid #333; font-size: 11px; padding: 2px 4px; }
  td { padding: 2px 4px; vertical-align: top; }
  .signature-block { display: flex; justify-content: space-between; margin-top: 40px; }
  .signature-box { text-align: center; width: 30%; }
  .signature-line { border-top: 1px solid #333; margin-top: 48px; padding-top: 4px; }
  
  .qr-placeholder { 
    width: 80px; 
    height: 80px; 
    border: 1px solid #ccc; 
    margin: 8px auto; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-size: 9px; 
  }
  .qr-placeholder img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .barcode-container {
    margin: 6px 0;
  }
  .barcode-container img {
    max-width: 100%;
    height: auto;
    display: inline-block;
  }

  /* === STYLING KHUSUS UNTUK CETAK / PUPPETEER PDF === */
  @media print {
    @page {
      size: ${pageCssSize};
      margin: 0;
    }

    html, body {
      background: #ffffff !important; /* Hapus background gelap saat di-PDF-kan */
      padding: 0 !important;
      display: block !important;
      min-height: auto !important;
    }

    .document-sheet {
      box-shadow: none !important; /* Hapus bayangan saat di-PDF-kan */
      margin: 0 auto !important;
    }
  }
</style>
</head>
<body>
<div class="document-sheet">
${body}
</div>
</body>
</html>`;
  }
  renderElement(el) {
    switch (el.type) {
      case "text":
        return `<div class="${this.alignClass(el.align)} ${el.bold ? "bold" : ""} ${el.italic ? "italic" : ""}" style="${el.size ? `font-size:${11 + el.size * 3}px` : ""}">${escapeHtml(el.text)}</div>`;
      case "separator":
        return `<div class="separator"></div>`;
      case "table": {
        const header = el.showHeader ? `<thead><tr>${el.columns.map((c) => `<th class="${this.alignClass(c.align)}">${escapeHtml(c.header || "")}</th>`).join("")}</tr></thead>` : "";
        const rows = el.rows.map(
          (row) => `<tr class="${el.bold ? "bold" : ""}">${row.map(
            (cell, i) => {
              var _a;
              return `<td class="${this.alignClass((_a = el.columns[i]) == null ? void 0 : _a.align)}">${escapeHtml(cell)}</td>`;
            }
          ).join("")}</tr>`
        ).join("");
        return `<table>${header}<tbody>${rows}</tbody></table>`;
      }
      case "qrcode":
        return `<div class="${this.alignClass(el.align)}"><div class="qr-placeholder" data-qr-value="${escapeHtml(el.value)}">QR: ${escapeHtml(el.value.slice(0, 20))}</div></div>`;
      case "barcode":
        return `<div class="${this.alignClass(el.align)} barcode-container">
          <img src="https://barcode.tec-it.com/barcode.ashx?code=${escapeHtml(el.format)}&data=${escapeHtml(el.value)}&dpi=150" alt="Barcode ${escapeHtml(el.value)}" />
        </div>`;
      case "image":
        return `<div class="${this.alignClass(el.align)}"><img src="${el.url}" style="max-width:${el.width || 100}%" /></div>`;
      case "space":
        return `<div style="height:${(el.lines || 1) * 10}px"></div>`;
      case "pagebreak":
        return `<div style="page-break-after: always"></div>`;
      case "signature_block":
        return `<div class="signature-block">${el.labels.map(
          (label) => `<div class="signature-box"><div class="signature-line">${escapeHtml(label)}</div></div>`
        ).join("")}</div>`;
    }
  }
  alignClass(align) {
    return align === "center" ? "align-center" : align === "right" ? "align-right" : "align-left";
  }
}
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
}
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
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    // Window dibuat tersembunyi terlebih dahulu
    backgroundColor: "#1e293b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      experimentalFeatures: false
      // Pastikan fitur eksperimental aktif di context web
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
ipcMain.handle(
  "show-notification",
  async (_, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
      return { success: true };
    }
    return { success: false, error: "Notifikasi tidak didukung di sistem ini" };
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
ipcMain.handle(
  "render-pdf",
  async (_, payload) => {
    try {
      const { blueprint, options } = payload;
      const htmlRenderer = new HtmlRenderer();
      const html = await htmlRenderer.render(blueprint, options);
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox"]
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      const pdfOptions = {
        printBackground: true,
        preferCSSPageSize: true
      };
      const isThermal = blueprint.pageSize === "thermal58" || blueprint.pageSize === "thermal80";
      if (isThermal) {
        const bodyHeight = await page.evaluate(() => {
          const el = document.querySelector(".document-sheet");
          return el ? el.scrollHeight : document.body.scrollHeight;
        });
        pdfOptions.width = blueprint.pageSize === "thermal58" ? "58mm" : "80mm";
        pdfOptions.height = `${bodyHeight + 4}px`;
        pdfOptions.margin = {
          top: "0px",
          right: "0px",
          bottom: "0px",
          left: "0px"
        };
      } else if (blueprint.pageSize === "A5") {
        pdfOptions.format = "A5";
        pdfOptions.margin = {
          top: "10mm",
          right: "10mm",
          bottom: "10mm",
          left: "10mm"
        };
      } else {
        pdfOptions.format = "A4";
        pdfOptions.margin = {
          top: "10mm",
          right: "10mm",
          bottom: "10mm",
          left: "10mm"
        };
      }
      const pdfUint8Array = await page.pdf(pdfOptions);
      await browser.close();
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: "Simpan Dokumen PDF",
        defaultPath: `${blueprint.title || "dokumen"}.pdf`,
        filters: [{ name: "Dokumen PDF", extensions: ["pdf"] }]
      });
      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }
      await fs.promises.writeFile(filePath, Buffer.from(pdfUint8Array));
      return { success: true, filePath };
    } catch (error) {
      console.error("[Render-PDF Error]:", error);
      return { success: false, error: error.message };
    }
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
app.whenReady().then(() => {
  createWindow();
  registerSerialHandlers();
  registerSaveFileHandler(() => win);
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
