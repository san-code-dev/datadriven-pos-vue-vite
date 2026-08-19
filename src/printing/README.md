# POS/ERP Printing & Distribution System

Arsitektur 5 layer untuk sistem cetak & distribusi dokumen (struk, invoice,
surat jalan, laporan) yang scalable dari thermal printer sampai sharing digital.

```
Data Layer → Template Layer → Renderer Layer → Connection Layer (hardware)
                                             → Distribution Layer (digital)
```

## Struktur Folder

```
src/
  types.ts                        # TransactionData, DocumentBlueprint, dsb
  printService.ts                 # Orchestrator utama — mulai dari sini

  templates/
    receiptTemplate.ts            # Struk thermal (58/80mm)
    invoiceTemplate.ts            # Invoice/faktur A4/A5
    deliveryOrderTemplate.ts      # Surat jalan

  renderers/
    renderer.interface.ts
    escposRenderer.ts             # → thermal printer fisik
    pdfRenderer.ts                # → PDF (via puppeteer, basis invoice/laporan)
    htmlRenderer.ts               # → HTML (preview UI, basis PDF)
    xlsxRenderer.ts               # → Excel (laporan/export data)
    zplRenderer.ts                # → printer label Zebra/TSC

  connections/                    # Jalur ke HARDWARE fisik
    connection.interface.ts
    driverConnection.ts           # OS Spooler (Windows RAW)
    networkConnection.ts          # LAN/WiFi socket (port 9100)
    bluetoothConnection.ts        # Web Bluetooth (BLE)
    serialConnection.ts           # RS232 (dot-matrix lama, cash drawer)

  distribution/                   # Jalur ke CHANNEL digital
    distribution.interface.ts
    emailChannel.ts               # SMTP/nodemailer
    whatsappChannel.ts            # deeplink (gratis, manual) / Business API (otomatis)
    facebookChannel.ts            # Messenger Platform API
    spreadsheetExportChannel.ts   # simpan lokal / push Google Sheets
    localSaveChannel.ts           # save dialog native (unduh PDF)

electron/
  serialHandler.ts                # IPC handler tambahan untuk serial port
  saveFileHandler.ts              # IPC handler untuk save dialog
```

## Alur Pemakaian Dasar

```ts
import { PrintService } from './src/printService'
import { NetworkConnection } from './src/connections/networkConnection'
import { EmailChannel } from './src/distribution/emailChannel'

const printService = new PrintService()

// 1. Cetak struk fisik ke printer LAN
await printService.printToHardware(transactionData, new NetworkConnection('192.168.1.200'))

// 2. Kirim invoice PDF ke email customer
const emailChannel = new EmailChannel({ /* config SMTP */ })
await printService.distribute(
  { ...transactionData, docType: 'invoice' },
  emailChannel,
  { recipient: 'customer@email.com' }
)
```

## Catatan Penting Per Channel

### Printer Virtual vs Fisik
`connections/connection.interface.ts` punya `isVirtualPrinter()` yang otomatis
menolak nama printer seperti "Microsoft Print to PDF", "XPS Document Writer",
dsb — karena driver ini butuh GDI rendering, bukan RAW ESC/POS bytes. Kalau
dipaksa, hasilnya file 0 byte atau job gagal senyap.

### ESC/POS vs Printer Konvensional
RAW ESC/POS **hanya** untuk printer thermal (dan sebagian dot-matrix yang
mendukung command set serupa). Untuk printer laser/inkjet biasa, gunakan jalur
`PdfRenderer` + `DriverConnection` versi GDI (print dialog native), bukan RAW.

### WhatsApp
- **Mode `deeplink`**: gratis, tanpa approval, tapi file harus di-attach
  manual oleh user setelah chat terbuka — hanya teks/link yang otomatis.
- **Mode `business-api`**: bisa kirim file otomatis penuh, tapi perlu
  verifikasi bisnis Meta + biaya per konversasi.

### Facebook Messenger
Butuh App + Page yang sudah di-review Meta (`pages_messaging` permission).
`recipient` harus PSID (bukan nomor/username), yang hanya didapat setelah user
pernah mengirim pesan ke Page lebih dulu (kebijakan platform). Pertimbangkan
prioritas rendah kecuali basis pelanggan memang aktif via FB Page.

### Google Sheets
`SpreadsheetExportChannel` mode `google-sheets` mengasumsikan ada backend
proxy sendiri yang memegang OAuth2 credentials (jangan simpan token Google di
client/Electron renderer langsung).

## Menambah docType Baru

1. Tambahkan value baru di `DocType` (`types.ts`)
2. Buat file baru di `templates/`, misal `purchaseOrderTemplate.ts`, return
   `DocumentBlueprint`
3. Daftarkan di `PrintService.buildBlueprint()`

Semua renderer (ESC/POS, PDF, HTML, XLSX, ZPL) otomatis bisa memproses
`DocumentBlueprint` baru itu tanpa perubahan lebih lanjut, karena mereka hanya
bergantung pada struktur elemen abstrak (`text`, `table`, `separator`, dst).

## Instalasi

```bash
npm install
```

Dependency utama: `@point-of-sale/receipt-printer-encoder` (ESC/POS),
`puppeteer` (PDF), `exceljs` (XLSX), `nodemailer` (email), `serialport` (RS232).
