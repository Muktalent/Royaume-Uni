// hr-docs-rules-v23 · Reglas puras de los documentos del empleado (sin dependencias, para tests).
// v23 · solo lectura, confirmación de lectura, caducidad y envíos múltiples.
export const V23_FIELDS = 'view_only,requires_ack,acknowledged_at,expires_at,batch_id,view_count,last_viewed_at';
export const V23_DEFAULTS = {view_only: false, requires_ack: false, acknowledged_at: null, expires_at: null, batch_id: null, view_count: 0, last_viewed_at: null};
export const isExpired = (d, now = Date.now()) => !!d.expires_at && Date.parse(d.expires_at) <= now && d.status !== 'signed';
// Qué ve el empleado de su archivo: en solo lectura nunca recibe enlace de descarga.
export const fileAccess = d => ({downloadable: !d.view_only, url_seconds: d.view_only ? 60 : 300});
// Contratos y nóminas: se recomienda dejarlos descargables (el empleado debe poder tener copia).
export const keepCopyKinds = ['contract', 'payslip'];
