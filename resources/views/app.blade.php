<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Grupo Secon</title>
    <script>
        // Apply saved theme before paint to avoid flash
        (function() {
            var t = localStorage.getItem('secon-theme') || 'dark';
            if (t === 'dark') document.documentElement.classList.add('dark');
        })();
    </script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
</head>
<body class="min-h-screen bg-background text-foreground antialiased">
    @inertia
</body>
</html>
