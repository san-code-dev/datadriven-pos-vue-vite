ide:
front end ui framework tetap
isinya mengikuti hasil json dari backend untuk generate ui, dan kirim permintaan GET,POST,PUT,DELETE
================================================================================================================================================
backend ui framework tetap
business logicnya mengikuti konfigurasi dari business logic builder
================================================================================================================================================
modular sistem untuk
payment, web intregasi, marketplace, streaming, live chat,
================================================================================================================================================
client side configuration hanya diakses superadmin seperti apikey 3rd party, setting ada di front end, disimpan
kedatabase setting
tapi setting juga bisa diatur ke local based per aplikasi
================================================================================================================================================
logic builder ada dionline
semua orang bisa membangun logic builder menghasilkan file konfigurasi bisa dipakai sendiri,
bisa dishare di marketplace gratis berbayar / berlangganan
================================================================================================================================================
front end ui sudah disediakan gratis tapi bisa bikin sendiri dengan framework yang akan saya buat di npm
================================================================================================================================================
scan nota input data/transaksi tipe PDF417
================================================================================================================================================multi database, db_main=master data,konfigurasi, pending transaction, db_tahun_aktif= transaksi, dll, auto backup jam 1 malam cloud dan hardcopy
================================================================================================================================================
audit trail data, menampilkan bagaimana data berjalan, dari pembelian-> produksi-> hasil produk-> stock-> penjualan-> laba
================================================================================================================================================



problem:
1. migrasi database, perubahan schema memastikan data tidak rusak / error dan tidak mempengaruhi performa

fokus:
1. sistem database terpisah dulu busnis logic baru = database baru
2. busniness logic manual backend dulu per end point di kode secara manual
3. hasil api endpoint membuat komponen front end ui otomatis sesuai hasil json dari backend
4. request GET, POST, PUT, DELETE bisa dilakukan dari front end ui diarahkan ke backend sesuai endpoint yang sudah
dibuat
5. rilis v1.0.0 