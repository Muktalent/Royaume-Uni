export class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function validId(resource, value) {
  if (resource === "settings") {
    if (value !== "true") throw new InputError("Configuración no válida.");
    return true;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new InputError("Identificador no válido.");
  }
  return value;
}
export function validateValues(name, resource, input, create) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new InputError("Datos no válidos.");
  const allowed = new Set(resource.fields);
  if (create && name === "staff") allowed.add("user_id");
  const output = {};
  for (const [key, raw] of Object.entries(input)) {
    if (!allowed.has(key)) throw new InputError(`Campo no permitido: ${key}`);
    const rule = resource.columns[key];
    if (raw === null) {
      if (!rule.nullable) throw new InputError(`${rule.label}: no puede estar vacío.`);
      output[key] = null; continue;
    }
    let value = raw;
    if (rule.type === "boolean") {
      if (typeof value !== "boolean") throw new InputError(`${rule.label}: se esperaba un booleano.`);
    } else if (["numeric", "integer", "bigint"].includes(rule.type)) {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new InputError(`${rule.label}: número no válido.`);
    } else {
      if (typeof value !== "string") throw new InputError(`${rule.label}: texto no válido.`);
      value = value.trim();
      if (rule.nonempty && !value) throw new InputError(`${rule.label}: es obligatorio.`);
      if (value.length > rule.maxLength) throw new InputError(`${rule.label}: texto demasiado largo.`);
      if (rule.options && !rule.options.includes(value)) throw new InputError(`${rule.label}: opción no válida.`);
      if (rule.pattern && !new RegExp(rule.pattern).test(value)) throw new InputError(`${rule.label}: formato no válido.`);
      if (rule.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new InputError(`${rule.label}: correo no válido.`);
      if (rule.format === "uuid") validId(name, value);
      if (rule.type === "timestamp with time zone" && (!/^\d{4}-\d\d-\d\dT.*(Z|[+-]\d\d:\d\d)$/.test(value) || Number.isNaN(Date.parse(value)))) throw new InputError(`${rule.label}: fecha con zona horaria no válida.`);
      if (rule.type === "date" && (!/^\d{4}-\d\d-\d\d$/.test(value) || Number.isNaN(Date.parse(value)))) throw new InputError(`${rule.label}: fecha no válida.`);
      if (rule.type === "time without time zone" && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)) throw new InputError(`${rule.label}: hora no válida.`);
    }
    output[key] = value;
  }
  if (create) for (const key of allowed) {
    if (resource.columns[key].required && !(key in output)) throw new InputError(`${resource.columns[key].label}: es obligatorio.`);
  }
  if (!Object.keys(output).length) throw new InputError("No hay cambios para guardar.");
  return output;
}
export function validateRelations(name, row) {
  if (name === "candidates" && row.budget_amount != null && !row.budget_currency) throw new InputError("Indica la moneda del presupuesto.");
  if (name === "education") {
    if (row.is_current && row.end_date) throw new InputError("Los estudios en curso no pueden tener fecha de fin.");
    if (row.start_date && row.end_date && row.end_date < row.start_date) throw new InputError("La fecha de fin es anterior al inicio.");
  }
  if (name === "blocks" && Date.parse(row.ends_at) <= Date.parse(row.starts_at)) throw new InputError("El fin debe ser posterior al inicio.");
  if (name === "settings" && row.closing_time <= row.opening_time) throw new InputError("El cierre debe ser posterior a la apertura.");
}
