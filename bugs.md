- autofocus rows data master/ transaction tidak konsisten setelah view/add/update/delete
- data selector untuk relation details, header, master belum bisa
- action button print, export dll belum bisa
- quick search dialog belum bisa menampilkan hasil pencarian di dialog selector
- <mark>date parse UTC ke lokal di input belum</mark>
- autorefresh sesi login belum
- validasi input type
- filter data masih lokal based perlu dimasukan di schema agar sinkron
- info user
- chat user
- multi database connection untuk pemisahan system dan data tahunan
- multi database untuk lokasi dataset yang berbeda untuk perusahaan yang berbeda
- pagination / lazy load (tidak mungkin karena pakai socket io dan atomic schema update)
- transaction activeHeaderId masih hardcoded dari property id harusnya dari field yang primary=true
- standarisasi dynamic filter,form,input,data, dll untuk tipe data datetime diserver di ubah ke date tapi memastikan jam tetap ada
- tab header grab error reorder array rtl cant redifined on revogrid mouse pointer grab
- alt + arrow shortcut revogrid error
- add reset tab for active tabs
- belum ada .env
- memory leaks electron heap v8 4GB
- dynamics filter relation field must display reference data list for selector instead of manual typing

====================================================================

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

====================================================================
