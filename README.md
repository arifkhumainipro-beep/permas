# Portal Rasmi PERMAS Nasional (Persatuan Mahasiswa Selangor Kebangsaan)

Laman web rasmi bertaraf profesional, moden dan berimpak tinggi untuk **Persatuan Mahasiswa Selangor (PERMAS) Kebangsaan**. Dibangunkan dengan seni bina UI/UX kontemporari berpaksikan identiti kemegahan warna Diraja Selangor (Merah & Kuning Emas) digabungkan dengan estetik *Glassmorphism* dan *Dark Executive Tech*.

---

## 🌟 Ciri-Ciri Utama & Grafik UI/UX

1. **Interaktif Hero Canvas (Rangkaian Konstelasi Zarah)**
   - Animasi zarah *particle network* interaktif di bahagian Hero yang bergerak secara dinamik melambangkan jaringan perpaduan 38 cawangan kampus IPT.

2. **Kalkulator Pintar: Semak Kelayakan Inisiatif Mahasiswa (30 Saat)**
   - Pengguna memilih taraf anak Selangor, peringkat pengajian (Diploma, Ijazah, Master/PhD), pendapatan keluarga (B40, M40, T20), dan lokasi kampus.
   - Sistem secara automatik memadankan dan memaparkan senarai bantuan yang layak diterima (Dermasiswa sehingga RM5,000, Skim Laptop Percuma, Tiket Kasih Siswa, Baucar Buku, SISPRO).

3. **Penjana Kad Keahlian Maya 3D Holografik (Virtual Student ID Card)**
   - Pratonton kad maya 3D masa nyata (*real-time typing sync*) dengan kesan sentuhan condong (*3D mouse tilt*).
   - Dilengkapi kod QR pengesahan, nombor matrik rasmi unik, lambang jata, cip pintar maya dan butang untuk **Cetak / Simpan Kad**.

4. **Hab Rangkaian 38 Kampus IPTA & IPTS Seluruh Negara**
   - Direktori cawangan interaktif dengan fungsi carian (*live search*) mengikut nama universiti atau kod (cth: UKM, UM, UPM, UiTM, UTM, Borneo, IPTS).
   - Penapis mengikut zon geografi (Zon Tengah, Utara, Selatan, Pantai Timur, Borneo).
   - Pautan pantas untuk menghubungi pengerusi dan sekretariat cawangan.

5. **Majlis Eksekutif Kebangsaan (MEK) Sesi 2025/2026**
   - Paparan kad eksekutif moden lengkap dengan penapis (Majlis Tertinggi & Biro Eksekutif).
   - Modal profil penuh yang memaparkan universiti, fakulti, daerah asal dan petikan wawasan.

6. **Meja Suara & Sistem E-Aduan Siswa**
   - Borang pengaduan isu kebajikan, asrama, yuran, dan pengangkutan yang menjana **Kod Penjejakan Rasmi** (cth: `ADU-PMS-123456`).
   - Modul semakan status aduan sedia ada secara terus di portal.

7. **Bilik Berita, Kenyataan Media & Takwim Mega Sesi 2026**
   - Paparan artikel terkini dengan fungsi modal pembaca (*in-page reader*).
   - Jadual takwim tahunan bagi program mega seperti Konvensyen Mahasiswa Selangor (KMS), SUKMAS, dan Hackathon.

8. **Sistem Notifikasi Toast Moden**
   - Maklum balas visual yang lancar untuk setiap interaksi pengguna.

---

## 📂 Struktur Fail Projek

```
c:\Permas\
├── index.html              # Laman utama portal (Semantic HTML5 + Tailwind)
├── start-website.bat       # Skrip pelancar terus di Windows (Double click untuk buka)
├── package.json            # Konfigurasi projek & skrip pelayan
├── css/
│   └── custom.css          # Gaya Glassmorphism, efek holografik, animasi & tipografi
├── js/
│   ├── app.js              # Logik interaktif, kalkulator kelayakan, 3D tilt, canvas
│   └── data.js             # Pangkalan data cawangan kampus, MEK, inisiatif & artikel
└── assets/
    ├── logo.svg            # Vektor emblem rasmi PERMAS Kebangsaan
    ├── logo-horizontal.svg # Logo lockup mendatar untuk header
    └── selangor-flag.svg   # Vektor bendera rasmi Negeri Selangor
```

---

## 🚀 Cara Menjalankan Laman Web

### Cara 1: Buka Terus (Paling Mudah)
Klik dua kali pada fail `start-website.bat` atau terus buka fail `index.html` menggunakan pelayar web kegemaran anda (Google Chrome, Microsoft Edge, Firefox, Brave).

### Cara 2: Menggunakan Terminal / Node.js
```bash
npm start
# atau
python -m http.server 3000
```
Buka `http://localhost:3000` di pelayar web.

---

## 🎨 Identiti Rekaan
- **Merah Diraja Selangor:** `#DA291C` (Melambangkan keberanian, ketegasan dan advokasi suara siswa)
- **Kuning Emas Diraja:** `#FFCD00` (Melambangkan kedaulatan ilmu, integriti dan kepimpinan tinggi)
- **Gelap Eksekutif Slate:** `#070B14` & `#0F172A` (Memberikan nuansa kontemporari korporat bertaraf antarabangsa)
- **Tipografi:** *Outfit* (Tajuk & Heading) + *Plus Jakarta Sans* (Kandungan & Perenggan) + *JetBrains Mono* (Kod ID & Penjejakan).

