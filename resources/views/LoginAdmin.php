<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="app-base-path" content="{{ rtrim(request()->getBaseUrl(), '/') }}">
    <title>Educacion Dual</title>
     @viteReactRefresh
     @vite('resources/js/App.jsx')
</head>
<body>
    <div id="root"></div>
</body>
</html>
