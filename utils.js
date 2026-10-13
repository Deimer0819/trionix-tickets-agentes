// Funciones de apoyo que usan las rutas de tickets y de agentes

// Un id de MongoDB (ObjectId) son exactamente 24 caracteres hexadecimales
export function esIdValido(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Opciones para que Joi hable en español y sin comillas raras en los nombres
const opcionesJoi = {
  abortEarly: false, // junta todos los errores en vez de parar en el primero
  errors: { wrap: { label: false } },
  messages: {
    "any.required": "{{#label}} es obligatorio",
    "string.base": "{{#label}} debe ser texto",
    "string.empty": "{{#label}} no puede estar vacío",
    "string.min": "{{#label}} debe tener al menos {{#limit}} caracteres",
    "string.max": "{{#label}} debe tener máximo {{#limit}} caracteres",
    "string.email": "{{#label}} no tiene un formato de correo válido",
    "any.only": "{{#label}} no tiene un valor permitido",
    "boolean.base": "{{#label}} debe ser true o false",
    "object.unknown": "{{#label}} no está permitido",
    "object.min": "Debes enviar al menos un campo para actualizar",
  },
};

// Revisa los datos con un esquema de Joi.
// Si hay error: responde 400 con un mensaje legible y devuelve null.
// Si todo está bien: devuelve los datos ya limpios.
export function validar(schema, datos, res) {
  const { error, value } = schema.validate(datos, opcionesJoi);
  if (error) {
    res.status(400).json({ error: error.details.map((d) => d.message).join(". ") });
    return null;
  }
  return value;
}