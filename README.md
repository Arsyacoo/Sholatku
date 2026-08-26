# 🌙 Sholatku — Modern Islamic Prayer Companion

Aplikasi web modern, presisi, dan elegan untuk jadwal waktu sholat harian, hitung mundur adzan *real-time*, kompas arah kiblat, dan kalender hisab bulanan.

![Sholatku Banner](public/icon.svg)

## ✨ Fitur Utama

- **📍 Lokasi Otomatis & Pencarian Manual:** Mendukung GPS browser dan database pencarian lengkap seluruh kota/kabupaten di Indonesia serta kota-kota dunia.
- **⏱️ Next Prayer & Live Countdown:** Menampilkan waktu sholat berikutnya secara akurat dengan hitung mundur detik *drift-free* dan *rollover* otomatis ke Subuh esok hari setelah Isya.
- **🕌 6 Jadwal Lengkap:** Subuh, Syuruq (Terbit), Dzuhur, Ashar, Maghrib, dan Isya.
- **🧭 Kompas Arah Kiblat:** Menghitung sudut derajat presisi dari Utara Sejati (*Great Circle distance & bearing*) ke Ka'bah di Makkah, mendukung sensor orientasi kompas perangkat.
- **📅 Kalender Bulanan:** Jadwal sholat dan imsakiyah sebulan penuh dengan fitur *print schedule*.
- **⚙️ Pengaturan Hisab Fleksibel:** Mendukung metode Kemenag RI, MWL, Umm Al-Qura, madhab Ashar (Syafi'i/Hanafi), dan koreksi menit manual (*ihtiyat*).
- **📱 PWA & Offline Math Engine:** Dapat diinstal di perangkat seluler dan tetap berfungsi menampilkan jadwal sholat meskipun tanpa koneksi internet.

## 🛠️ Teknologi

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide Icons
- **Testing:** Vitest
- **Design Philosophy:** Impeccable Craft Standards

## 🚀 Memulai (Development)

1. Clone repositori:
```bash
git clone https://github.com/Arsyacoo/Sholatku.git
cd Sholatku
```

2. Pasang dependensi:
```bash
npm install
```

3. Jalankan server lokal:
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

4. Menjalankan pengujian (Unit Tests):
```bash
npm test
```

5. Membangun untuk produksi:
```bash
npm run build
```

## 📄 Lisensi
MIT License &copy; 2026 Sholatku
