# MUK Talent · Cambios v21 (corrige y sustituye a v20)

## 1. La web pública vuelve a su estilo original
- Recuperan su diseño y sus colores originales:
  - Web de Education: todas las páginas.
  - Web de Healthcare.
  - Tarjetas `/nombre`, portafolio y enlaces del pipeline.
  - Logos, avatar del asistente e imagen para redes.
- Solo se mantiene `assets/brand/muk-mobile.css`, que no cambia el aspecto. Impide que el contenido se desplace hacia los lados al deslizar en el móvil y que iPhone haga zoom al tocar un formulario.

## 2. Footer nuevo en toda la web de Education (16 páginas)
- Se elimina el panel "Rentrée 2027 · Votre projet au Royaume-Uni commence par une conversation".
- Nueva estructura, más limpia:
  - Marca con descripción breve y contacto.
  - Tres columnas de enlaces (Explorer, Services, Informations).
  - El texto AQF queda en una sola línea que se despliega al pulsarla.
  - Barra inferior con ©, divisiones (Education / Healthcare), enlaces legales y redes.
- Mantiene los colores de la web y las traducciones (EN / ES / AR), porque reutiliza los mismos textos.
- Archivos: `css/footer-v21.css` y el bloque `<footer>` de cada página.

## 3. Paneles con el mismo estilo y formato que Healthcare
Afecta a: administración, espacio del equipo (empleados), Global Passport (estudiantes), centro del counsellor y portal de Healthcare.
- **Paleta "negros y blancos seda":**

  | Color | Uso |
  |---|---|
  | Negro seda `#161514` | Navegación |
  | Grafito `#2B2A28` | Textos |
  | Blanco `#FFFFFF` | Tarjetas |
  | Blanco seda `#F6F4F0` | Fondos |
  | Oro satinado `#B49B6C` | Detalles |
  | Gris seda `#E4E0D8` | Líneas |

  Los colores de estado (rojo, ámbar y verde) se mantienen.
- **Formato del portal Healthcare:**
  - Barra lateral de 276 px con el bloque de marca (MUKTalent · Education / Team workspace / Global Passport) y la etiqueta de sección.
  - "Volver a la web" y "Cerrar sesión" pasan al pie de la barra lateral.
  - Barra superior fija con el título de la página a la izquierda y el usuario (iniciales, nombre y rol) a la derecha.
  - Mismos márgenes de contenido, banner de bienvenida, indicadores, tarjetas, pestañas, tablas y botones.
- Todas las funciones siguen igual. En móvil, cada panel conserva su barra de navegación inferior.
- Archivos:
  - `assets/brand/muk-unified.css` (estilo).
  - `admin-src/shell-v21.js` (marca y usuario).
  - `admin-src/unified-theme.js`.
  - `tools/palette-v20.mjs`: ahora solo se aplica a los archivos de los paneles.

## 4. Estado en línea del equipo (sin cambios respecto a v20)
- En Admin → Equipo se ve quién está en línea, ausente o desconectado, y en Empleados hay un filtro "Conectados ahora".
- Hay que ejecutar una sola vez `supabase/migrations/20261105120000_staff_presence.sql` en Supabase → SQL Editor.

## Publicar
```bash
git checkout v20-diseno-unificado
git add -A
git commit -m "v21: web pública original, footer nuevo, paneles con formato Healthcare (negros y blancos seda)"
git push
```
Revisa la vista previa de la rama en Vercel (Deployments → Preview → Visit). Si todo está bien, fusiónala en `main`, desde el Pull Request de GitHub o con:
```bash
git checkout main && git pull && git merge v20-diseno-unificado && git push
```
