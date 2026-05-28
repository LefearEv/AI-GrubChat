# Roadmap.md

Dokumen ini menggambarkan rencana pengembangan sistem, fitur yang akan datang, dan prioritas jangka pendek hingga jangka panjang.

---

## Visi

Membangun ekosistem agen AI yang andal, modular, dan mudah digunakan — yang mampu membantu individu maupun tim menyelesaikan pekerjaan kompleks dengan lebih cepat dan lebih cerdas.

---

## Status Saat Ini

| Komponen | Status |
|---|---|
| Agen inti | ✅ Aktif |
| Skill dasar (docx, pdf, xlsx, pptx) | ✅ Tersedia |
| Integrasi web search | ✅ Aktif |
| Memory lintas sesi | 🔄 Beta |
| MCP Connector | 🔄 Sebagian aktif |
| Dashboard monitoring | ⏳ Direncanakan |

---

## Fase Pengembangan

### Fase 1 — Fondasi *(Selesai)*

Membangun infrastruktur dasar agen dan kemampuan inti.

- Integrasi model bahasa utama
- Skill pembuatan dan pembacaan dokumen (PDF, DOCX, XLSX, PPTX)
- Kemampuan eksekusi bash dan pengelolaan file
- Antarmuka percakapan dasar

---

### Fase 2 — Perluasan Kapabilitas *(Sedang Berjalan — Q2 2026)*

Meningkatkan kemampuan agen dengan integrasi dan otomasi yang lebih kaya.

- Integrasi MCP connector (Google Drive, Slack, Notion, Asana)
- Memory lintas sesi untuk personalisasi jangka panjang
- Skill lanjutan: analisis data, visualisasi, dan laporan otomatis
- Dukungan multi-bahasa yang lebih baik
- Penanganan file gambar dan audio

---

### Fase 3 — Orkestrasi Multi-Agen *(Q3 2026)*

Memungkinkan beberapa agen bekerja bersama untuk tugas yang lebih kompleks.

- Arsitektur multi-agen dengan pembagian peran yang jelas
- Agen spesialis: riset, penulisan, analitik, eksekusi teknis
- Pipeline tugas otomatis berbasis trigger
- Mekanisme evaluasi dan koreksi antar-agen
- Logging dan audit trail terpusat

---

### Fase 4 — Produksi & Skalabilitas *(Q4 2026)*

Memastikan sistem siap digunakan secara luas dengan performa dan keamanan tinggi.

- Dashboard monitoring dan observabilitas
- Rate limiting dan manajemen kuota penggunaan
- Enkripsi end-to-end untuk data sensitif
- Dukungan deployment on-premise
- Dokumentasi lengkap untuk developer dan pengguna akhir

---

### Fase 5 — Ekosistem Terbuka *(2027)*

Membuka sistem untuk kontribusi eksternal dan integrasi pihak ketiga.

- Marketplace skill komunitas
- SDK untuk developer membangun connector kustom
- Program mitra dan sertifikasi
- API publik dengan dokumentasi penuh

---

## Prioritas Saat Ini (Sprint Aktif)

1. Stabilisasi memory lintas sesi
2. Penambahan 3 MCP connector baru (Notion, Linear, GitHub)
3. Peningkatan akurasi skill pembacaan PDF dengan layout kompleks
4. Pembuatan template Roadmap, Agent, dan Skill untuk onboarding tim

---

## Backlog (Belum Diprioritaskan)

- Dukungan voice input/output
- Mode offline dengan model lokal
- Integrasi kalender dan reminder otomatis
- Plugin browser untuk penggunaan langsung di web
- Agen berbasis persona yang dapat dikustomisasi

---

## Cara Berkontribusi

Jika kamu ingin mengusulkan fitur atau melaporkan masalah:

1. Buat issue baru di repositori proyek
2. Gunakan label yang sesuai: `feature-request`, `bug`, `improvement`
3. Sertakan konteks yang cukup agar tim dapat menindaklanjuti

---

*Versi: 1.0 | Terakhir diperbarui: Mei 2026*
