# Skill.md

Dokumen ini mendefinisikan struktur, standar, dan panduan untuk membuat, mendokumentasikan, dan menggunakan skill dalam sistem agen ini.

---

## Apa Itu Skill?

Skill adalah unit kemampuan modular yang memberikan instruksi kepada agen tentang cara menangani jenis tugas tertentu. Setiap skill dikemas dalam satu file `SKILL.md` yang berisi konteks, langkah kerja, dan standar output.

Skill bukan kode — skill adalah **panduan tertulis** yang dibaca agen sebelum menjalankan tugas.

---

## Mengapa Skill Penting?

- **Konsistensi** — Agen selalu mengikuti standar yang sama untuk tugas sejenis
- **Modularitas** — Skill dapat dikombinasikan untuk tugas yang lebih kompleks
- **Kemudahan pemeliharaan** — Perubahan perilaku cukup dilakukan di satu tempat
- **Onboarding cepat** — Anggota tim baru memahami kapabilitas sistem dengan membaca skill

---

## Daftar Skill yang Tersedia

### Skill Dokumen

| Nama | Deskripsi Singkat | Lokasi |
|---|---|---|
| `docx` | Membuat dan memanipulasi file Word (.docx) | `/mnt/skills/public/docx/SKILL.md` |
| `pdf` | Membaca, membuat, menggabungkan, dan mengisi PDF | `/mnt/skills/public/pdf/SKILL.md` |
| `pdf-reading` | Strategi khusus untuk membaca konten dari PDF | `/mnt/skills/public/pdf-reading/SKILL.md` |
| `xlsx` | Bekerja dengan spreadsheet Excel | `/mnt/skills/public/xlsx/SKILL.md` |
| `pptx` | Membuat dan memodifikasi presentasi PowerPoint | `/mnt/skills/public/pptx/SKILL.md` |

### Skill Teknis

| Nama | Deskripsi Singkat | Lokasi |
|---|---|---|
| `frontend-design` | Membangun antarmuka web berkualitas tinggi | `/mnt/skills/public/frontend-design/SKILL.md` |
| `file-reading` | Router untuk membaca berbagai jenis file yang diunggah | `/mnt/skills/public/file-reading/SKILL.md` |

### Skill Sistem

| Nama | Deskripsi Singkat | Lokasi |
|---|---|---|
| `product-self-knowledge` | Fakta akurat tentang produk Anthropic | `/mnt/skills/public/product-self-knowledge/SKILL.md` |
| `skill-template` | Kerangka dasar untuk membuat skill baru | `/mnt/skills/user/skill-template/SKILL.md` |
| `skill-creator` | Membuat, mengedit, dan mengevaluasi skill | `/mnt/skills/examples/skill-creator/SKILL.md` |

---

## Struktur File Skill

Setiap skill mengikuti struktur standar berikut:

```
---
name: nama-skill
description: >
  Deskripsi singkat kapan skill ini digunakan.
  Dioptimalkan untuk trigger detection oleh agen.
---

# Nama Skill
Ringkasan tujuan skill.

## Tujuan
## Konteks & Latar Belakang
## Panduan Penggunaan
  ### Langkah 1 — Persiapan
  ### Langkah 2 — Proses Utama
  ### Langkah 3 — Validasi Output
## Format Output
## Contoh
## Batasan
## Referensi & Sumber Daya

*Versi | Tanggal*
```

---

## Cara Membaca Skill (untuk Agen)

Sebelum menjalankan tugas apapun yang melibatkan pembuatan atau manipulasi file, agen **wajib** membaca skill yang relevan terlebih dahulu menggunakan perintah `view`. Ini bukan opsional — skill mendefinisikan batasan lingkungan, library yang tersedia, dan standar output yang tidak ada dalam data pelatihan.

Urutan prioritas pemilihan skill:

1. Cocokkan jenis file output yang diminta (docx → skill docx, pdf → skill pdf)
2. Cocokkan jenis operasi (membaca file → skill file-reading atau pdf-reading)
3. Kombinasikan beberapa skill jika tugas melibatkan lebih dari satu jenis output

---

## Cara Membuat Skill Baru

### 1. Tentukan Ruang Lingkup

Sebelum menulis, jawab pertanyaan ini:

- Masalah spesifik apa yang diselesaikan skill ini?
- Kapan agen harus menggunakan skill ini (dan kapan tidak)?
- Apakah ada skill yang sudah ada yang bisa diperluas?

### 2. Gunakan Template

Salin `/mnt/skills/user/skill-template/SKILL.md` sebagai titik awal. Jangan buat dari nol — template memastikan konsistensi struktur.

### 3. Tulis Deskripsi yang Kuat

Bagian `description` di frontmatter adalah yang paling kritis. Deskripsi ini digunakan agen untuk memutuskan apakah skill ini relevan. Pastikan:

- Menyebutkan kata kunci yang kemungkinan muncul dalam permintaan pengguna
- Menyebutkan format file atau nama alat yang relevan
- Menyatakan dengan jelas kapan skill **tidak** boleh digunakan

### 4. Uji Skill

Setelah skill dibuat, uji dengan beberapa skenario:

- Apakah agen memilih skill ini untuk permintaan yang tepat?
- Apakah instruksi dalam skill menghasilkan output yang konsisten?
- Apakah ada edge case yang belum ditangani?

### 5. Simpan di Lokasi yang Tepat

| Jenis Skill | Lokasi |
|---|---|
| Skill publik (semua pengguna) | `/mnt/skills/public/nama-skill/SKILL.md` |
| Skill pengguna (personal) | `/mnt/skills/user/nama-skill/SKILL.md` |
| Skill contoh / referensi | `/mnt/skills/examples/nama-skill/SKILL.md` |

---

## Standar Kualitas Skill

Skill yang baik memenuhi kriteria berikut:

- **Spesifik** — Fokus pada satu domain atau jenis tugas
- **Dapat ditindaklanjuti** — Instruksi cukup jelas untuk diikuti tanpa ambiguitas
- **Ringkas** — Tidak lebih panjang dari yang diperlukan
- **Teruji** — Telah divalidasi dengan setidaknya 3 skenario nyata
- **Terpelihara** — Menyertakan versi dan tanggal pembaruan

---

## Batasan

- Skill tidak dapat mengeksekusi kode — skill hanya memberikan panduan
- Skill tidak memiliki akses ke internet atau sistem eksternal secara langsung
- Perubahan pada skill hanya berlaku untuk sesi setelah perubahan dibuat
- Skill di direktori `public` dan `examples` bersifat read-only

---

*Versi: 1.0 | Terakhir diperbarui: Mei 2026*
