# Cambios v16 · Equipo, Documentos e Informes

## Orden de despliegue
1. Supabase → SQL Editor: ejecutar `supabase/migrations/20261102_team_documents_reports.sql` (idempotente).
2. Desplegar en Vercel como siempre (`npm run build:admin && npm run build:personal && node tools/build-site.mjs`).
3. Opcional: variable `HR_NOTIFY_EMAIL` (con `RESEND_API_KEY` y `BOOKING_FROM_EMAIL`) para recibir por email los documentos firmados y los nuevos documentos del equipo.

## Admin › Equipo
- Equipo: galería de fotos; al tocar una foto se abre su pantalla en modo lectura.
- Crear colaborador: un solo formulario (datos, país con autocompletado, varios idiomas, fecha de nacimiento, foto, acceso, contacto, salario + comisión + moneda, Activo = tarjeta/QR/wallet, Visible en web).
- Empleados: buscar/filtrar, abrir ficha para editar, visibilidad web, acceso, ver pantalla, documentos y eliminar perfil (baja segura: bloquea acceso, desactiva tarjeta/QR/wallet, oculta en web, reasigna leads; conserva historial).
- Documentos: aviso en el menú, contadores, enviar contratos (firma en la plataforma) y otros documentos, revisar/aprobar/rechazar, ver original y firmado, retirar.

## Empleado › Documents
- Leer y firmar contratos (firma dibujada o nombre completo), recibir documentos, enviar documentos a administración.
- El PDF firmado lleva sello en cada página y una página de certificado (nombre, cuenta, fecha, IP, huella SHA-256).

## Admin › Informes
- Flujo en 3 pasos: Revisar pipeline → Preparar informe (Universidad/partner o interno; todos los del filtro o selección; destinatario y título; Descargar Excel o Crear enlace) → Enlaces enviados (vistas, última vista, Retirar enlace).
- Excel profesional: Summary con KPIs, Case pipeline con código de colores y semáforos, mapa Etapa × nivel y Guía.
- La página compartida permite descargar el mismo Excel mientras el enlace esté activo.

## Notas
- Las nóminas usan el salario y la moneda de cada colaborador (por defecto 3.000 MAD + 2.000 MAD por lead).
- La web pública puede tardar hasta 5 minutos en reflejar cambios de visibilidad (caché).
- La antigua pestaña Equipo › Documentos (inventario de documentos de candidatos) se sustituye por la nueva sección de documentos del equipo; los documentos de estudiantes siguen en sus expedientes.
