# MUKTalent · v25

No hace falta ninguna migración nueva. Si aún no las has ejecutado, ejecuta las dos de la v24:
`20261116100000_student_lead_link.sql` y `20261116110000_gp_sign_requests.sql`.

## 1. Estudiantes con counsellor que no aparecían en Global Passport
Un estudiante solo existía en Global Passport cuando terminaba los 4 pasos de su cuenta. Si era un lead con counsellor asignado en «Leads y casos», o creó la cuenta pero no terminó los pasos, no aparecía en ningún sitio.

Ahora aparecen en la lista de Global Passport:
- del **admin**, en All students: todos los leads con counsellor asignado y todas las cuentas sin terminar;
- del **counsellor**, en Students → Control centre: sus leads asignados.

Se marcan como «No Global Passport yet», e indican si ya tienen cuenta o no. Hay un filtro nuevo: «Without Global Passport».

Al abrir uno se ven los datos de contacto y el siguiente paso:
- **Sin cuenta:** botón «Send Global Passport invitation». El estudiante recibe un correo, elige su contraseña, completa los 4 pasos y su Global Passport se abre asignado a su counsellor.
- **Cuenta sin confirmar o sin terminar:** indica qué le falta al estudiante.

## 2. Upcoming steps sin fechas
Solo muestra lo que el estudiante tiene que hacer, por orden de prioridad:
1. firmar documentos;
2. corregir documentos;
3. subir documentos;
4. tareas abiertas.

Si no hay nada pendiente, muestra la etapa en curso.

## 3. Documentos para firmar en «Documents»
- **Admin o counsellor:** en el expediente → Documents → «Request documentation», activa «Requires signature» y adjunta el PDF. El estudiante recibe un aviso.
- **Estudiante:** en Documents ve siempre «Documents to sign» y firma a mano. La copia firmada vuelve al admin y al counsellor, y aparece en «Documents to sign» del expediente.
