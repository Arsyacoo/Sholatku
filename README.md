# 🌙 Sholatku — Modern Islamic Prayer & Quran Companion

Aplikasi web modern, presisi, dan elegan untuk jadwal waktu sholat harian, hitung mundur adzan *real-time*, kompas arah kiblat, serta Al-Qur'an digital 30 Juz lengkap dengan audio murottal dan pencarian ayat.

![Sholatku Banner](public/icon.svg)

## ✨ Fitur Utama

### 🕌 Waktu Sholat & Arah Kiblat
- **📍 Lokasi Otomatis & Pencarian Manual:** Mendukung GPS browser dan database pencarian lengkap seluruh kota/kabupaten di Indonesia serta kota-kota dunia.
- **⏱️ Next Prayer & Live Countdown:** Menampilkan waktu sholat berikutnya secara akurat dengan hitung mundur detik *drift-free* dan *rollover* otomatis ke Subuh esok hari setelah Isya.
- **🕌 6 Jadwal Lengkap:** Subuh, Syuruq (Terbit), Dzuhur, Ashar, Maghrib, dan Isya.
- **🧭 Kompas Arah Kiblat:** Menghitung sudut derajat presisi dari Utara Sejati (*Great Circle distance & bearing*) ke Ka'bah di Makkah, mendukung sensor orientasi kompas perangkat.
- **📅 Kalender Bulanan:** Jadwal sholat dan imsakiyah sebulan penuh dengan fitur *print schedule*.
- **⚙️ Pengaturan Hisab Fleksibel:** Mendukung metode Kemenag RI, MWL, Umm Al-Qura, madhab Ashar (Syafi'i/Hanafi), dan koreksi menit manual (*ihtiyat*).

### 📖 Al-Qur'an Digital & Audio Murottal
- **📚 114 Surat & 30 Juz Lengkap:** Teks Arab Utsmani, transliterasi Latin, dan terjemahan resmi Kemenag RI.
- **📄 Paginasi Ayat Pintar (*Smart Pagination*):** Membagi ayat surat panjang (misal: Al-Baqarah) menjadi per halaman ringkas (mode 10, 20, 50, atau Semua Ayat) agar membaca lebih nyaman dan cepat.
- **🔍 Pencarian Kata Kunci & Lompat Ayat:** Cari kata dalam terjemahan surat dan lompat instan ke nomor ayat tertentu.
- **🔊 Pemutar Audio Murottal Interaktif:** Audio lantunan per ayat dengan *active highlighting* dan *auto-scroll* otomatis mengikuti bacaan.
- **🎙️ Pilihan Qari:** Syaikh Misyari Rasyid Al-Afasy, Abdullah Al-Juhany, Abdul Muhsin Al-Qasim, dan Mahmoud Khalil Al-Husary.
- **🔖 Bookmark & Koleksi Ayat:** Tandai bacaan terakhir (*Last Read*) dan simpan ayat-ayat favorit ke tab koleksi pribadi.
- **📦 Mode Offline (*Offline-First Cache*):** Surat yang pernah dibuka otomatis tersimpan di perangkat sehingga tetap bisa dibaca tanpa koneksi internet.

## 🛠️ Teknologi

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide Icons
- **Testing:** Vitest (20 Unit Tests)
- **Design Standards:** Impeccable Craft

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
