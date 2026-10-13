import { Router } from "express";
import Joi from "joi";
import Ticket from "../models/Ticket.js";
import Agente from "../models/Agente.js";
import { esIdValido, validar } from "../utils.js";

const router = Router();

// Qué datos del agente queremos ver dentro del ticket
const CAMPOS_AGENTE = "nombre especialidad";

// populate cambia el id del agente por sus datos, pero el campo se sigue llamando
// "agenteId". Aquí lo renombramos a "agente" (y queda null si no hay nadie asignado).
function conAgente(ticket) {
  const obj = ticket.toObject();
  obj.agente = obj.agenteId || null;
  delete obj.agenteId;
  return obj;
}

// ---------- Reglas de validación con Joi ----------

// Crear: el estado se descarta siempre (strip), el ticket nace "abierto"
const crearSchema = Joi.object({
  cliente: Joi.string().trim().min(2).max(100).required(),
  asunto: Joi.string().trim().min(5).max(200).required(),
  prioridad: Joi.string().valid("baja", "media", "alta").required(),
  estado: Joi.any().strip(),
});

// Actualizar: todos los campos son opcionales, pero debe llegar al menos uno
const actualizarSchema = Joi.object({
  cliente: Joi.string().trim().min(2).max(100),
  asunto: Joi.string().trim().min(5).max(200),
  prioridad: Joi.string().valid("baja", "media", "alta"),
  estado: Joi.string().valid("abierto", "resuelto"),
}).min(1);

// Filtros opcionales de la lista: ?estado= y ?prioridad=
const filtrosSchema = Joi.object({
  estado: Joi.string().valid("abierto", "resuelto"),
  prioridad: Joi.string().valid("baja", "media", "alta"),
});

// Comentario: autor mínimo 2 caracteres, texto mínimo 3
const comentarioSchema = Joi.object({
  autor: Joi.string().trim().min(2).required(),
  texto: Joi.string().trim().min(3).required(),
});

// Asignar: solo llega el id del agente
const asignarSchema = Joi.object({
  agenteId: Joi.string().required(),
});

// ---------- Endpoints ----------

// 1) GET /api/tickets -> lista todos (con filtros opcionales)
router.get("/", async (req, res) => {
  const filtro = validar(filtrosSchema, req.query, res);
  if (!filtro) return;

  const tickets = await Ticket.find(filtro)
    .sort({ createdAt: -1 })
    .populate("agenteId", CAMPOS_AGENTE);
  res.json(tickets.map(conAgente));
});

// 2) GET /api/tickets/:id -> un ticket por id
router.get("/:id", async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ error: "El id del ticket no tiene un formato válido." });
  }

  const ticket = await Ticket.findById(req.params.id).populate("agenteId", CAMPOS_AGENTE);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket no encontrado." });
  }
  res.json(conAgente(ticket));
});

// 3) POST /api/tickets -> crea un ticket
router.post("/", async (req, res) => {
  const datos = validar(crearSchema, req.body, res);
  if (!datos) return;

  const ticket = await Ticket.create(datos);
  await ticket.populate("agenteId", CAMPOS_AGENTE);
  res.status(201).json(conAgente(ticket));
});

// 4) PUT /api/tickets/:id -> actualiza un ticket
router.put("/:id", async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ error: "El id del ticket no tiene un formato válido." });
  }

  const datos = validar(actualizarSchema, req.body, res);
  if (!datos) return;

  // new: true -> devuelve el ticket ya actualizado
  // runValidators: true -> Mongoose también revisa sus reglas al actualizar
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, datos, {
    new: true,
    runValidators: true,
  }).populate("agenteId", CAMPOS_AGENTE);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket no encontrado." });
  }
  res.json(conAgente(ticket));
});

// 5) DELETE /api/tickets/:id -> elimina un ticket
router.delete("/:id", async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ error: "El id del ticket no tiene un formato válido." });
  }

  const ticket = await Ticket.findByIdAndDelete(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket no encontrado." });
  }
  res.status(204).send();
});

// 6) POST /api/tickets/:id/comentarios -> agrega un comentario embebido
router.post("/:id/comentarios", async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ error: "El id del ticket no tiene un formato válido." });
  }

  const comentario = validar(comentarioSchema, req.body, res);
  if (!comentario) return;

  // $push agrega el comentario al final de la lista "comentarios" del ticket
  const ticket = await Ticket.findByIdAndUpdate(
    req.params.id,
    { $push: { comentarios: comentario } },
    { new: true, runValidators: true }
  ).populate("agenteId", CAMPOS_AGENTE);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket no encontrado." });
  }
  res.status(201).json(conAgente(ticket));
});

// 12) POST /api/tickets/:id/asignar -> asigna un agente a un ticket
router.post("/:id/asignar", async (req, res) => {
  // 1. Los dos ids deben tener formato válido (400 si no)
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ error: "El id del ticket no tiene un formato válido." });
  }
  const datos = validar(asignarSchema, req.body, res);
  if (!datos) return;
  if (!esIdValido(datos.agenteId)) {
    return res.status(400).json({ error: "El agenteId no tiene un formato válido." });
  }

  // 2. El ticket debe existir (404 si no)
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket no encontrado." });
  }

  // 3. El agente debe existir (404) y estar activo (400)
  const agente = await Agente.findById(datos.agenteId);
  if (!agente) {
    return res.status(404).json({ error: "Agente no encontrado." });
  }
  if (!agente.activo) {
    return res.status(400).json({ error: "El agente está inactivo y no puede recibir tickets." });
  }

  // 4. Todo está bien: se escribe la asignación
  ticket.agenteId = agente._id;
  await ticket.save();
  await ticket.populate("agenteId", CAMPOS_AGENTE);
  res.json(conAgente(ticket));
});

export default router;