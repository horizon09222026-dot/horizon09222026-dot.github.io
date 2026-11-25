# horizonDevelopment · catálogo de apps

Sitio público (GitHub Pages): **https://horizon09222026-dot.github.io/**

Página estática (HTML + CSS + JavaScript moderno, sin servidor ni dependencias). Muestra las apps, sus capturas, el botón de Patreon y el contacto. En español e inglés, tema claro/oscuro, adaptable a celulares, tabletas y computadoras.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La página. |
| `data/apps.json` | **El catálogo.** Textos (es/en), colores, estado y enlaces de cada app. |
| `assets/js/config.js` | Enlace de Patreon, correo y URL del sitio. |
| `assets/js/main.js` · `i18n.js` | Lógica (dibuja las apps desde el JSON, carrusel, visor, idioma, tema) y textos del sitio. |
| `assets/css/styles.css` | Diseño y animaciones. |
| `assets/img/apps/<app>/` | Ícono, banner y capturas en WebP (`es-1.webp` … `es-7.webp`). |
| `tools/optimizar-imagenes.js` | Copia y comprime las imágenes desde las carpetas de cada app. |
| `tools/generar-marca.js` | Genera `icon-192/512.png` y `og-image.png` (vista previa al compartir). |
| `mundo-chispa/privacidad/` | Política de privacidad de Mundo Chispa. |

## Tareas frecuentes

- **Activar Patreon:** pega el enlace en `PATREON_URL` de `assets/js/config.js`.
- **Una app salió en Google Play:** en `data/apps.json` cambia su `"status"` de `"soon"` a `"live"` (aparece el botón "Disponible en Google Play").
- **Agregar una app nueva:** copia un bloque en `data/apps.json`, pon sus imágenes en `assets/img/apps/<id>/` (o agrégala a `tools/optimizar-imagenes.js` y ejecuta `node tools/optimizar-imagenes.js`), y añade su enlace en el pie de `index.html`.
- **Actualizar capturas:** vuelve a generar las de la app y ejecuta `node tools/optimizar-imagenes.js`.
- Tras cambiar CSS o JS, sube el número `?v=1` en `index.html` para que los visitantes no vean la versión vieja en caché.

## Enlaces desde las apps

- Catálogo: `https://horizon09222026-dot.github.io/?from=<id>` (ids: `gloopy`, `mundo-chispa`, `glucodiario`). Con `from` aparece "¡Gracias por usar …!" y esa app se muestra al final, para promocionar las otras.
- Directo a una app: `https://horizon09222026-dot.github.io/#app-<id>`
- Idioma: `?lang=es` o `?lang=en` (si no, usa el idioma del teléfono).
- **Mundo Chispa (app infantil):** el enlace debe ir dentro de la Zona de padres, detrás del candado, por la política de Familias de Google Play.

## Probar en la computadora

```
python -m http.server 8790
```
y abrir http://localhost:8790 (abrir el archivo con doble clic no carga el catálogo, porque `fetch` necesita un servidor).
