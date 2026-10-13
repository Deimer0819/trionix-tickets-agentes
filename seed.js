import "dotenv/config";
import { connectDB } from "./db.js";
import mongoose from "mongoose";
import Agente from "./models/Agente.js";
import Ticket from "./models/Ticket.js";

async function seed() {
  await connectDB();

  // Borra lo que haya, para empezar de cero
  await Ticket.deleteMany({});
  await Agente.deleteMany({});

  // Asegura que el índice único del email exista en esta base de datos
  await Agente.syncIndexes();

  const agentes = await Agente.insertMany([
    { nombre: "Laura Gómez", email: "laura@trionix.com", especialidad: "redes" },
    { nombre: "Carlos Ruiz", email: "carlos@trionix.com", especialidad: "software" },
    { nombre: "Marta Díaz", email: "marta@trionix.com", especialidad: "hardware" },
    { nombre: "Pedro Silva", email: "pedro@trionix.com", especialidad: "general", activo: false },
  ]);

  await Ticket.insertMany([
    {
      cliente: "Acme SA",
      asunto: "No carga el dashboard",
      prioridad: "alta",
      agenteId: agentes[1]._id,
      comentarios: [{ autor: "Carlos", texto: "Ya estoy revisando el problema" }],
    },
    {
      cliente: "Globex",
      asunto: "Falla la conexión de red en la oficina",
      prioridad: "media",
      agenteId: agentes[0]._id,
    },
    {
      cliente: "Initech",
      asunto: "La impresora no responde",
      prioridad: "baja",
      estado: "resuelto",
      agenteId: agentes[2]._id,
    },
    {
      cliente: "Umbrella",
      asunto: "No puedo iniciar sesión en el sistema",
      prioridad: "alta",
    },
  ]);

  console.log("Datos de prueba creados: 4 agentes y 4 tickets");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Error en el seed:", err.message);
  process.exit(1);
});