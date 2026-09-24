import "dotenv/config";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { dbManager } from "./database.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

// Initialize Database connection (PostgreSQL or Relational SQL fallback)
await dbManager.init();

app.get("/api/health", async (_request, response, next) => {
  try {
    const health = await dbManager.getHealth();
    response.json(health);
  } catch (error) {
    next(error);
  }
});

// Full Multi-Entity Database Search (venues, events, sectors/localities)
app.get("/api/search", async (request, response, next) => {
  try {
    const query = String(request.query.q ?? "");
    const results = await dbManager.search(query);
    response.json(results);
  } catch (error) {
    next(error);
  }
});

app.get("/api/venues", async (_request, response, next) => {
  try {
    const venues = await dbManager.getAllVenues();
    response.json(venues);
  } catch (error) {
    next(error);
  }
});

app.get("/api/events", async (_request, response, next) => {
  try {
    const events = await dbManager.getAllEvents();
    response.json(events);
  } catch (error) {
    next(error);
  }
});

app.get("/api/users", async (_request, response) => {
  response.json([
    { id_usuario: 1, nombre: "Valentina Morales", email: "valen.morales@gmail.com", rol: "CLIENTE" },
    { id_usuario: 2, nombre: "Diego Silva", email: "diego.silva@alumnos.usm.cl", rol: "CLIENTE" },
    { id_usuario: 3, nombre: "Camila Rojas", email: "camila.rojas@gmail.com", rol: "CLIENTE" },
    { id_usuario: 4, nombre: "Host Valparaíso Puerto SpA", email: "contacto@valpopuerto.cl", rol: "HOST" },
  ]);
});

app.get("/api/reviews", async (_request, response) => {
  response.json([
    {
      id_resena: 1,
      calificacion: 5,
      comentario: "Excelente ambiente, la terraza tiene vista panorámica al puerto.",
      fecha_publicacion: new Date().toISOString(),
      user_name: "Valentina Morales",
      id_recinto: 1,
    },
  ]);
});

app.post("/api/reviews", async (request, response) => {
  const { rating, comment, userId, venueId } = request.body;
  response.status(201).json({
    id_resena: Date.now(),
    calificacion: rating,
    comentario: comment,
    fecha_publicacion: new Date().toISOString(),
    id_usuario: userId,
    id_recinto: venueId,
  });
});

app.post("/api/reservations", async (request, response) => {
  const { userId, eventId, quantity, totalPaid } = request.body;
  response.status(201).json({
    id_reserva: Date.now(),
    estado_pago: "PAGADO",
    cantidad_entradas: quantity,
    total_pagado: totalPaid,
    id_usuario: userId,
    id_evento: eventId,
    fecha_reserva: new Date().toISOString(),
  });
});

app.use((_request, response) => {
  response.status(404).json({ error: "Ruta no encontrada" });
});

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error);
  response.status(500).json({ error: "Error interno del servidor" });
});

app.listen(port, () => {
  console.log(`DondeE API escuchando en http://localhost:${port}`);
});
