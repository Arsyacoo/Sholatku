import Link from 'next/link';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';

export function PrivacyPolicyContent() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-8">
      <div className="flex items-start gap-3">
        <Link
          href="/settings"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-surface-100 text-slate-600 transition-colors hover:bg-surface-200 dark:bg-surface-800 dark:text-slate-300"
          aria-label="Kembali ke Pengaturan"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-300">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Sholatku
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Kebijakan Privasi
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Terakhir diperbarui: 9 September 2026</p>
        </div>
      </div>

      <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm leading-relaxed text-primary-950 dark:border-primary-900 dark:bg-primary-950/40 dark:text-primary-100">
        Sholatku tidak menggunakan akun pengguna. Fitur utama berjalan dengan data yang tersimpan di perangkat;
        beberapa fitur online mengirim data teknis yang diperlukan ke server Sholatku atau penyedia konten.
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Data yang tersimpan di perangkat</h2>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Sholatku menyimpan data berikut di local storage atau IndexedDB perangkat untuk mempertahankan pilihan dan
          mendukung pengalaman offline:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          <li>Nama kota, koordinat, zona waktu, dan apakah lokasi dipilih otomatis.</li>
          <li>Metode hisab, madhab, penyesuaian menit, tema, dan format waktu.</li>
          <li>Pilihan pengingat sholat dan preferensi Ramadan.</li>
          <li>Surat terakhir dibaca, favorit, bookmark ayat, serta preferensi tampilan dan audio Al-Qur&apos;an.</li>
          <li>Jadwal sholat dan data surat Al-Qur&apos;an yang dipilih untuk cache offline.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Data yang dikirim saat fitur online digunakan</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          <li>Jadwal sholat mengirim koordinat, zona waktu, metode hisab, madhab, dan tanggal ke BFF Sholatku atau layanan AlAdhan sebagai fallback.</li>
          <li>Pencarian atau deteksi wilayah dapat mengirim query pencarian atau koordinat ke Nominatim OpenStreetMap.</li>
          <li>Permintaan surat dan pencarian ayat dapat dikirim ke BFF Sholatku, yang mengambil data dari penyedia Al-Qur&apos;an yang digunakan aplikasi.</li>
          <li>Audio murottal dimuat dari URL penyedia audio yang ada pada data surat atau fallback aplikasi.</li>
          <li>Server dan penyedia internet secara alami dapat menerima alamat IP, waktu permintaan, dan metadata jaringan standar. Sholatku tidak mengaitkannya dengan akun pengguna.</li>
        </ul>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Request online menggunakan HTTPS. Perilaku penyimpanan log dan retensi dari layanan pihak ketiga mengikuti kebijakan masing-masing layanan.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Lokasi</h2>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Anda dapat memilih kota secara manual. Jika memilih deteksi otomatis, browser atau WebView meminta lokasi
          perangkat dan aplikasi menggunakannya untuk mencari wilayah serta menghitung jadwal dan arah kiblat.
          Aplikasi tidak meminta izin lokasi latar belakang.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Notifikasi dan audio</h2>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Pengingat sholat dibuat sebagai notifikasi lokal pada perangkat. Sholatku tidak menggunakan push notification
          server. Audio hanya diputar ketika Anda memilihnya dan tidak direkam oleh aplikasi.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Analitik, iklan, dan akun</h2>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Versi ini tidak menyertakan SDK analitik, crash reporting, iklan, pembayaran, atau akun pengguna. Tidak ada
          data penggunaan yang dijual. Pernyataan ini harus ditinjau ulang apabila dependensi atau layanan berubah.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Retensi dan penghapusan</h2>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Data lokal tetap ada sampai Anda menghapus cache Al-Qur&apos;an melalui fitur offline, menghapus data aplikasi,
          atau menghapus aplikasi. Karena tidak ada akun, tidak ada data akun terpusat yang dapat diminta untuk dihapus.
          Permintaan ke server atau penyedia dapat memiliki retensi sesuai kebijakan mereka.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Perubahan dan kontak</h2>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Kebijakan ini dapat diperbarui ketika fitur, penyedia, atau persyaratan distribusi berubah. Kontak resmi
          untuk pertanyaan privasi belum ditetapkan dalam repository ini dan harus diisi sebelum listing Google Play.
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
        >
          Kelola pengaturan lokal
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </article>
  );
}
