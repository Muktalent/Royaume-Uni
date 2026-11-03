# MUK Talent · Cambios v18

## Home
- Cifras del hero: "0 €" → "Gratuit / Premier accompagnement" (EN: FREE · INITIAL GUIDANCE), "4 · Étapes vers le Royaume-Uni" (EN: 4 STEPS TO YOUR UK JOURNEY), "2027 · Rentrée universitaire" (EN: 2027 INTAKE). Etiquetas en mayúsculas. Traducido a EN/ES/AR.
- Eliminada la sección "Nos counsellors" de la home.

## About (/about-us/#notre-equipe)
- La sección "Our Team" se sustituye por los counsellors con una galería nueva: nombre, rol, ciudad e idiomas a la izquierda; a la derecha, la foto principal en color y el resto en tiras en blanco y negro.
- Sin enlace ni ficha: al hacer clic en una foto, esa persona pasa a ser la principal (no abre la tarjeta de visita). Funciona con teclado (flechas).
- Los datos y las fotos salen de /api/public/team (base de datos). Los avatares corporativos se suben como foto de perfil de cada counsellor en el workspace.

## Móvil
- Chat interno y chatbot: al abrir el teclado, el panel se ajusta al área visible (visualViewport) y la web ya no asoma por debajo.
- Barra inferior de los paneles fija abajo, sin movimiento ni rebote; se oculta mientras el teclado está abierto.

## Técnico
- Versiones de caché subidas a v=18.0.0. admin/app.js recompilado. 94 tests OK.
- No hay cambios de SQL ni nuevas variables de entorno.
