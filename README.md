# Sip the Warmth

Prototipe web pelacak tumbler dengan peta, GPS, pencarian alamat, dan navigasi rute real-time.

## Isi
- `index.html`, `style.css`, `app.js`, folder `assets/` (logo, favicon, gambar botol)
- Peta: Leaflet + tile OpenStreetMap (+ citra satelit Esri)
- Alamat: Nominatim (cari alamat dan nama jalan)
- Rute dan petunjuk belok: OSRM (routing.openstreetmap.de)
- Semua layanan di atas butuh internet dan tidak butuh API key.

## Menjalankan
Buka folder di VS Code, klik kanan `index.html` > Open with Live Server (atau `python -m http.server 8000`).

GPS hanya jalan di `https://` atau `localhost`. Untuk dicoba di HP, deploy ke GitHub Pages (otomatis HTTPS).

## Cara kerja
- Nyalakan **Lokasi saya (GPS)**. Pertama kali aktif, data contoh dipindahkan ke sekitar posisi Anda.
- **Arah**: pilih barang atau cari alamat, pilih moda, lalu **Mulai navigasi**. Rute dihitung ulang otomatis jika keluar jalur.
- Tanpa GPS, ketuk peta untuk menentukan titik awal.
- Posisi tag tumbler adalah data contoh / input manual ("Tandai di peta", "Taruh di posisi saya"). Pelacakan tag asli lewat Find My / Find Hub tidak bisa diakses dari website.
- Palet: #1A2A4F, #F7A5A5, #FFDBB6, #FFF2EF.
