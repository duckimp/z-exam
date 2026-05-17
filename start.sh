#!/bin/bash

echo "=================================================="
echo "          Z-EXAM SERVER INITIALIZER               "
echo "              ANDI MARIONO (2026)                 "
echo "=================================================="
echo ""

# 1. Mendeteksi IP Address Lokal
echo "🔍 Mendeteksi IP Address Server..."
IP_ADDR=$(hostname -I | awk '{print $1}')

if [ -z "$IP_ADDR" ]; then
    echo "⚠️  Tidak mendeteksi IP jaringan aktif. Menggunakan localhost."
    IP_ADDR="127.0.0.1"
else
    echo "✅ IP Address ditemukan: $IP_ADDR"
fi

# 2. Memastikan Symbolic Link Storage Aktif
if [ ! -L "public/storage" ] && [ ! -d "public/storage" ]; then
    echo "🔗 Mendeteksi symlink storage hilang. Membuat symlink baru..."
    php artisan storage:link
else
    echo "✅ Symlink storage aktif."
fi

echo ""

# 2. Menjalankan Build Asset (Vite)
echo "📦 Mengompilasi dan mengoptimalkan asset frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Asset berhasil dikompilasi!"
else
    echo "❌ Terjadi kesalahan saat kompilasi asset. Tetap melanjutkan server..."
fi

echo ""
echo "=================================================="
echo "             SERVER SIAP DIGUNAKAN!"
echo " -------------------------------------------------"
echo "  👉 Ujian Siswa  : http://$IP_ADDR:8000"
echo "  👉 Proktor/Admin: http://$IP_ADDR:8000/login    "
echo "            Created by : Andi Mariono             "
echo "=================================================="
echo ""
echo "Sukses selalu"
echo ""

# 3. Jalankan PHP Artisan Serve
php artisan serve --host=$IP_ADDR --port=8000
