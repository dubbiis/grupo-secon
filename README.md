# Grupo Secon

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Laravel 13 |
| Bridge | Inertia.js 2.x |
| Frontend | React 19 |
| Animaciones | Framer Motion / motion |
| CSS | Tailwind CSS 4 |
| Build | Vite |
| Componentes | shadcn/ui + animate-ui |
| BD local | SQLite |
| BD producción | MySQL (secon_db) |
| Deploy | Docker + EasyPanel |

## Desarrollo local

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm run dev
php artisan serve
```

## Deploy

```bash
git add . && git commit -m "descripción" && git push origin master
```
Push a `master` dispara deploy automático en EasyPanel.
