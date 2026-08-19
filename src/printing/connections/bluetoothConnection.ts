import type { OperationResult } from '../types'
import type { PrintConnection } from './connection.interface'

const ESC_POS_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ae00-0000-1000-8000-00805f9b34fb',
]

/**
 * Kirim RAW bytes via Web Bluetooth (BLE) — dipakai untuk printer thermal
 * portable yang tidak punya WiFi/USB (umum untuk kasir mobile/keliling).
 */
export class BluetoothConnection implements PrintConnection {
  readonly name = 'bluetooth'
  private device: any = null

  /** Harus dipanggil dari user gesture (klik tombol), bukan otomatis */
  async scanAndPair(): Promise<{
    success: boolean
    deviceName?: string
    error?: string
  }> {
    if (!(navigator as any).bluetooth) {
      return {
        success: false,
        error: 'Web Bluetooth API tidak didukung di browser/window ini.',
      }
    }
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ESC_POS_SERVICES,
      })
      this.device = device
      return {
        success: true,
        deviceName: device.name || `BT Device (${device.id.slice(0, 5)})`,
      }
    } catch (err: any) {
      if (err.name === 'NotFoundError') return { success: false, error: '' } // user cancel
      return { success: false, error: err.message || String(err) }
    }
  }

  isPaired(): boolean {
    return !!this.device
  }

  async send(buffer: Uint8Array | Buffer): Promise<OperationResult> {
    if (!this.device) {
      return {
        success: false,
        error: 'Belum ada perangkat Bluetooth yang dipilih/scan.',
      }
    }

    try {
      const server = await this.device.gatt.connect()
      const services = await server.getPrimaryServices()
      let writeChar: any = null

      for (const service of services) {
        const chars = await service.getCharacteristics()
        writeChar = chars.find(
          (c: any) => c.properties.write || c.properties.writeWithoutResponse,
        )
        if (writeChar) break
      }

      if (!writeChar) {
        return {
          success: false,
          error:
            'Karakteristik write Bluetooth tidak ditemukan pada perangkat ini.',
        }
      }

      const bytes =
        buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
      const chunkSize = 512
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize)
        if (writeChar.properties.writeWithoutResponse) {
          await writeChar.writeValueWithoutResponse(chunk)
        } else {
          await writeChar.writeValue(chunk)
        }
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || String(err) }
    }
  }
}
