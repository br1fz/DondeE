import "dotenv/config";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { Pool, type PoolClient } from "pg";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const pool = new Pool({
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? "dondee_db",
  user: process.env.PGUSER ?? "postgres",
  password: process.env.PGPASSWORD,
});

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_request, response, next) => {
  try {
    const result = await pool.query<{ now: Date; postgis_version: string }>(
      "SELECT CURRENT_TIMESTAMP AS now, PostGIS_Version() AS postgis_version",
    );
    response.json({ ok: true, database: "connected", ...result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.get("/api/venues", async (request, response, next) => {
  try {
    const latitude = Number(request.query.lat);
    const longitude = Number(request.query.lng);
    const radiusKm = Number(request.query.radiusKm ?? 50);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    const radiusMeters = radiusKm * 1000;

    const result = await pool.query({
      text: `
        SELECT
          r.id_recinto,
          r.nombre_local,
          r.direccion,
          r.estado_validacion,
          ST_Y(r.ubicacion_geom) AS lat,
          ST_X(r.ubicacion_geom) AS lng,
          ROUND(COALESCE(AVG(re.calificacion), 0)::numeric, 2) AS rating,
          COUNT(re.id_resena)::int AS reviews_count,
          COALESCE(MIN(e.aforo_total), 0)::int AS capacity,
          COALESCE(MIN(e.aforo_disponible), 0)::int AS available,
          COALESCE(MIN(e.precio_entrada), 0)::numeric AS price,
          ${hasCoordinates
            ? "ST_Distance(r.ubicacion_geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000"
            : "0"} AS distance_km
        FROM recinto r
        LEFT JOIN resena re ON re.id_recinto = r.id_recinto
        LEFT JOIN evento e ON e.id_recinto = r.id_recinto
        ${hasCoordinates
          ? "WHERE ST_DWithin(r.ubicacion_geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)"
          : ""}
        GROUP BY r.id_recinto
        ORDER BY distance_km, r.nombre_local
      `,
      values: hasCoordinates ? [longitude, latitude, radiusMeters] : [],
    });

    response.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/events", async (_request, response, next) => {
  try {
    const result = await pool.query(`
      SELECT
        e.id_evento,
        e.titulo,
        e.descripcion,
        e.fecha_hora,
        e.precio_entrada,
        e.categoria_musical,
        e.aforo_total,
        e.aforo_disponible,
        e.id_recinto,
        r.nombre_local,
        r.direccion
      FROM evento e
      INNER JOIN recinto r ON r.id_recinto = e.id_recinto
      ORDER BY e.fecha_hora
    `);
    response.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/users", async (_request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT id_usuario, nombre, email, rol, fecha_registro FROM usuario ORDER BY id_usuario",
    );
    response.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/reviews", async (request, response, next) => {
  try {
    const venueId = Number(request.query.venueId);
    const values = Number.isInteger(venueId) ? [venueId] : [];
    const result = await pool.query(
      `
        SELECT re.id_resena, re.calificacion, re.comentario, re.fecha_publicacion,
               u.id_usuario, u.nombre AS user_name, u.email AS user_email,
               re.id_recinto
        FROM resena re
        INNER JOIN usuario u ON u.id_usuario = re.id_usuario
        ${values.length ? "WHERE re.id_recinto = $1" : ""}
        ORDER BY re.fecha_publicacion DESC
      `,
      values,
    );
    response.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/reviews", async (request, response, next) => {
  try {
    const { rating, comment, userId, venueId } = request.body as {
      rating?: number;
      comment?: string;
      userId?: number;
      venueId?: number;
    };
    const validRating = Number(rating);

    if (!Number.isInteger(validRating) || validRating < 1 || validRating > 5 || !Number.isInteger(userId) || !Number.isInteger(venueId)) {
      response.status(400).json({ error: "rating, userId y venueId son obligatorios; rating debe estar entre 1 y 5" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO resena (calificacion, comentario, id_usuario, id_recinto)
       VALUES ($1, $2, $3, $4)
       RETURNING id_resena, calificacion, comentario, fecha_publicacion, id_usuario, id_recinto`,
      [validRating, comment?.trim() || null, userId, venueId],
    );
    response.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get("/api/reservations", async (request, response, next) => {
  try {
    const userId = Number(request.query.userId);
    if (!Number.isInteger(userId)) {
      response.status(400).json({ error: "userId es obligatorio" });
      return;
    }

    const result = await pool.query(
      `
        SELECT re.id_reserva, re.fecha_reserva, re.estado_pago, re.cantidad_entradas,
               re.total_pagado, re.id_usuario, re.id_evento, e.titulo, e.fecha_hora,
               e.id_recinto, r.nombre_local, r.direccion
        FROM reserva re
        INNER JOIN evento e ON e.id_evento = re.id_evento
        INNER JOIN recinto r ON r.id_recinto = e.id_recinto
        WHERE re.id_usuario = $1
        ORDER BY re.fecha_reserva DESC
      `,
      [userId],
    );
    response.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/reservations", async (request, response, next) => {
  let client: PoolClient | undefined;
  try {
    const { userId, eventId, quantity, totalPaid } = request.body as {
      userId?: number;
      eventId?: number;
      quantity?: number;
      totalPaid?: number;
    };
    const validQuantity = Number(quantity);

    if (!Number.isInteger(userId) || !Number.isInteger(eventId) || !Number.isInteger(validQuantity) || validQuantity < 1 || validQuantity > 5 || typeof totalPaid !== "number") {
      response.status(400).json({ error: "userId, eventId, quantity y totalPaid son obligatorios" });
      return;
    }

    client = await pool.connect();
    await client.query("BEGIN");
    const event = await client.query<{ aforo_disponible: number }>(
      "SELECT aforo_disponible FROM evento WHERE id_evento = $1 FOR UPDATE",
      [eventId],
    );

    if (!event.rowCount) {
      await client.query("ROLLBACK");
      response.status(404).json({ error: "Evento no encontrado" });
      return;
    }
    if (event.rows[0].aforo_disponible < validQuantity) {
      await client.query("ROLLBACK");
      response.status(409).json({ error: "No hay aforo suficiente" });
      return;
    }

    await client.query(
      "UPDATE evento SET aforo_disponible = aforo_disponible - $1 WHERE id_evento = $2",
      [validQuantity, eventId],
    );
    const reservation = await client.query(
      `INSERT INTO reserva (estado_pago, cantidad_entradas, total_pagado, id_usuario, id_evento)
       VALUES ('PAGADO', $1, $2, $3, $4)
       RETURNING *`,
      [validQuantity, totalPaid, userId, eventId],
    );
    await client.query("COMMIT");
    response.status(201).json(reservation.rows[0]);
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    next(error);
  } finally {
    client?.release();
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
