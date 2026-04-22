# MAINTAINING DOCS — Panduan singkat untuk menambah / memperbarui dokumentasi

Tujuan singkat: saat Anda menambahkan fitur baru, gunakan panduan dan prompt kecil ini agar pembaruan dokumentasi konsisten dan hemat token.

File dokumentasi utama (update saat fitur berubah):
- `docs/FEATURES.md` — ringkasan fitur singkat dan tujuan.
- `docs/ENDPOINTS.md` — daftar endpoint penting (path + method + tujuan).
- `docs/FRONTEND_PAGES.md` — daftar halaman React/TSX dan tanggung jawabnya.
- `docs/COMPLETE_FEATURES.md` — mapping fitur → routes/controllers (lebih lengkap).

Langkah cepat saat menambahkan fitur baru:
1. Catat detail singkat fitur (1–2 baris) dan file yang diubah (controller, route, model, frontend path).
2. Tambahkan route baru ke `routes/*.php` — commit perubahan kode terlebih dahulu.
3. Jalankan prompt singkat (di bawah) untuk memperbarui file dokumentasi.
4. Review perubahan pada `docs/*.md` lalu commit.

Checklist minimal untuk setiap pembaruan docs:
- Nama fitur (singkat)
- Tujuan / deskripsi 1 baris
- Route(s) baru / diubah (METHOD path → Controller@method)
- Controller(s) dan method yang relevan
- Model(s) yang baru/diupdate
- Frontend page/component yang terpengaruh (path)
- Catatan operasional (izin, plugin native, caveats)

Prompt template (hemat token):
Berikan hanya data ringkas dengan format YAML/JSON singkat. Contoh JSON minimal yang bisa Anda kirim ke assistant:

{
  "feature": "Nama fitur singkat",
  "summary": "Satu kalimat menjelaskan tujuan",
  "routes": ["POST /sales/foo -> SalesFooController@store"],
  "controllers": ["App\\Http\\Controllers\\SalesFooController@store"],
  "models": ["SalesFoo"],
  "frontend": ["resources/js/pages/sales/foo.tsx"],
  "notes": "opsional: caveat atau kebutuhan plugin native"
}

Contoh prompt efisien yang Anda kirimkan ke assistant:

Update docs for new feature — then paste the JSON block above.

Apa yang assistant akan lakukan (otomatis, ringkas):
- Tambah satu entri singkat di `docs/FEATURES.md`.
- Tambah route singkat di `docs/ENDPOINTS.md`.
- Tambah halaman singkat di `docs/FRONTEND_PAGES.md` jika ada frontend.
- Sinkronkan mapping di `docs/COMPLETE_FEATURES.md`.

Tips hemat token:
- Berikan hanya field yang berubah (jangan kirim seluruh file atau kode panjang).
- Ringkas deskripsi (1 baris). Jika butuh detail, buat PR doc terpisah.
- Jika perlu menyertakan potongan kode, berikan path file + 5–10 baris konteks saja.

Contoh penggunaan singkat:
1) Anda menambah route `POST /sales/foo` dan controller `SalesFooController@store`.
2) Kirim prompt: "Update docs for new feature" + JSON di atas dengan values.
3) Assistant akan memperbarui empat file doc sesuai mapping.

Jika mau, saya bisa juga membuat script kecil (PHP/Node) untuk mengambil data route secara otomatis dari file `routes/*.php` dan menghasilkan draft `docs/ENDPOINTS.md` — beri tahu kalau Anda mau.
