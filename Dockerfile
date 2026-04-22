FROM php:8.3-fpm-alpine

# 1. Install system dependencies & PHP Extensions
RUN apk add --no-cache \
    zip unzip curl mysql-client git bash \
    libpng-dev libzip-dev icu-dev libxml2-dev

RUN docker-php-ext-install pdo pdo_mysql bcmath gd intl zip

# 2. Ambil Composer Binary dari image resmi (PENTING!)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# 3. Copy file config dulu (untuk optimasi cache layer)
# Kita copy folder packages juga agar composer bisa nemu path-nya
COPY composer.json composer.lock ./
COPY packages/ ./packages/ 

# 4. Jalankan install dependencies
# Karena kita di PROD, gunakan --no-dev dan --optimize-autoloader
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction

# 5. Copy sisa file project dan atur permission
COPY --chown=www-data:www-data . .

# 6. Finalisasi Composer Autoload & Folder Permissions
RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

EXPOSE 9000

# Perbaikan di CMD: Pastikan vendor sudah siap
CMD ["sh", "-c", "php artisan config:cache && php artisan route:cache && php-fpm"]