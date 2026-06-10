# Sistema Dual

Proyecto Laravel para administrar alumnos, coordinadores, periodos, evidencias, reportes, entregas, anuncios y documentos del programa dual.

## Requisitos

- PHP 8.2 o superior
- Composer
- Node.js y npm
- MySQL/MariaDB
- XAMPP, Laragon o un servidor equivalente

## Instalacion inicial

1. Instalar dependencias de PHP:

```bash
composer install
```

2. Instalar dependencias de frontend:

```bash
npm install
```

3. Crear el archivo de ambiente:

```bash
copy .env.example .env
```

4. Generar la llave de Laravel:

```bash
php artisan key:generate
```

5. Configurar la base de datos en `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dual
DB_USERNAME=root
DB_PASSWORD=
```

6. Crear tablas y datos demo:

```bash
php artisan migrate --seed
```

Si se quiere reiniciar la base desde cero:

```bash
php artisan migrate:fresh --seed
```

## Usuarios demo

El seeder crea estos accesos de prueba. Todos usan password `password`.

```text
Admin:
admin@dual.test

Coordinadores:
coordinador.industrial@dual.test
coordinador.sistemas@dual.test

Alumnos:
22010001
22010002
22010003
22010004
```

## Levantar el proyecto

Servidor de Laravel:

```bash
php artisan serve
```

Frontend con Vite:

```bash
npm run dev
```

Compilar frontend para produccion:

```bash
npm run build
```

## Comandos PHP y Artisan mas usados

Ver rutas registradas:

```bash
php artisan route:list
```

Filtrar rutas de API:

```bash
php artisan route:list | findstr api
```

Ejecutar migraciones pendientes:

```bash
php artisan migrate
```

Reiniciar migraciones y cargar seeders:

```bash
php artisan migrate:fresh --seed
```

Ejecutar solo los seeders:

```bash
php artisan db:seed
```

Ejecutar solo el seeder demo:

```bash
php artisan db:seed --class=DemoDataSeeder
```

Limpiar cache general:

```bash
php artisan optimize:clear
```

Limpiar cache de configuracion:

```bash
php artisan config:clear
```

Limpiar cache de rutas:

```bash
php artisan route:clear
```

Limpiar cache de vistas:

```bash
php artisan view:clear
```

Crear enlace publico para archivos de `storage`:

```bash
php artisan storage:link
```

Ejecutar pruebas:

```bash
php artisan test
```

Verificar sintaxis de un archivo PHP:

```bash
php -l app/Models/User.php
```

Regenerar autoload de Composer cuando se agregan clases nuevas:

```bash
composer dump-autoload
```

## Comandos utiles para desarrollo

Crear un modelo:

```bash
php artisan make:model NombreModelo
```

Crear una migracion:

```bash
php artisan make:migration create_nombre_tabla_table
```

Crear un controlador:

```bash
php artisan make:controller NombreController
```

Crear un request de validacion:

```bash
php artisan make:request NombreRequest
```

Crear un seeder:

```bash
php artisan make:seeder NombreSeeder
```

## Notas para subir al servidor

- Copiar el proyecto al servidor.
- Ejecutar `composer install --no-dev --optimize-autoloader`.
- Configurar `.env` con la base de datos real.
- Ejecutar `php artisan key:generate` si no existe `APP_KEY`.
- Ejecutar `php artisan migrate --seed` para crear tablas y datos demo.
- Ejecutar `php artisan storage:link` si se usaran archivos publicos.
- Ejecutar `npm run build` y subir/generar los assets de produccion.
- Revisar permisos de `storage` y `bootstrap/cache`.
