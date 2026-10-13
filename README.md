# Trionix Tickets - Soporte con Agentes

**Estudiante:** Deimer Enrique Torres rojas
**Materia:** Electiva Web Avanzada - Universidad Simón Bolívar

## Descripción

Sistema de gestión de tickets de soporte técnico para Trionix Labs. Permite registrar tickets, llevar un registro de agentes de soporte y asignar un agente a cada ticket. Incluye una API REST (Node.js, Express, Joi y MongoDB con Mongoose) y un frontend en HTML, CSS y JavaScript plano.

## URL pública

[PEGAR AQUÍ LA URL DE LA APLICACIÓN DESPLEGADA]

## Cómo correrlo localmente

1. Clonar el repositorio y entrar a la carpeta del proyecto.
2. Instalar dependencias: `npm install`
3. Copiar `.env.example` a `.env` y completar los valores (ver abajo).
4. (Opcional) Cargar datos de prueba: `npm run seed`
5. Iniciar el servidor: `npm start`
6. Abrir `http://localhost:8080` en el navegador.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | Cadena de conexión a MongoDB (MongoDB Atlas) |
| `PORT` | Puerto del servidor (por defecto 8080) |

## Endpoints principales

- Tickets: `GET/POST /api/tickets`, `GET/PUT/DELETE /api/tickets/:id`, `POST /api/tickets/:id/comentarios`
- Agentes: `GET/POST /api/agentes`, `GET/PUT/DELETE /api/agentes/:id`, `GET /api/agentes/:id/tickets`
- Asignación: `POST /api/tickets/:id/asignar`

## Bonus implementados

Ninguno.