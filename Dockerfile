# ========================
# Stage 1: Base PHP + ekstensi + sistem
# ========================
FROM php:8.3-fpm-alpine AS base

# Install paket sistem + Node.js + npm + mysql client + git + bash
RUN apk update && apk add --no-cache \
    zip \
    unzip \
    curl \
    nodejs \
    npm \
    mysql-client \
    git \
    bash

# Install ekstensi PHP
RUN docker-php-ext-install pdo pdo_mysql bcmath

# Copy Composer dari image resmi
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# ========================
# Stage 2: Dependencies (Composer + NPM) → cache layer
# ========================
FROM base AS deps

# Copy file dependency dulu
COPY composer.json composer.lock ./
# jika pakai npm
COPY package.json package-lock.json ./   

# Install PHP & Node dependencies
RUN composer install --no-interaction --prefer-dist --optimize-autoloader \
    && npm install

# ========================
# Stage 3: Final image
# ========================
FROM base AS final

WORKDIR /var/www/html

# Copy hasil deps
COPY --from=deps /var/www/html/vendor ./vendor
COPY --from=deps /var/www/html/node_modules ./node_modules

# Copy seluruh source code
COPY . .

# Build frontend assets (npm run build)
RUN npm run build

# Set permission folder writable
RUN chmod -R 775 storage bootstrap/cache writable \
    && chown -R www-data:www-data storage bootstrap/cache writable

# Gunakan user non-root
USER www-data