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

// ============================================================================
// NUEVAS 4 CONSULTAS - RÚBRICA (ÁLGEBRA RELACIONAL Y SQL AVANZADO)
// ============================================================================

// 1. Resumen por Recinto (Agrupación y Función de Agregación)
app.get("/api/analytics/venues-summary", async (_request, response, next) => {
  try {
    const sql = `
      SELECT r.id_recinto, r.nombre_local, COUNT(e.id_evento) AS total_eventos, COALESCE(SUM(e.aforo_total), 0) AS capacidad_total_eventos, ROUND(COALESCE(AVG(e.precio_entrada), 0), 2) AS precio_promedio
      FROM recinto r
      LEFT JOIN evento e ON r.id_recinto = e.id_recinto
      GROUP BY r.id_recinto, r.nombre_local
      ORDER BY total_eventos DESC
    `;
    const rows = await dbManager.query(sql);
    response.json(rows);
  } catch (error) {
    next(error);
  }
});

// 2. Ranking de Locales (HAVING)
app.get("/api/venues/top-rated", async (_request, response, next) => {
  try {
    const sql = `
      SELECT r.nombre_local, COUNT(res.id_resena) AS cantidad_resenas, ROUND(AVG(res.calificacion), 1) AS promedio_real
      FROM recinto r
      INNER JOIN resena res ON r.id_recinto = res.id_recinto
      GROUP BY r.id_recinto, r.nombre_local
      HAVING COUNT(res.id_resena) >= 1
      ORDER BY promedio_real DESC, cantidad_resenas DESC
      LIMIT 5
    `;
    const rows = await dbManager.query(sql);
    response.json(rows);
  } catch (error) {
    next(error);
  }
});

// 3. Alerta de Aforo Crítico (Operación Matemática en WHERE)
app.get("/api/events/almost-sold-out", async (_request, response, next) => {
  try {
    const sql = `
      SELECT e.id_evento, e.titulo, r.nombre_local, e.aforo_disponible, e.aforo_total, ROUND((e.aforo_disponible::numeric / e.aforo_total::numeric) * 100, 1) AS porcentaje_disponible
      FROM evento e
      INNER JOIN recinto r ON e.id_recinto = r.id_recinto
      WHERE e.aforo_disponible > 0 AND (e.aforo_disponible::numeric / e.aforo_total::numeric) <= 0.20
      ORDER BY porcentaje_disponible ASC
    `;
    const rows = await dbManager.query(sql);
    response.json(rows);
  } catch (error) {
    next(error);
  }
});

// 4. Usuarios Inactivos (EXCEPT)
app.get("/api/users/inactive", async (_request, response, next) => {
  try {
    const sql = `
      SELECT id_usuario, nombre, email
      FROM usuario
      EXCEPT
      SELECT u.id_usuario, u.nombre, u.email
      FROM usuario u
      INNER JOIN reserva res ON u.id_usuario = res.id_usuario
      WHERE res.estado_pago = 'PAGADO'
    `;
    const rows = await dbManager.query(sql);
    response.json(rows);
  } catch (error) {
    next(error);
  }
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
