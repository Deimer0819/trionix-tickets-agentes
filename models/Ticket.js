import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    cliente: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    asunto: { type: String, required: true, trim: true, minlength: 5, maxlength: 200 },
    prioridad: { type: String, enum: ["baja", "media", "alta"], required: true },
    estado: { type: String, enum: ["abierto", "resuelto"], default: "abierto" },

    // Comentarios "embebidos": viven dentro del propio ticket
    comentarios: [
      {
        autor: String,
        texto: String,
        fecha: { type: Date, default: Date.now },
      },
    ],

    // Referencia al agente asignado (guarda solo su id). null = sin asignar
    agenteId: { type: mongoose.Schema.Types.ObjectId, ref: "Agente", default: null },
  },
  { timestamps: true } // agrega solos createdAt y updatedAt
);

export default mongoose.model("Ticket", ticketSchema);