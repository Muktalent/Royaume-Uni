# MUK Talent · Cambios v22

## 1. Cabecera de la web (Education) más atractiva y profesional
- Altura fija: 84 px en escritorio y 68 px en móvil. El contenido queda alineado con la página.
- Al principio es translúcida sobre la imagen; al bajar se vuelve sólida, con una línea fina y una sombra suave.
- Menú en minúsculas con mayúscula inicial ("Accueil", "À propos"…). Todos los enlaces tienen el mismo tamaño y color, y la página actual se marca con un punto dorado.
- "Services" muestra una flecha y abre un menú tipo tarjeta.
- A la derecha: tema, idioma, "Connexion" y el botón principal "Évaluer mon profil".
- Se adapta a todas las anchuras, de 390 a 1920 px, sin desbordarse. En tablet se ocultan elementos secundarios.
- Los textos, las traducciones (EN/ES/AR, también de derecha a izquierda) y el menú móvil siguen igual.

## 2. Equipo → Empleados: fecha de inicio de contrato
- Campo nuevo, "Inicio de contrato", en la tarjeta "Salario y contrato" de cada empleado. En la lista aparece como "Desde …".
- Efecto en la nómina:
  - No se paga salario base antes de esa fecha.
  - El primer mes se prorratea según los días laborables (lunes a viernes) que quedan desde esa fecha.
  - A partir del mes siguiente se paga el salario completo.
  - Las comisiones por lead verificado se siguen sumando igual.
- El espacio del empleado lo muestra: "Base · from …", días pagables y una nota en el calendario de salario.
- **Requiere ejecutar una vez** `supabase/migrations/20261105150000_contract_start.sql`. Sin esa migración la nómina funciona igual que antes, pero guardar una fecha da un aviso.

## 3. Mensajes: sección propia, sin el corazón
- Se elimina el corazón de los paneles de administración, empleados y estudiantes.
- "Mensajes" pasa a ser una sección del menú lateral y de la barra inferior del móvil, con un contador dorado de mensajes sin leer.
- Al llegar un mensaje nuevo:
  - Aparece un aviso, que es una notificación del sistema si el navegador la permite.
  - El contador se actualiza.
  - La pestaña del navegador muestra "(n)".

## 4. Panel personal (/personal-admin): flujo sencillo
- Se empieza eligiendo qué editar: Perfil y CV, Proyecto, Certificado, Experiencia, Estudios o Redes.
- Cada tipo tiene un formulario solo con sus campos, explicados con frases claras.
- Las imágenes y los PDF se eligen dentro del formulario y se suben al pulsar "Guardar".
- El interruptor "Visible en la web" publica u oculta la entrada.
- Las entradas aparecen agrupadas por sección. Cada una tiene un botón "Visible/Oculto" para cambiarla con un clic.
- "Subir o cambiar CV" lleva directo al campo del CV.

## 5. Portfolio: botón "Download CV"
- Botón grande con forma de píldora bajo la presentación, como en el ejemplo. Usa los colores del tema activo.
- Pasa por `/api/personal/cv`, que siempre genera un enlace nuevo a tu CV publicado, así el enlace no caduca aunque la página lleve tiempo abierta. Para que aparezca, sube el CV en "Perfil y CV" y deja el perfil visible.

## 6. Asistente: micrófono en videollamada en iPhone
- La llamada abre el micrófono una sola vez y lo mantiene abierto. Antes se abría en cada turno, lo que en iOS cambiaba la salida de audio y devolvía silencio.
- El detector de silencio reactiva el audio antes de cada turno y se adapta al ruido de la sala.
- Si iOS lo bloquea, aparece "Habla y toca el círculo para enviar": tocar el círculo envía al momento, sin esperar el límite.
- Se activa el modo de audio para llamadas de Safari (`play-and-record`), y el micrófono se libera al colgar, al silenciar o al cambiar de app.

## 7. CSS unificado, mismo aspecto
- Web pública: 12 hojas de estilo (v6, v13, v4, v5…) pasan a 3, uniendo los archivos en el mismo orden:
  - `css/muk-core.css`
  - `css/muk-pages.css`
  - `css/muk-site.css` (que incluye la cabecera nueva y el footer)

  Comparé 40 capturas (10 páginas × escritorio/móvil × claro/oscuro) antes y después de la unión, antes de añadir la cabecera nueva: eran idénticas píxel a píxel.
- Paneles: 4 hojas base pasan a `admin/muk-admin-base.css`, y se elimina `admin/workspace.css`, que ya no se usaba. Las capturas del panel también eran idénticas.

---

## Cómo subirlo (PowerShell, un comando por línea)
1. Descomprime el zip y copia el contenido de su carpeta `Public/` encima de tu proyecto. Acepta "Reemplazar".
2. En la terminal de VS Code, dentro del proyecto:
```powershell
git checkout main
git pull
git checkout -b v22-mejoras
git rm --ignore-unmatch admin/admin-premium.css admin/gateway.css admin/muk-soft-admin.css admin/style.css admin/workspace.css css/footer-v21.css css/home-editorial.css css/inner-pages.css css/menu-editorial-v4.css css/mobile-partners-v2.css css/muk-dark-v6.css css/muk-v13.css css/muk-v6.css css/presentation-v1.css css/public-cleanup-v3.css css/public-privacy-v5.css css/style.css
git add -A
git commit -m "v22: cabecera nueva, contrato y nomina, seccion Mensajes, panel personal, boton CV, micro iPhone y CSS unificado"
git push -u origin v22-mejoras
```
3. Ejecuta una vez en Supabase → SQL Editor: `supabase/migrations/20261105150000_contract_start.sql`.
4. Revisa la vista previa en Vercel (Deployments → Preview de `v22-mejoras` → Visit). Si todo está bien:
```powershell
git checkout main
git merge v22-mejoras
git push
```
