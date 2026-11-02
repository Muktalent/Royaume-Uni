# MUK Talent · Cambios v17

## 1. Informes (Excel de pipeline)
- El Excel se rellena con los datos de los estudiantes (nombre, referencia, país, universidad, programa, etapa, documentos, próximos pasos). Se ha quitado la columna del empleado responsable y cualquier dato del equipo.
- Todo el Excel sale en inglés: cabeceras, hojas, etapas, estados y también los textos que el equipo escribió en español o francés (se traducen con un diccionario; los nombres propios en inglés no se tocan).
- Nueva opción en Informes → "Datos del informe": "Cartera de muestra · 15 estudiantes". Permite descargar el Excel o crear un enlace para compartir con 15 estudiantes de Marruecos, Argelia y Túnez en distintas etapas.
  - Los datos de muestra no aparecen como "ficticios" en ninguna celda. Sólo la hoja Guide incluye una línea discreta: "Illustrative portfolio prepared for partnership presentations." Así no se presenta como cartera real ante una universidad, lo que podría dar problemas legales o de confianza. Si se prefiere, se puede cambiar el texto en `server/pipeline-workbook.mjs`.

## 2. Chatbot en móvil
- En móvil el micrófono y la voz usan el servidor (transcripción y voz), porque Safari/Chrome móvil no permiten el reconocimiento del navegador de forma fiable. En PC sigue igual.
- Rutas nuevas: `POST /api/assistant/transcribe` y `POST /api/assistant/speech`.
- Usa la misma clave que el chat (`ASSISTANT_API_KEY` u `OPENAI_API_KEY`). Variables opcionales en Vercel:
  - `ASSISTANT_STT_MODEL` (por defecto `gpt-4o-mini-transcribe`)
  - `ASSISTANT_TTS_MODEL` (por defecto `gpt-4o-mini-tts`), `ASSISTANT_TTS_VOICE` (por defecto `nova`)
  - `ASSISTANT_AUDIO_URL` (por defecto `https://api.openai.com/v1`; cambiarlo sólo si el proveedor no es OpenAI)
  - `ASSISTANT_VOICE=off` desactiva la voz del servidor.

## 3. Chat interno estilo WhatsApp
- Se abre a pantalla completa. En PC: lista de chats a la izquierda y conversación a la derecha. En móvil: lista y conversación por separado, como WhatsApp.
- Colores, burbujas con colita, doble check, fondo con dibujos, filtros (Todos / No leídos / Grupos), buscador, emojis, enlaces clicables, botón para bajar al último mensaje y micrófono cuando no hay texto.

## 4. Rediseño de paneles (administración, equipo y estudiantes)
- Paleta: Midnight Teal #15383D (navegación), Deep Navy #192C3C (títulos), Champagne #C1A474 (detalles), Soft Ivory #F5F5F0 (fondo), Pure White #FFFFFF (tarjetas), Sage Green #8CA99A (progreso y estados positivos), Slate Grey #718087 (textos secundarios).
- Hoja nueva `admin/muk-v17.css` (se carga la última) y módulo `admin-src/muk-v17.js`.
- Navegación inferior en móvil: administración 5 accesos, estudiantes 5, equipo 4 + "More" (Studio, Documents, My card).
- Actividad reciente: tarjeta "Desde tu última visita" con lo que ha cambiado (candidatos, cambios de etapa, consultas, documentos, tareas, citas, mensajes). Cada usuario ve sólo lo de su función. Ruta nueva `GET /api/updates?since=`.
- Progreso visual: seguimientos al día (admin), tareas completadas (equipo), etapas completadas y anillo de preparación (estudiantes).
- Notificaciones: avisos dentro de la app y, si el usuario pulsa "Activar avisos", notificaciones del sistema para mensajes y cambios.
- Microanimaciones suaves en tarjetas, botones, navegación y avisos (se desactivan si el móvil tiene "reducir movimiento").
- PWA: `sw.js` y `offline.html` en la raíz, manifiesto actualizado y aviso para instalar la app también para administración. El service worker no guarda datos de la API ni datos personales.

## Base de datos
- No hace falta SQL nuevo en v17. Si aún no se ejecutó, sigue siendo necesaria la migración de v16.
