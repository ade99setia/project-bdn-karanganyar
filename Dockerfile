# Memakai basis PHP 8.3 FPM yang ringan (Alpine)
FROM php:8.3-fpm-alpine

# Install dependensi sistem Linux dasar, Node.js, dan NPM
RUN apk add --no-cache \
    zip \
    unzip \
    curl \
    nodejs \
    npm

# Install ekstensi PHP yang wajib untuk Laravel & MySQL
RUN docker-php-ext-install pdo pdo_mysql bcmath

# Copy Composer dari image resminya agar langsung bisa dipakai
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Tentukan folder kerja utama di dalam kontainer
WORKDIR /var/www/html

# Salin SEMUA file project terlebih dahulu agar npm run build bisa membaca source code
COPY . .

# Install dependency Laravel dan build asset
RUN composer install --no-interaction --prefer-dist --optimize-autoloader \
    && npm install \
    && npm run build

# Set permission folder storage dan bootstrap/cache
RUN chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# Gunakan user non-root
USER www-data