# MUKTalent · v23

## 1. Documentos del empleado (Admin → Equipo → Documentos)

**Antes de subir el código**, aplica una vez en Supabase → SQL Editor:
`supabase/migrations/20261105200000_hr_docs_view_only.sql`
(Si no se aplica, todo sigue funcionando como antes; las opciones nuevas avisan de que falta la migración.)

- **Solo lectura (no descargable)**: el empleado lee el documento dentro de la plataforma, sin botones de descargar, imprimir ni abrir en otra pestaña. El clic derecho, Ctrl+S y Ctrl+P están bloqueados, y el enlace interno caduca en 60 segundos. Una captura de pantalla no se puede impedir.
- **Confirmación de lectura**: el botón «I have read and understood this document» solo se activa cuando el empleado llega al final del documento. El admin ve la fecha y hora, y hay un filtro «Sin confirmar lectura».
- **Envío a varios empleados o a todo el equipo**: el archivo se sube una sola vez y se copia a cada empleado.
- **Registro de accesos**: el botón «Accesos» muestra cuándo y desde qué dispositivo abrió el empleado el documento, y en la lista se ve «Abierto N veces · último …».
- **Opciones después de enviar**: permite cambiar solo lectura, confirmación y caducidad sin volver a subir el archivo, también para todas las copias a la vez.
- **Caducidad**: es opcional; pasada la fecha, el empleado deja de ver el documento. Los documentos firmados no caducan.
- **Aviso**: si se marca «solo lectura» en un contrato o una nómina, aparece una recomendación para dejarlos descargables.
- **Nuevo visor de PDF** (pdf.js, en `assets/vendor/pdfjs/`): muestra **todas las páginas también en iPhone** e incluye zoom.

## 2. Seguridad
- Nueva **Content-Security-Policy** para la web pública, compatible con Google Analytics/Ads y el píxel de Meta. Los paneles conservan la suya.
- Nueva cabecera **HSTS** (HTTPS obligatorio).

## 3. Rendimiento
- La imagen principal `hero.jpg` pasa de 2,3 MB a 42–117 KB (AVIF/WebP, con versión para móvil). El JPG queda como respaldo, comprimido a 210 KB.
- Eliminado el logo PNG de 315 KB en /institutions (se usa el SVG).
- Se han actualizado las versiones `?v=` para que los navegadores descarguen los archivos nuevos.

## 4. SEO y marca
- **Marca única «MUKTalent»** en textos, títulos, datos estructurados, paneles y correos (herramienta: `tools/brand-v23.py`).
  - Se mantiene «MAGHREB UK TALENT LTD» como nombre legal (copyright, aviso legal, Companies House).
  - Se mantiene «Maghreb UK Talent» donde se pide buscarlo en el directorio de agentes del British Council, porque es el nombre que figura allí.
  - Google recibe «Maghreb UK Talent» y «MUK Talent» como nombres alternativos, para no perder búsquedas.
  - En «Quiénes somos» aparece «MUKTalent (Maghreb UK Talent)». En el aviso legal se añade «MUKTalent es el nombre comercial de MAGHREB UK TALENT LTD». Ambos textos están traducidos.
- Datos estructurados **FAQPage** en las 6 páginas con preguntas frecuentes, generados del texto visible (`tools/seo-v23.py`).
- La organización en los datos estructurados se completa con LinkedIn, Instagram, Companies House, sede registrada y número de empresa.
- Título de /parents/ acortado.

## 5. Animación (desactivada si el sistema pide «reducir movimiento»)
- Transición suave entre páginas.
- Barra fina de progreso de lectura.
- Entrada suave de la foto principal.
- Preguntas frecuentes que se abren y cierran con suavidad.
- Pequeño empuje de las flechas de los botones al pasar el ratón.

## Comprobado
- 18 páginas públicas con la nueva CSP, sin bloqueos.
- Sin desbordamiento horizontal en móvil.
- Cambio de idioma correcto.
- Visor y documentos probados en escritorio y móvil.
- JSON-LD válido.
- Tests del servidor iguales que en la v22, más 3 nuevos que pasan.
