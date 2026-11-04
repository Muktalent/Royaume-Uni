# MUK Talent · Cambios v19 · División MUKTalent Healthcare

## Web principal (Education)
- Sin cambios en la cabecera. En el pie de las 16 páginas se añade una sección discreta "Our Divisions": Education · Healthcare (enlace a /healthcare/).
- css/muk-v6.css y caché subidos a v=19.0.0.

## Web Healthcare (/healthcare/)
- 28 páginas propias con navegación, identidad visual y contenidos independientes: inicio, candidatos, empleadores, profesiones, proceso de selección, contratación ética, vacantes, sobre nosotros, contacto, registro, reclamaciones y todas las políticas (privacidad de candidatos y empleados, cookies, términos, protección de datos, retención, derechos, brechas, salvaguarda, igualdad, antisoborno, verificación, contratación ética, quejas).
- Idiomas: inglés (principal y por defecto), español, francés y árabe (RTL). El idioma solo cambia si el visitante lo elige.
- Paleta del documento: Deep Teal #174C4B, Navy #19364A, Soft Sage #8FA99B, Warm Ivory #F6F5EF, Muted Gold #B99B68, Medical Grey #DCE6E8.
- Mensaje obligatorio visible: "Candidates are not charged recruitment or work-finding fees by MUKTalent Healthcare."
- No se afirma pertenencia a la Ethical Recruiters List, respaldo del NHS, acreditaciones ni alianzas. No se garantiza empleo, visado, registro profesional ni salarios.
- El registro inicial no pide documentos sensibles (pasaporte, etc.); solo CV opcional. Los documentos se solicitan después, desde el portal.
- Formularios (candidatos, empleadores, contacto, reclamaciones) llegan a agents@muktalent.com (configurable en Healthcare Settings).

## Portal privado (/healthcare/portal/)
- Candidatos: My Application, My Recruitment Journey (8 etapas), My Documents (subida segura), My Opportunities, My Interviews, My Consultant, Messages, Notifications, My Profile (con derechos de datos: copia, rectificación, supresión) y Help & Support. En 4 idiomas.
- Consultores: My Candidates, New Applications, Candidate Documents, Recruitment Pipeline, Employer Opportunities, Interviews, Messages, Tasks & Follow-ups, My Performance. Cada consultor solo ve los candidatos asignados (filtrado en el servidor, no solo en pantalla).
- Administración Healthcare: Overview, Candidates, Applications, Employers (y solicitudes de empleadores), Vacancies, Recruitment Pipeline, Consultants, Documents, Interviews, Messages, Ethical Recruitment & Compliance (controles, lista de países rojo/ámbar, candidatos marcados, solicitudes de datos, registro de reclamaciones), Reports & Analytics (con exportación CSV sin datos personales) y Healthcare Settings (correos, responsables, plazos, retención, registro de auditoría).
- Separado de Students: diseño propio y botón "Back to Education dashboard" hacia /admin/. Desde /admin/ hay acceso a Healthcare.
- Reglas: una vacante solo se publica si el empleador tiene la due diligence completada y se confirma que es real y autorizada. Los candidatos de países en lista roja/ámbar quedan marcados y no se presentan a empleadores.

## Pasos necesarios antes de publicar
1. Ejecutar en Supabase (SQL Editor) `supabase/migrations/20261104090000_healthcare_division.sql`. Crea las tablas hc_*, el bucket privado `healthcare-docs`, RLS y los controles de cumplimiento iniciales.
2. Supabase → Authentication → URL Configuration: añadir `https://www.muktalent.com/healthcare/portal/` en Redirect URLs.
3. Supabase → Authentication → Multi-Factor: activar TOTP. El equipo Healthcare debe usar verificación en dos pasos (desactivable con `HC_REQUIRE_MFA=off`, no recomendado).
4. Variables de entorno en Vercel: `HEALTHCARE_NOTIFY_EMAIL` (por defecto agents@muktalent.com), `RESEND_API_KEY` y `BOOKING_FROM_EMAIL` (ya existentes) para los correos.
5. Dar acceso a consultores: Healthcare → Consultants → Enable (solo cuentas de staff activas).
6. Revisar la lista de países rojo/ámbar con la fuente oficial de NHS Employers y marcarla como revisada (mínimo mensual).
7. Sustituir las fotografías de ambiente generadas por IA (healthcare/assets/img/hc-*) por fotografías propias o con licencia, si se prefiere.
8. Si se desea mostrar al equipo en la web, completar `healthcare/assets/team.json` solo con personas y cargos reales.
9. Añadir el número de registro ICO en la política de privacidad cuando se disponga de él.
10. Revisión legal de políticas y términos, y confirmar que todo lo publicado refleja los sistemas y procedimientos reales de la empresa.
11. Si en el futuro se entra en la Ethical Recruiters List, actualizar la web solo cuando esté confirmado.

## Técnico
- Nuevos ficheros: server/healthcare.mjs, healthcare-model.mjs, healthcare-mail.mjs (+ tests), tools/healthcare/*, admin-src/healthcare/*, healthcare/**.
- `npm run build:healthcare` genera las páginas, los diccionarios y healthcare/portal/app.js. Incluido en el buildCommand de vercel.json.
- Cabeceras de seguridad (CSP) propias para /healthcare/ y /healthcare/portal/ (noindex, no-store).
- Tests: 108/109 OK (el único fallo es un test previo de PDF que escribe en una carpeta inexistente del entorno; no afecta a Healthcare).
