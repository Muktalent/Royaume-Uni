# MUKTalent · v24

**Antes de subir el código**, ejecuta en Supabase → SQL Editor, en este orden:
1. `supabase/migrations/20261116100000_student_lead_link.sql`: une los estudiantes que ya existen. Al final muestra una lista de revisión.
2. `supabase/migrations/20261116110000_gp_sign_requests.sql`: crea la tabla de documentos para firmar.

## 1. Estudiante con counsellor asignado que no aparecía
**Causa:** «Leads y casos» (`crm_candidates`) y Global Passport (`gp_students`) eran dos registros sin unir. Asignar un responsable en uno no cambiaba el otro. Ahora se unen por el correo:
- Si asignas un responsable en Leads y casos, ese counsellor pasa a llevar el Global Passport del estudiante. El estudiante recibe el aviso.
- Si reasignas el counsellor en Global Passport, el lead cambia de responsable.
- Cuando un estudiante crea su Global Passport:
  - si ya tenía un lead con responsable, ese counsellor lo lleva;
  - si no tenía lead, se crea uno (origen «Cuenta Global Passport») con el mismo counsellor, y aparece en Leads y casos y en el flujo del counsellor.
- Nuevo panel en Global Passport → All students: **«Accounts without a Global Passport yet»**. Muestra las cuentas creadas que aún no completaron los 4 pasos, y si confirmaron o no su correo.

## 2. Ficha de Leads y casos
- Se elimina «Évaluation reçue · formulaire complet» (el texto técnico).
- En su lugar hay una ficha ordenada:
  - estado, responsable y origen;
  - Contacto (correo y WhatsApp con enlace);
  - Proyecto de estudios;
  - Formación actual;
  - Inglés;
  - Seguimiento;
  - Mensaje del estudiante.
- Debajo queda «Editar datos del caso», ya sin presupuesto ni moneda.

## 3. Formulario de registro (evaluación)
- Se quitan «Budget annuel» y «Devise».
- El servidor sigue aceptando formularios antiguos que aún estén en caché.

## 4. «Upcoming steps» / «Prochaines étapes» (sustituye a «Upcoming dates»)
Muestra lo que el estudiante tiene que hacer ahora, por prioridad:
1. Documentos para firmar.
2. Documentos para corregir.
3. Tareas vencidas.
4. Documentos que tiene que subir (primero los de su etapa actual).
5. Tareas y fechas próximas.

Cada paso abre directamente lo que hay que hacer. Si no hay nada pendiente, muestra la etapa en curso. En la página «Plan» aparece la lista completa.

## 5. Documentos para firmar (Global Passport)
- **Admin o counsellor** (expediente → Documents → «Documents to sign»):
  - envía un PDF con título y mensaje;
  - ve el estado: enviado, abierto o firmado;
  - abre la copia firmada;
  - puede retirar un documento que aún no se ha firmado.
- **Estudiante** (Documents → «Documents to sign»):
  - lo lee en la plataforma y lo firma **a mano** con el dedo o el ratón;
  - el PDF firmado lleva una línea de firma en cada página y un certificado final con nombre, cuenta, fecha, IP y huella SHA-256.
- **Avisos:**
  - el estudiante recibe un mensaje cuando le envían un documento;
  - el counsellor recibe un mensaje «Signed: …» cuando el estudiante firma;
  - en la lista aparece «1 signed» hasta que el counsellor abre la pestaña Documents.

## 6. Foto del estudiante en Global Passport (admin)
- La foto aparece en la lista de estudiantes y en la cabecera del expediente. Si no hay foto, se muestran las iniciales.

## Otros
- El visor de PDF ya no da error al cerrarse (afectaba también a los documentos de empleados).

## Comprobado
- Tests nuevos del servidor (`server/v24.test.mjs`, 7/7):
  - el counsellor ve al estudiante;
  - el admin lo ve en All;
  - un counsellor no asignado no puede verlo ni enviarle documentos;
  - el lead se crea y se sincroniza en ambos sentidos;
  - la foto aparece en la lista;
  - flujo completo de firma con un PDF real (2 páginas + certificado);
  - un documento no se puede firmar dos veces;
  - un documento firmado no se puede retirar.
- Pantallas probadas en escritorio y móvil, sin errores de consola.
