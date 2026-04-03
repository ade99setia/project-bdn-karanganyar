FROM php:8.3-fpm-alpine

# 1. Install system dependencies & PHP Extensions
RUN apk add --no-cache \
    zip unzip curl mysql-client git bash \
    libpng-dev libzip-dev icu-dev libxml2-dev

RUN docker-php-ext-install pdo pdo_mysql bcmath gd intl zip

WORKDIR /var/www/html

# 2. Salin SEMUA file dari lokal ke image
# Ini akan menyalin folder vendor/laravel/wayfinder yang sudah kamu edit
COPY . .

# 3. Hapus .env lokal agar tidak bocor ke image
RUN rm -f .env

# 4. Buat folder struktur & Fix Permissions
RUN mkdir -p bootstrap/cache \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

USER www-data

EXPOSE 9000

# Jalankan pembersihan cache saat container menyala (runtime)
CMD ["sh", "-c", "php artisan config:clear && php artisan package:discover --ansi && php-fpm"]