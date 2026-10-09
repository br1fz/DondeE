import "dotenv/config";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { dbManager } from "./database.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

// Inicializar conexion a MongoDB Atlas / Motor NoSQL Local
await dbManager.init();

// 1. Estado y Salud del Backend NoSQL
app.get("/api/health", async (_request, response, next) => {
  try {
    const health = await dbManager.getHealth();
    response.json(health);
  } catch (error) {
    next(error);
  }
});

// 2. Busqueda Multi-Entidad (Sectores, Eventos, Recintos)
app.get("/api/search", async (request, response, next) => {
  try {
    const query = String(request.query.q ?? "");
    const results = await dbManager.search(query);
    response.json(results);
  } catch (error) {
    next(error);
  }
});

// 3. Listado General de Recintos
app.get("/api/venues", async (_request, response, next) => {
  try {
    const venues = await dbManager.getAllVenues();
    response.json(venues);
  } catch (error) {
    next(error);
  }
});

// 4. Busqueda Geoespacial NoSQL (GeoJSON Point $near / 2dsphere)
app.get("/api/venues/near", async (request, response, next) => {
  try {
    const lng = Number(request.query.lng ?? -71.6245);
    const lat = Number(request.query.lat ?? -33.0425);
    const maxDistance = Number(request.query.maxDistance ?? 3000);
    const venues = await dbManager.getVenuesNear(lng, lat, maxDistance);
    response.json(venues);
  } catch (error) {
    next(error);
  }
});

// 5. Listado General de Eventos
app.get("/api/events", async (_request, response, next) => {
  try {
    const events = await dbManager.getAllEvents();
    response.json(events);
  } catch (error) {
    next(error);
  }
});

// 6. Listado de Usuarios
app.get("/api/users", async (_request, response, next) => {
  try {
    const users = await dbManager.getAllUsers();
    response.json(users);
  } catch (error) {
    next(error);
  }
});

// 7. Reseñas Sociales por Recinto
app.get("/api/reviews", async (request, response, next) => {
  try {
    const venueId = request.query.venueId ? Number(request.query.venueId) : undefined;
    const reviews = await dbManager.getReviews(venueId);
    response.json(reviews);
  } catch (error) {
    next(error);
  }
});

// 8. Crear Nueva Reseña
app.post("/api/reviews", async (request, response, next) => {
  try {
    const { rating, comment, userId, venueId, userName } = request.body;
    if (!rating || !venueId || !userId) {
      return response.status(400).json({ error: "Campos obligatorios: rating, venueId, userId" });
    }
    const created = await dbManager.createReview({
      rating: Number(rating),
      comment: String(comment || ""),
      userId: Number(userId),
      venueId: Number(venueId),
      userName
    });
    response.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// 9. Crear Reserva de Entradas (Transaccional)
app.post("/api/reservations", async (request, response, next) => {
  try {
    const { userId, eventId, quantity, totalPaid, userName } = request.body;
    if (!userId || !eventId || !quantity) {
      return response.status(400).json({ error: "Campos obligatorios: userId, eventId, quantity" });
    }
    const created = await dbManager.createReservation({
      userId: Number(userId),
      eventId: Number(eventId),
      quantity: Number(quantity),
      totalPaid: Number(totalPaid || 0),
      userName
    });
    response.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CONSULTAS DE RÚBRICA TRADUCIDAS A MQL Y AGGREGATION PIPELINES (ENTREGA 2)
// ============================================================================

// 10. Resumen por Recinto (Aggregation Pipeline: $group + métricas)
app.get("/api/analytics/venues-summary", async (_request, response, next) => {
  try {
    const rows = await dbManager.getVenuesSummary();
    response.json(rows);
  } catch (error) {
    next(error);
  }
});

// 11. Ranking de Locales Mejor Evaluados (Aggregation: $match sobre embebidos + $project + $sort)
app.get("/api/venues/top-rated", async (_request, response, next) => {
  try {
    const rows = await dbManager.getTopRatedVenues();
    response.json(rows);
  } catch (error) {
    next(error);
  }
});

// 12. Alerta de Aforo Crítico (MQL $expr con división aritmética en tiempo real)
app.get("/api/events/almost-sold-out", async (_request, response, next) => {
  try {
    const rows = await dbManager.getAlmostSoldOutEvents();
    response.json(rows);
  } catch (error) {
    next(error);
  }
});

// 13. Usuarios Inactivos (Aggregation $lookup + $match de arreglos vacíos)
app.get("/api/users/inactive", async (_request, response, next) => {
  try {
    const rows = await dbManager.getInactiveUsers();
    response.json(rows);
  } catch (error) {
    next(error);
  }
});

// 14. Estadísticas de Colecciones NoSQL
app.get("/api/nosql/collections", async (_request, response, next) => {
  try {
    const stats = await dbManager.getCollectionsStats();
    response.json(stats);
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
  console.log(`DondeE API NoSQL escuchando en http://localhost:${port}`);
});
