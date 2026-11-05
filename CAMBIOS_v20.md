> **Aviso:** v20 queda sustituida por v21 (ver `CAMBIOS_v21.md`). La paleta de v20 se aplicó por error a la web pública; en v21 la web recupera su estilo original y la nueva paleta solo afecta a los paneles.

# MUK Talent · Cambios v20 · Diseño unificado, nueva paleta y estado "en línea"

## 1. Paleta única (web + paneles, escritorio y móvil)
| Rol | Color |
|---|---|
| Navegación y elementos principales | Elegant Black `#171717` |
| Textos y elementos secundarios | Soft Black `#292929` |
| Fondo principal y tarjetas | Pure White `#FFFFFF` |
| Fondos alternativos | Warm Ivory `#F7F5F0` |
| Pequeños detalles y acentos | Champagne `#B7A078` |
| Líneas, bordes y separadores | Silver Grey `#D9D9D6` |

- Se aplica a la web de Education, la web y el portal de Healthcare, el panel de administración, el espacio del equipo, Global Passport, las tarjetas `/nombre`, el portafolio y los enlaces del pipeline.
- Los colores de estado (rojo = error, ámbar = aviso, verde = correcto o en línea) se mantienen para que no cambie su significado.
- No se han tocado los logos de terceros (certificados, marcas de socios, WhatsApp) ni las fotografías.
- Logos de MUK (SVG y `logo-muk-talent.png`), avatar del asistente e imagen para redes (`og-image.jpg`) recoloreados.
- `tools/palette-v20.mjs` reaplica la paleta y la comprueba: `node tools/palette-v20.mjs --check` (debe decir 0 archivos).

## 2. Mismo diseño que Healthcare en todos los paneles de Education
Archivo nuevo `assets/brand/muk-unified.css`, que siempre se carga en último lugar (`admin-src/unified-theme.js`). Solo cambia el aspecto. Los datos, permisos y funciones siguen igual.
- Tipografía del portal Healthcare: Fraunces para los títulos y las cifras, e Instrument Sans para el texto.
- Barra lateral Elegant Black, con la sección activa marcada en Champagne.
- Encabezado con título serif y línea separadora.
- Banner de bienvenida negro con el aro Champagne.
- Indicadores (KPI) con etiqueta en mayúsculas y cifra serif.
- Pestañas subrayadas, tablas con cabecera marfil, botones redondeados y tarjetas blancas con borde Silver Grey.
- Se corrige un fallo que ya existía: en las páginas cortas, como Equipo, el contenido aparecía centrado en vertical con un gran hueco arriba.

## 3. Móvil sin desplazamiento lateral
- `assets/brand/muk-mobile.css` se añade al final de todas las páginas públicas y del portal Healthcare. Las mismas reglas están en `muk-unified.css` para los paneles.
- Evita que la página se deslice hacia los lados (`overflow-x: clip`) y el rebote horizontal.
- Evita el zoom automático de iOS al tocar un campo: los campos usan como mínimo 16 px en móvil, porque ese zoom también desplazaba el contenido.
- Las pestañas y las tablas anchas se desplazan dentro de su propia caja, no la página entera.

## 4. Admin → Equipo: saber si un empleado está en línea
- Cada sesión del equipo (admin, colaborador y consultor de Healthcare) envía una señal cada 45 s y también al cambiar de pestaña. Los estudiantes no envían nada.
- Estados:
  - **En línea** (verde): señal en los últimos 2 min.
  - **Ausente** (ámbar): pestaña en segundo plano o sin actividad entre 2 y 15 min.
  - **Desconectado** (gris): muestra "Visto hace X".
- En la pestaña **Equipo** hay un resumen ("2 en línea · 1 ausente · 2 desconectados") y un punto en cada foto. En **Empleados** aparece el estado bajo cada nombre y un filtro nuevo, "Conectados ahora". Todo se actualiza cada 30 s.
- Privacidad: solo los administradores pueden consultar el estado. La tabla tiene RLS activado y no tiene políticas, así que solo el servidor puede leerla.
- Si aún no se ha ejecutado la migración, el panel funciona igual que antes y el estado simplemente no aparece.
- Archivos:
  - `server/staff-presence.mjs`
  - `server/staff-presence-state.mjs` (con sus tests)
  - `admin-src/presence.js`
  - `supabase/migrations/20261105120000_staff_presence.sql`

## Pasos para publicar
1. **Supabase → SQL Editor**: ejecutar `supabase/migrations/20261105120000_staff_presence.sql`. Se puede ejecutar más de una vez sin problema.
2. Hacer commit y push (ver la guía de abajo). Vercel ejecuta `buildCommand`, que vuelve a generar `admin/app.js`, `personal-admin/app.js` y `healthcare/portal/app.js` a partir de `admin-src/`.
3. Tras el despliegue, comprobar:
   - `/admin` → Equipo: el punto verde propio y el resumen.
   - La web en el móvil.
   - `/healthcare/portal/`.

> Para probar en local antes de subir: `npm install`, después `npm run build:admin && npm run build:personal && npm run build:healthcare` y por último `npm run dev`.

## Guía rápida: VS Code + Git
1. Descomprime el zip y copia el contenido de su carpeta `Public/` **encima** de la carpeta del proyecto (la que tiene `package.json` y `vercel.json`). Acepta "Reemplazar". Solo contiene los archivos nuevos o modificados, sin `.env` ni secretos.
2. En VS Code, abre esa carpeta y una terminal (Terminal → New Terminal) y ejecuta:
   ```bash
   git checkout -b v20-diseno-unificado
   git status
   node --test server/*.test.mjs
   git add -A
   git commit -m "v20: diseño unificado (Healthcare), paleta MUK, móvil estable y estado en línea del equipo"
   git push -u origin v20-diseno-unificado
   ```
   `git status` sirve para revisar la lista de archivos cambiados, y `node --test` para lanzar los tests (opcional).
3. Vercel crea una vista previa (Preview) de la rama. Revísala. Si todo está bien, fusiona la rama en `main`, desde GitHub (Pull Request) o con:
   ```bash
   git checkout main && git merge v20-diseno-unificado && git push
   ```
4. Para volver atrás, basta con revertir el commit: `git revert <id-del-commit>`.

## Avisos encontrados (no modificados)
- El zip no trae `/favicon.ico`, `/favicon.svg`, `/apple-touch-icon.png`, `/icon-192.png` ni `/icon-512.png`, aunque las páginas y `sw.js` los usan (dan error 404 y el icono de "Instalar app" sale vacío). Si están en el repositorio fuera de `Public/`, no hay que hacer nada.
- Los pases de Apple y Google Wallet conservan sus colores, porque se generan con otra herramienta (`tools/wallet-*.mjs`). Se pueden cambiar en otra fase.
- Las fotografías de Healthcare no se han recoloreado, porque son fotos.
