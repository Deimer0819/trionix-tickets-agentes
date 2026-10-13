import mongoose from "mongoose";

// Se conecta a MongoDB usando la dirección guardada en el archivo .env
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  // Si olvidaste ponerla en el .env, avisamos con un mensaje claro
  if (!uri) {
    throw new Error("Falta la variable MONGODB_URI en el archivo .env");
  }

  await mongoose.connect(uri);
  console.log("Conectado a MongoDB");
}