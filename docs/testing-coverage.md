# Cobertura de Pruebas

## Estado actual

- Comando usado: `$env:XDEBUG_MODE='coverage'; php artisan test --coverage`
- Resultado de la suite: `8` pruebas exitosas, `14` aserciones
- Cobertura total actual sobre `app/`: `2.0%`

La cobertura total es baja porque `phpunit.xml` incluye todo el directorio `app/`, mientras que el proyecto solo cuenta con unas pocas pruebas activas.

## Inventario de pruebas

| Archivo | Tipo | Objetivo | Dobles de prueba |
| --- | --- | --- | --- |
| `tests/Unit/ExampleTest.php` | Unit | Verificar ejemplo base de PHPUnit | Ninguno |
| `tests/Feature/ExampleTest.php` | Feature | Verificar respuesta HTTP exitosa de `/` | Ninguno |
| `tests/Feature/AuthControllerMockTest.php` | Feature | Validar `loginAdmin()` del controlador | `stub` y `mock` |
| `tests/Feature/SecurityAccessTest.php` | Feature | Validar restricciones de acceso y seguridad de endpoints | `fake` |

## Cobertura observada

Las rutas y componentes con cobertura visible actualmente son:

- `AuthController`: cobertura parcial
- `SubmissionController`: cobertura parcial
- `AdvertisementController`: cobertura parcial
- `User`: cobertura parcial
- clases auxiliares de consola agregadas para estabilizar testing

Las áreas con cobertura nula o prácticamente nula incluyen:

- controladores administrativos restantes
- controladores API de listados
- requests de validación
- resources
- modelos de dominio
- servicios de autenticación
- renderer de documentos

## Interpretación

El valor `2.0%` no significa que las pruebas no funcionen. Significa que la mayor parte del código de `app/` todavía no está ejercitada por pruebas automáticas.

Hoy las pruebas existentes se concentran en:

- acceso a rutas protegidas
- respuestas HTTP básicas
- un flujo controlado con `stub` y `mock` en autenticación

## Cómo volver a medir la cobertura

En PowerShell:

```powershell
$env:XDEBUG_MODE='coverage'
php artisan test --coverage
```

Si se quiere un reporte HTML:

```powershell
$env:XDEBUG_MODE='coverage'
php artisan test --coverage-html coverage
```

## Recomendaciones

Para aumentar la cobertura conviene priorizar:

1. pruebas unitarias de `Services/Auth/AdminLogin`, `CoordinatorLogin` y `StudentLogin`
2. pruebas feature para controladores administrativos
3. pruebas de requests de validación
4. pruebas de acciones y recursos serializados

## Nota técnica

Para que la suite pudiera ejecutarse correctamente en SQLite de testing, se corrigieron incompatibilidades en migraciones y se añadió una adaptación de consola para comandos lazy-loaded usados durante pruebas.
