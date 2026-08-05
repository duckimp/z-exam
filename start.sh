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

# 2. Update .env otomatis dengan IP terdeteksi
echo "🔧 Memperbarui .env untuk IP: $IP_ADDR..."
sed -i "s|^APP_URL=.*|APP_URL=http://$IP_ADDR:8000|" .env
sed -i "s|^SESSION_DOMAIN=.*|SESSION_DOMAIN=$IP_ADDR|" .env
sed -i "s|^SESSION_SECURE_COOKIE=.*|SESSION_SECURE_COOKIE=false|" .env
sed -i "s|^SESSION_SAME_SITE=.*|SESSION_SAME_SITE=lax|" .env
php artisan config:clear > /dev/null 2>&1
echo "✅ .env diperbarui & config cache dibersihkan"

# 3. Memastikan Symbolic Link Storage Aktif
if [ ! -L "public/storage" ] && [ ! -d "public/storage" ]; then
    echo "🔗 Mendeteksi symlink storage hilang. Membuat symlink baru..."
    php artisan storage:link
else
    echo "✅ Symlink storage aktif."
fi

echo ""

# 4. Menjalankan Build Asset (Vite)
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

# 5. Jalankan Laravel Octane dengan 4 Worker (bind ke 0.0.0.0 agar bisa diakses dari jaringan lain)
php artisan octane:start --workers=4 --host=0.0.0.0 --port=8000
