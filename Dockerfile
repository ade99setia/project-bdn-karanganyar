FROM php:8.3-fpm-alpine

# 1. Install system dependencies & PHP Extensions
# Layer ini sangat berat, tapi karena posisinya di atas, 
# Docker akan men-cache-nya secara permanen selama kamu tidak menambah extensi baru.
RUN apk add --no-cache \
    zip unzip curl mysql-client git bash \
    libpng-dev libzip-dev icu-dev libxml2-dev

RUN docker-php-ext-install pdo pdo_mysql bcmath gd intl zip

WORKDIR /var/www/html

# 2. Buat folder struktur DULU sebelum copy file
# Kita letakkan di atas agar tidak diulang-ulang oleh Docker setiap kali ada kode berubah
RUN mkdir -p bootstrap/cache \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs

# 3. Salin SEMUA file sekaligus atur owner-nya dalam SATU LANGKAH
# Trik '--chown' ini jauh lebih kilat daripada menjalankan 'chown -R' di layer terpisah
COPY --chown=www-data:www-data . .

# 4. Hapus .env dan set permission khusus folder storage/bootstrap
# Karena file sudah milik www-data, kita cukup atur chmod untuk folder yang butuh akses tulis
RUN rm -f .env \
    && chmod -R 775 storage bootstrap/cache

USER www-data

EXPOSE 9000

# Jalankan pembersihan cache saat container menyala (runtime)
CMD ["sh", "-c", "php artisan config:clear && php artisan package:discover --ansi && php-fpm"]