FROM php:8.4-cli

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    git curl zip unzip libpng-dev libonig-dev libxml2-dev libzip-dev libcurl4-openssl-dev \
    libjpeg62-turbo-dev libwebp-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-jpeg --with-webp --with-freetype \
    && docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd zip curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copiar dependencias primero (cache de capas)
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

COPY package.json package-lock.json ./
RUN npm ci

# Copiar el resto del proyecto
COPY . .

# Build assets
RUN npm run build

# Permisos
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8080

CMD php artisan config:clear ; \
    php artisan config:cache ; \
    php artisan route:cache ; \
    php artisan view:cache ; \
    php artisan migrate --force ; \
    php artisan db:seed --force ; \
    php artisan storage:link --force ; \
    php artisan pdf:convert-fonts ; \
    php artisan serve --host=0.0.0.0 --port=8080
