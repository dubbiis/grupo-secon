FROM php:8.4-cli

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    git curl zip unzip libpng-dev libonig-dev libxml2-dev libzip-dev \
    && docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd zip \
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

EXPOSE 8000

CMD echo "=== [1/7] config:cache ===" \
    && php artisan config:cache \
    && echo "=== [2/7] route:cache ===" \
    && php artisan route:cache \
    && echo "=== [3/7] view:cache ===" \
    && php artisan view:cache \
    && echo "=== [4/7] migrate ===" \
    && php artisan migrate --force \
    && echo "=== [5/7] seed prompts ===" \
    && php artisan db:seed --class=PromptTemplateSeeder --force \
    && echo "=== [6/7] storage:link ===" \
    && php artisan storage:link --force \
    && echo "=== [7/7] servidor en :8000 ===" \
    && php artisan serve --host=0.0.0.0 --port=8000
