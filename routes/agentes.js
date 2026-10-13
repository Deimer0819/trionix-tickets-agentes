import { Router } from "express";
import Joi from "joi";
import Agente from "../models/Agente.js";
import Ticket from "../models/Ticket.js";
import { esIdValido, validar } from "../utils.js";

const router = Router();

const ESPECIALIDADES = ["redes", "software", "hardware", "general"];

// ---------- Reglas de validación con Joi ----------
const crearSchema = Joi.object({
  nombre: Joi.string().trim().min(3).max(100).required(),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
  especialidad: Joi.string().valid(...ESPECIALIDADES).required(),
  activo: Joi.boolean(),
});

// Al actualizar, todos los campos son opcionales, pero debe llegar al menos uno
const actualizarSchema = Joi.object({
  nombre: Joi.string().trim().min(3).max(100),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }),
  especialidad: Joi.string().valid(...ESPECIALIDADES),
  activo: Joi.boolean(),
}).min(1);

// Filtros opcionales de la lista: ?especialidad= y ?activo=
const filtrosSchema = Joi.object({
  especialidad: Joi.string().valid(...ESPECIALIDADES),
  activo: Joi.boolean(),
});

// ---------- Endpoints ----------

// 7) GET /api/agentes -> lista todos (con filtros opcionales)
router.get("/", async (req, res) => {
  const filtro = validar(filtrosSchema, req.query, res);
  if (!filtro) return;

  const agentes = await Agente.find(filtro).sort({ nombre: 1 });
  res.json(agentes);
});

// 8) GET /api/agentes/:id -> un agente por id
router.get("/:id", async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ error: "El id del agente no tiene un formato válido." });
  }

  const agente = await Agente.findById(req.params.id);
  if (!agente) {
    return res.status(404).json({ error: "Agente no encontrado." });
  }
  res.json(agente);
});

// 9) POST /api/agentes -> crea un agente
// Si el correo ya existe, MongoDB lanza el error 11000 y lo traduce
// el manejador de errores que está al final de app.js (queda en 400).
router.post("/", async (req, res) => {
  const datos = validar(crearSchema, req.body, res);
  if (!datos) return;

  const agente = await Agente.create(datos);
  res.status(201).json(agente);
});

// 10) PUT /api/agentes/:id -> actualiza un agente
router.put("/:id", async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ error: "El id del agente no tiene un formato válido." });
  }

  const datos = validar(actualizarSchema, req.body, res);
  if (!datos) return;

  const agente = await Agente.findByIdAndUpdate(req.params.id, datos, {
    new: true,
    runValidators: true,
  });
  if (!agente) {
    return res.status(404).json({ error: "Agente no encontrado." });
  }
  res.json(agente);
});

// 11) DELETE /api/agentes/:id -> elimina un agente
// Solo si NO tiene tickets abiertos asignados (si los tiene: 409 Conflict)
router.delete("/:id", async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ error: "El id del agente no tiene un formato válido." });
  }

  const agente = await Agente.findById(req.params.id);
  if (!agente) {
    return res.status(404).json({ error: "Agente no encontrado." });
  }

  const abiertos = await Ticket.countDocuments({ agenteId: agente._id, estado: "abierto" });
  if (abiertos > 0) {
    return res.status(409).json({
      error: `No se puede eliminar al agente porque tiene ${abiertos} ticket(s) abierto(s) asignado(s).`,
    });
  }

  await agente.deleteOne();
  res.status(204).send();
});

// 14) GET /api/agentes/:id/tickets -> tickets asignados a ese agente
router.get("/:id/tickets", async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ error: "El id del agente no tiene un formato válido." });
  }

  const agente = await Agente.findById(req.params.id);
  if (!agente) {
    return res.status(404).json({ error: "Agente no encontrado." });
  }

  const tickets = await Ticket.find({ agenteId: agente._id }).sort({ createdAt: -1 });
  res.json(tickets);
});

export default router;