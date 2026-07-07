Berikut adalah dokumen **Spesifikasi Arsitektur Audit Trail Universal** yang telah kita diskusikan. Dokumen ini dirancang khusus agar mudah dibaca kembali saat Anda siap mengeksekusinya di masa mendatang.

---

## 📑 SPESIFIKASI ARSITEKTUR AUDIT TRAIL UNIVERSAL

> **Prinsip Utama:** *Immutable* (Tidak boleh diedit/dihapus, hanya boleh ditambah ke bawah) dan *Universal* (Satu struktur tabel untuk semua jenis industri/modul).

---

## 1. STRUKTUR DATABASE UNIVERSAL (`audit_trails`)

Gunakan nama *field* abstrak agar tabel ini bisa digunakan di proyek manufaktur, ritel, jasa (Pilates), maupun perbankan.

| Nama Kolom | Tipe Data | Fungsi & Logika |
| --- | --- | --- |
| `id` | BigInt / UUID | **Primary Key** unik untuk baris log ini. |
| `trace_id` | String | **Benang Merah.** ID pengikat satu siklus hidup (Leluhur). |
| `stage` | String | Nama tahapan aktivitas (Contoh: `PEMBELIAN`, `RETUR`, `CHECK_IN`). |
| `reference_no` | String | **Logical Foreign Key.** Nomor nota/dokumen asli transaksi. |
| `entity_name` | String | Nama objek yang diproses (Nama barang / nama paket jasa). |
| `metric_change` | Decimal | Angka perubahan kuota/stok (Bisa positif `+` atau negatif `-`). |
| `value_change` | Decimal | Angka perubahan uang/finansial (Bisa positif `+` atau negatif `-`). |
| `actor_name` | String | Nama user yang mengeksekusi tindakan saat itu. |
| `notes` | Text | Keterangan opsional / alasan jika ada revisi atau retur. |
| `created_at` | Timestamp | Waktu otomatis saat log tercatat. |

---

## 2. LOGIKA SYARAT TERBENTUKNYA `trace_id` (Silsilah Data)

*Trace ID* dibuat secara otomatis di backend dengan mematuhi 2 kondisi:

* **Kondisi 1 (Akar Baru):** Jika transaksi dibuat tanpa referensi nota lain (Stok Awal, Pembelian Pertama, Registrasi Member Baru).
* *Aksi:* Sistem men-generate `trace_id` baru.


* **Kondisi 2 (Anak/Cucu/Cicit):** Jika transaksi lahir karena menarik data dari transaksi sebelumnya (Produksi mengambil data Pembelian, Kasir mengambil data Produksi, Retur mengambil data Kasir).
* *Aksi:* Sistem melacak ke belakang secara rekursif (*trace-back*) hingga menemukan `trace_id` milik Kakek Buyutnya, lalu menyalin ID tersebut.



---

## 3. STRATEGI MENGATASI TRANSAKSI ECERAN (Biar Gak Kepanjangan)

Jika produk terjual per 1 pcs (eceran), timeline akan sangat panjang jika dicatat satu per satu. Gunakan salah satu dari 2 taktik ini:

1. **Sistem Multibatch (FIFO):** Setiap siklus produksi baru wajib membuat `trace_id` baru. Penjualan eceran otomatis memotong stok milik `trace_id` paling tua yang masih tersedia.
2. **Agregasi Harian:** Penjualan eceran dicatat biasa di kasir. Setiap malam, sistem menjalankan fungsi otomatis untuk menjumlahkan total penjualan hari itu dan memasukkannya sebagai **satu baris log rangkuman** di *Audit Trail*.

---

## 4. METODE PENYESUAIAN DATA (Revisi & Retur)

* **Dilarang Keras** melakukan perintah SQL `UPDATE` atau `DELETE` pada tabel `audit_trails`.
* Jika ada kesalahan data atau barang cacat, sistem wajib memasukkan **baris log baru (langkah tambahan)** di bawahnya dengan `stage` khusus (misal: `RETUR_PENJUALAN` atau `REVISI_STOK`) dengan nilai `metric_change` atau `value_change` minus (`-`).
* Untuk menghitung laba bersih di akhir, sistem cukup menjalankan fungsi `SUM()` pada kolom `value_change` berbasis `trace_id` tersebut.

---

## 5. ARSITEKTUR ANTARMUKA (Frontend Vue)

Sediakan dua pintu masuk di aplikasi yang bermuara pada satu komponen *Timeline* yang sama:

### Pintu 1: Global Logger (Menu Laporan Mandiri)

Halaman pencarian besar. User bisa mengetik kata kunci apa saja (Nomor nota tersembunyi, nama barang, nama aktor). Sistem mencari `trace_id` yang cocok dan menampilkan peta urutan kejadiannya.

### Pintu 2: Contextual Shortcut (Tombol Pintas)

Di setiap form transaksi biasa (Form PO, Form Invoice, dll), pasang tombol 🌐 **"Lacak Alur Transaksi"**. Jika diklik, sistem langsung mengambil `trace_id` dokumen tersebut dan membuka linimasanya.

### Fitur Interaktif: Drill-Down Link

Di dalam komponen *Timeline*, nomor dokumen (`reference_no`) wajib dijadikan link aktif. Jika diklik, sistem membaca kolom `stage` untuk mengarahkan rute (*Vue Router*) dan langsung membuka detail form transaksi asli tempat data itu berasal.

---

> 📌 **Catatan Eksekusi:** Saat Anda mulai *coding*, buatlah satu fungsi global di folder helper/library backend dengan nama `logAuditTrail(payload)`. Cukup panggil fungsi tunggal tersebut di baris paling bawah setiap kali ada fungsi transaksi yang berhasil disimpan (*execute on success*).