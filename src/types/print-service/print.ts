// ==========================================
// 1. CORE ELEMENT TYPES (Penyusun Konten)
// ==========================================

export type Alignment = 'left' | 'center' | 'right'
export type FontSize = 'small' | 'normal' | 'large' | 'xlarge' | number
export type BarcodeFormat = 'CODE128' | 'EAN13' | 'EAN8' | 'UPCA' | 'CODE39'

/** Elemen Teks */
export interface TextContent {
  type: 'text'
  text: string
  align?: Alignment
  bold?: boolean
  italic?: boolean
  underline?: boolean
  size?: FontSize
}

/** Elemen Garis Pemisah */
export interface SeparatorContent {
  type: 'separator'
  style?: 'solid' | 'dashed' | 'dotted' | 'double'
  char?: string // Contoh: '-' atau '=' khusus untuk Printer Dot Matrix
}

/** Elemen QR Code */
export interface QRCodeContent {
  type: 'qrcode'
  value: string
  align?: Alignment
  size?: number // Ukuran modul (1-8) untuk POS Thermal, atau Pixel untuk A4
}

/** Elemen Barcode 1D */
export interface BarcodeContent {
  type: 'barcode'
  value: string
  format?: BarcodeFormat
  align?: Alignment
  height?: number
  showText?: boolean // Menampilkan teks/angka di bawah barcode
}

/** Elemen Gambar / Logo */
export interface ImageContent {
  type: 'image'
  url?: string
  base64?: string // Sangat direkomendasikan untuk POS offline/mode lokal
  align?: Alignment
  width?: number
  height?: number
}

/** Elemen Spasi Baris Tambahan */
export interface SpaceContent {
  type: 'space'
  lines?: number
}

/** Elemen Pemotong Halaman / Kertas */
export interface PageBreakContent {
  type: 'pagebreak'
}

// ==========================================
// 2. TABLE TYPES (Mendukung Multi-Content Cell)
// ==========================================

export interface TableColumn {
  width: number // Persentase (%) untuk A4/PDF, atau karakter untuk Thermal (misal: 10, 20)
  align?: Alignment
  header?: string
}

/** Konten yang bisa masuk ke dalam 1 Sel Tabel */
export type TableCellContent =
  | TextContent
  | BarcodeContent
  | QRCodeContent
  | ImageContent

/** Struktur Sel Tabel Kompleks */
export interface TableCell {
  content: string | TableCellContent | TableCellContent[]
  align?: Alignment
  verticalAlign?: 'top' | 'middle' | 'bottom'
  bold?: boolean
}

/** Elemen Tabel */
export interface TableContent {
  type: 'table'
  columns: TableColumn[]
  // Menerima string mentah, objek konten tunggal, atau objek sel kompleks
  rows: (string | TableCellContent | TableCell)[][]
  bold?: boolean
  showHeader?: boolean
  border?: boolean // Sangat berguna untuk layout dokumen A4/A5
}

// ==========================================
// 3. HARDWARE & SPECIAL COMMAND TYPES (Khusus POS/Gudang)
// ==========================================

/** Perintah Potong Kertas Thermal */
export interface CutCommand {
  type: 'cut'
  mode?: 'full' | 'partial'
}

/** Perintah Buka Laci Kasir (Cash Drawer) */
export interface DrawerCommand {
  type: 'drawer'
  pin?: 2 | 5 // Pin pulsa RJ11 (Umumnya pin 2 atau 5)
}

/** Blok Tanda Tangan (Faktur / Surat Jalan) */
export interface SignatureBlockContent {
  type: 'signature_block'
  labels: string[] // Contoh: ["Diterima Oleh", "Sopir", "Gudang", "Hormat Kami"]
}

// ==========================================
// 4. LABEL MULTI-COLUMN TYPES (Printer Stiker)
// ==========================================

export interface LabelConfig {
  columnsCount: 1 | 2 | 3 | 4 // Jumlah stiker per baris
  widthMm: number // Lebar 1 stiker individu (mm)
  heightMm: number // Tinggi 1 stiker individu (mm)
  gapHorizontalMm?: number // Jarak antar stiker horizontal (mm)
  gapVerticalMm?: number // Jarak antar stiker vertikal (mm)
  sensorType?: 'gap' | 'black_mark' | 'continuous'
  darkness?: number // Tingkat kegelapan cetak / heat level (1 - 15)
  speed?: number // Kecepatan cetak
}

/** Sub-elemen yang valid di dalam 1 sel stiker label */
export type LabelCellElement =
  | TextContent
  | BarcodeContent
  | QRCodeContent
  | ImageContent
  | SpaceContent

/** Elemen Grid untuk Label Multi-Kolom */
export interface LabelGridRow {
  type: 'label_grid'
  // Array dari Kolom: Index 0 = Stiker Kolom 1, Index 1 = Stiker Kolom 2, dst.
  columns: LabelCellElement[][]
}

// ==========================================
// 5. COMPREHENSIVE DOCUMENT BLUEPRINT
// ==========================================

/** Seluruh Elemen Dokumen yang Didukung */
export type DocElement =
  | TextContent
  | SeparatorContent
  | TableContent
  | QRCodeContent
  | BarcodeContent
  | ImageContent
  | SpaceContent
  | PageBreakContent
  | CutCommand
  | DrawerCommand
  | SignatureBlockContent
  | LabelGridRow

export interface DocumentBlueprint {
  docType?: 'receipt' | 'invoice' | 'label' | 'report' | 'delivery_order'
  pageSize?:
    | 'thermal58'
    | 'thermal80'
    | 'A4'
    | 'A5'
    | 'label'
    | 'continuous_form'

  /** Konfigurasi wajib jika pageSize === 'label' */
  labelConfig?: LabelConfig

  orientation?: 'portrait' | 'landscape'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }

  elements: DocElement[]
}
// ==========================================
// TYPES — Service Layer
// ==========================================
export interface OperationResult {
  success: boolean
  error?: string
  meta?: Record<string, unknown>
}
