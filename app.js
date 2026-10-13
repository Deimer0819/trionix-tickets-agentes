import "dotenv/config"; // lee el archivo .env y deja sus valores en process.env
import express from "express";
import { connectDB } from "./db.js";
import ticketsRouter from "./routes/tickets.js";
import agentesRouter from "./routes/agentes.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static("public"));

// Ruta de prueba, solo para confirmar que el servidor responde
app.get("/api/salud", (req, res) => {
  res.json({ ok: true });
});

// Cada grupo de rutas lo maneja su propio archivo
app.use("/api/tickets", ticketsRouter);
app.use("/api/agentes", agentesRouter);

// ---------- Manejo de errores (siempre va DESPUÉS de las rutas) ----------
// Cualquier error que no se haya controlado en una ruta llega aquí
app.use((err, req, res, next) => {
  // El JSON que llegó está mal escrito
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido." });
  }
  // Error 11000 = índice único violado (por ejemplo, un correo repetido)
  if (err.code === 11000) {
    const campo = Object.keys(err.keyPattern || {})[0];
    if (campo === "email") {
      return res.status(400).json({ error: "Ya existe un agente registrado con ese correo electrónico." });
    }
    return res.status(400).json({ error: "Ya existe un registro con ese valor, que debe ser único." });
  }
  // Mongoose rechazó los datos por sus propias reglas
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  // Cualquier otra cosa: error nuestro, no del usuario
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor." });
});

// Primero nos conectamos a la base de datos y SOLO DESPUÉS prendemos el servidor
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error("No se pudo conectar a MongoDB:", err.message);
    process.exit(1);
  }
}

start();