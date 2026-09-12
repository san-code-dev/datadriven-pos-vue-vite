Feature

default global database db_system (user)
1 user= multi company
1 company= variatious busniess process
1 company = single business proses
1 business prosess = multi tenancy

1 company / 1 business process = 2 database  company_tmp  and company_big{read only)

all tenancy going into single database divided by RLS

Bisnis sudah lengkap arsitekturnya seperti erp hanya saja bisnis prosesnya disesuai kan dengan cara bisnis didalamnya

misal company A= bisnis padel (didalamnya sudah lengkap member, pertandingan, dll) dan multi tenancy/ bisa banyak cabang
company B= bisnis produksi printer sablon B2B (didalamnya sudah lengkap pembelian, penjualan, dll) an multi tenancy/ bisa banyak cabang

jadi keduanya terisolasi secara company tapi masih bisa bergabung dilingkup tenant / 1 company yang sama

fitur core (laporan keuangan, perpajakan, dll not customable) on/off
logic standar business sistem default (customable)
fitur modular seperti (payment,dll)

aplikasi jalan bisa online bisa offline

saat online load master data
saat offline semua perangkat masih bisa berjalan lewat websocket saat saling berinteraksi

Meta driven UI berdasarkan role
Buat Bisnis logic builder yang paling mudah digunakan oleh bisnis konsultan
