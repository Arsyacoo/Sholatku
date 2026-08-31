# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pengguna utama adalah muslim Indonesia yang ingin melihat jadwal sholat serta membaca dan mendengarkan Al-Qur'an secara online. Pengalaman utama dioptimalkan untuk ponsel, dengan desktop sebagai pengalaman sekunder yang tetap lengkap dan nyaman digunakan.

## Product Purpose

Sholatku adalah pendamping ibadah berbasis web yang menggabungkan jadwal sholat berbasis lokasi, arah kiblat, pengaturan perhitungan waktu sholat, dan pembaca Al-Qur'an online. Pengguna harus dapat berpindah dari kebutuhan waktu sholat ke membaca atau mendengarkan ayat tanpa alur yang rumit.

## Positioning

Sholatku menyatukan pengalaman waktu sholat berbasis lokasi dan pembaca Al-Qur'an berbahasa Indonesia dalam satu aplikasi yang dapat digunakan langsung melalui browser tanpa akun.

## Operating Context

- Pengguna membuka aplikasi pada ponsel untuk memeriksa jadwal sholat, membaca ayat, atau mendengarkan murottal.
- Pembacaan Al-Qur'an dapat berlanjut antar-surat melalui data terakhir dibaca, favorit, dan bookmark lokal.
- Preferensi pengguna, termasuk tampilan dan perilaku pemutar audio, disimpan secara lokal di perangkat tanpa mewajibkan akun.
- Desktop mendukung fungsi yang sama sebagai pengalaman sekunder.

## Capabilities and Constraints

- Aplikasi menggunakan Next.js, React, TypeScript, dan Tailwind CSS.
- Data Al-Qur'an dan audio diperoleh melalui layanan eksternal, dengan cache lokal untuk surat yang pernah dimuat.
- Pemutar audio mendukung pemilihan qari, navigasi antar-ayat, pengulangan, volume, mute/unmute, dan pengaturan kecepatan.
- Volume menggunakan rentang 0–100 persen dan preferensi terakhir harus disimpan.
- Kecepatan audio menggunakan opsi 0,25×, 0,5×, 0,75×, 1×, 1,25×, 1,5×, dan 2×; nilai awal 1× dan preferensi terakhir harus disimpan.
- Penyimpanan preferensi menggunakan penyimpanan lokal browser dan harus tetap aman ketika data lama belum memiliki field baru.
- Aplikasi tidak mewajibkan akun atau penyimpanan data pengguna di server.

## Brand Commitments

- Nama produk adalah Sholatku.
- Bahasa antarmuka utama adalah Bahasa Indonesia.
- Istilah ibadah dan nama surat harus diperlakukan secara jelas dan hormat.
- Identitas dan pola interaksi yang sudah ada dipertahankan untuk pengembangan fitur yang bersifat tambahan.

## Evidence on Hand

- Katalog 114 surat dan pemetaan 30 juz tersedia di dalam repositori.
- Integrasi data Al-Qur'an Indonesia dan audio murottal tersedia melalui API yang sudah digunakan aplikasi.
- Source aplikasi memiliki pembaca ayat, pemutar audio mengambang, pilihan qari, bookmark, cache offline, dan pengaturan tampilan.
- Tidak ada akun pengguna, data sinkronisasi lintas perangkat, atau bukti penggunaan produksi yang boleh diasumsikan.

## Product Principles

- Akses cepat ke kebutuhan ibadah utama tanpa proses akun atau onboarding yang berat.
- Pengalaman membaca dan mendengarkan harus nyaman pada ponsel serta tetap lengkap pada desktop.
- Preferensi personal disimpan secara lokal dan dipulihkan secara aman.
- Kegagalan jaringan tidak boleh menghilangkan data yang sebelumnya sudah tersimpan.
- Fitur tambahan tidak boleh mengganggu fokus utama pada jadwal sholat dan pembacaan Al-Qur'an.

## Accessibility & Inclusion

- Kontrol audio harus dapat digunakan dengan sentuhan, mouse, dan keyboard.
- Status volume, mute, dan kecepatan harus memiliki label yang dapat dipahami pembaca layar.
- Target sentuh harus nyaman untuk penggunaan satu tangan di ponsel.
