# Panduan Pemasangan 3 Minit: Webhook E-Aduan Google Apps Script (`permasnasionalofficial@gmail.com`)

Skrip ini membolehkan borang [aduan.html](file:///c:/Permas/aduan.html) menghantar **Emel Laporan Rasmi HTML** terus ke `permasnasionalofficial@gmail.com`, menghantar **Emel Resit Pengesahan** kepada pengadu, dan merekodkan setiap kes ke dalam **Google Sheets** secara automatik tanpa perlu membuka aplikasi emel pada peranti pengguna.

---

## Langkah 1: Buka Google Sheets & Editor Apps Script
1. Log masuk ke pelayar menggunakan akaun Google rasmi **`permasnasionalofficial@gmail.com`**.
2. Buka [Google Sheets](https://sheets.new) untuk mencipta satu spreadsheet baharu dan namakannya sebagai **`Rekod E-Aduan Rasmi PERMAS Nasional`**.
3. Pada bar menu atas, klik **Extensions > Apps Script**.

## Langkah 2: Tampal Kod & Luluskan Kebenaran (*Authorize*)
1. Padam semua kod lalai (`function myFunction() {}`) di dalam editor Apps Script.
2. Salin keseluruhan kod daripada fail [`google-apps-script-eaduan.gs`](file:///c:/Permas/google-apps-script-eaduan.gs) dan tampal ke dalam editor tersebut.
3. Tekan ikon **Save** (`Ctrl + S`) dan namakan projek sebagai **`E-Aduan Webhook PERMAS`**.
4. Pada bar pilihan fungsi di bahagian atas, pilih **`testHantarEmelDanSheet`** dan klik **Run**.
5. Apabila tetingkap *Authorization Required* muncul:
   - Klik **Review permissions** → pilih akaun `permasnasionalofficial@gmail.com`.
   - Jika keluar amaran *"Google hasn't verified this app"*, klik **Advanced** → **Go to E-Aduan Webhook PERMAS (unsafe)** → **Allow**.
6. Semak peti masuk `permasnasionalofficial@gmail.com` dan tab baharu **`Rekod E-Aduan PERMAS`** di dalam Google Sheet anda — satu baris ujian dan emel rasmi HTML akan muncul serta-merta.

## Langkah 3: Deploy Sebagai Web App & Masukkan URL
1. Di penjuru kanan atas editor Apps Script, klik **Deploy > New deployment**.
2. Pada ikon gear (*Select type*), pilih **Web app**.
3. Tetapkan pilihan berikut dengan tepat:
   - **Description:** `E-Aduan PERMAS Nasional v1`
   - **Execute as:** `Me (permasnasionalofficial@gmail.com)`
   - **Who has access:** `Anyone` *(wajib supaya borang laman web awam dapat menghantar aduan terus tanpa perlu log masuk Google)*
4. Klik **Deploy** dan salin **Web app URL** yang bermula dengan:
   `https://script.google.com/macros/s/...../exec`
5. Buka fail [`js/gas-config.js`](file:///c:/Permas/js/gas-config.js) dan tampal URL tersebut ke dalam `window.PERMAS_GAS_WEBHOOK_URL`:
   ```javascript
   window.PERMAS_GAS_WEBHOOK_URL = "https://script.google.com/macros/s/.../exec";
   ```
   *(Atau tampalkan URL Web App tersebut terus di ruangan chat ini dan sistem akan memasukkannya serta menyegerakkannya ke GitHub secara automatik.)*
