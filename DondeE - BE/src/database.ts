import fs from "node:fs";
import path from "node:path";
import { MongoClient, type Db } from "mongodb";
import { ALL_EVENTS } from "./eventsData.js";

export interface VenueRow {
  id_recinto: number;
  nombre_local: string;
  direccion: string;
  sector: string;
  ciudad: string;
  tipo: "club" | "pub" | "bar";
  lat: number;
  lng: number;
  patente_municipal: string;
  estado_validacion: string;
  rating: number;
  reviews_count: number;
  aforo_total: number;
  aforo_disponible: number;
  precio_entrada: number;
  ubicacion?: {
    type: string;
    coordinates: [number, number];
  };
  host?: any;
  resenas?: any[];
}

export interface EventRow {
  id_evento: number;
  titulo: string;
  descripcion: string;
  fecha_hora: string;
  precio_entrada: number;
  categoria_musical: string;
  aforo_total: number;
  aforo_disponible: number;
  id_recinto: number;
  nombre_local: string;
  direccion: string;
  ciudad: string;
  sector?: string;
  ubicacion?: {
    type: string;
    coordinates: [number, number];
  };
  banner_image?: string;
  productora?: string;
  ticket_provider?: string;
  hot?: boolean;
  artistas?: string[];
}

export interface SectorRow {
  name: string;
  city: string;
  lat: number;
  lng: number;
  venuesCount: number;
}

export interface SearchResult {
  venues: VenueRow[];
  events: EventRow[];
  sectors: SectorRow[];
}

class DatabaseManager {
  private mongoClient: MongoClient | null = null;
  private db: Db | null = null;
  private isMongoAvailable = false;
  private isInitialized = false;

  private venues: VenueRow[] = [];
  private events: EventRow[] = [];
  private sectors: SectorRow[] = [];
  private users: any[] = [];
  private reservations: any[] = [];

  constructor() {
    const uri = process.env.MONGODB_URI ?? "mongodb+srv://brunodiazfer1998_db_user:R13BtQy6J4KaW3Np@dondee.sw1bs6d.mongodb.net/dondee_db?retryWrites=true&w=majority";
    try {
      this.mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
    } catch (e) {
      this.mongoClient = null;
    }
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Load local NoSQL JSON datasets as immediate resilient storage
    this.loadLocalDatasets();

    // Try connecting to MongoDB Atlas
    if (this.mongoClient) {
      try {
        await this.mongoClient.connect();
        const dbName = process.env.MONGODB_DBNAME ?? "dondee_db";
        this.db = this.mongoClient.db(dbName);
        this.isMongoAvailable = true;
        console.log("Conectado a MongoDB Atlas NoSQL (Cluster dondee_db)");
      } catch (err: any) {
        this.isMongoAvailable = false;
        console.log("MongoDB Atlas no alcanzable en este momento (firewall/offline). Motor NoSQL local JSON activo (42 recintos, 126 eventos).");
      }
    }

    this.isInitialized = true;
  }

  private loadLocalDatasets(): void {
    try {
      const baseDir = path.resolve(process.cwd(), "..", "DondeE - BD", "nosql");
      if (fs.existsSync(path.join(baseDir, "recintos.json"))) {
        const rawVenues = JSON.parse(fs.readFileSync(path.join(baseDir, "recintos.json"), "utf-8"));
        this.venues = rawVenues.map((v: any) => ({
          ...v,
          lat: v.ubicacion?.coordinates ? v.ubicacion.coordinates[1] : v.lat,
          lng: v.ubicacion?.coordinates ? v.ubicacion.coordinates[0] : v.lng,
        }));
      }
      if (fs.existsSync(path.join(baseDir, "eventos.json"))) {
        this.events = JSON.parse(fs.readFileSync(path.join(baseDir, "eventos.json"), "utf-8"));
      }
      if (fs.existsSync(path.join(baseDir, "usuarios.json"))) {
        this.users = JSON.parse(fs.readFileSync(path.join(baseDir, "usuarios.json"), "utf-8"));
      }
      if (fs.existsSync(path.join(baseDir, "reservas.json"))) {
        this.reservations = JSON.parse(fs.readFileSync(path.join(baseDir, "reservas.json"), "utf-8"));
      }
    } catch (e) {
      console.warn("Aviso: No se pudieron cargar archivos de DondeE - BD/nosql, usando fallback in-memory.");
    }

    // Fallback if empty
    if (!this.events || this.events.length === 0) {
      this.events = ALL_EVENTS;
    }

    // Sectors / Localities Index
    this.sectors = [
      { name: "Barrio Puerto", city: "Valparaíso", lat: -33.0375, lng: -71.6310, venuesCount: 4 },
      { name: "Cerro Alegre", city: "Valparaíso", lat: -33.0412, lng: -71.6288, venuesCount: 3 },
      { name: "Cerro Concepción", city: "Valparaíso", lat: -33.0425, lng: -71.6265, venuesCount: 3 },
      { name: "Plaza Sotomayor", city: "Valparaíso", lat: -33.0390, lng: -71.6280, venuesCount: 2 },
      { name: "Plaza Aníbal Pinto", city: "Valparaíso", lat: -33.0442, lng: -71.6247, venuesCount: 3 },
      { name: "Subida Ecuador", city: "Valparaíso", lat: -33.0448, lng: -71.6272, venuesCount: 3 },
      { name: "Bellavista / Av. Errázuriz", city: "Valparaíso", lat: -33.0418, lng: -71.6212, venuesCount: 3 },
      { name: "Playa Ancha", city: "Valparaíso", lat: -33.0315, lng: -71.6395, venuesCount: 1 },
      { name: "Plaza Victoria / Condell", city: "Valparaíso", lat: -33.0465, lng: -71.6225, venuesCount: 2 },
      { name: "Reñaca", city: "Viña del Mar", lat: -32.9720, lng: -71.5450, venuesCount: 4 },
      { name: "Casino Enjoy / San Martín", city: "Viña del Mar", lat: -33.0185, lng: -71.5582, venuesCount: 5 },
      { name: "Casco Gastronómico (1-3 Poniente)", city: "Viña del Mar", lat: -33.0195, lng: -71.5545, venuesCount: 4 },
      { name: "1 Poniente", city: "Viña del Mar", lat: -33.0205, lng: -71.5552, venuesCount: 2 },
      { name: "3 Poniente", city: "Viña del Mar", lat: -33.0188, lng: -71.5538, venuesCount: 2 },
      { name: "Población Vergara (4-8 Norte)", city: "Viña del Mar", lat: -33.0140, lng: -71.5510, venuesCount: 5 },
      { name: "Playa Acapulco", city: "Viña del Mar", lat: -33.0160, lng: -71.5560, venuesCount: 2 },
      { name: "Sporting / 1 Norte", city: "Viña del Mar", lat: -33.0280, lng: -71.5385, venuesCount: 1 },
      { name: "Valparaíso", city: "Valparaíso", lat: -33.044, lng: -71.624, venuesCount: 21 },
      { name: "Viña del Mar", city: "Viña del Mar", lat: -33.019, lng: -71.555, venuesCount: 21 },
      { name: "Concón", city: "Gran Valparaíso", lat: -32.923, lng: -71.516, venuesCount: 0 },
      { name: "Quilpué", city: "Gran Valparaíso", lat: -33.049, lng: -71.442, venuesCount: 0 },
      { name: "Villa Alemana", city: "Gran Valparaíso", lat: -33.042, lng: -71.373, venuesCount: 0 },
      { name: "Santiago", city: "Región Metropolitana", lat: -33.4489, lng: -70.6693, venuesCount: 0 },
    ];
  }

  async search(query: string): Promise<SearchResult> {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { venues: [], events: [], sectors: [] };
    }

    if (this.isMongoAvailable && this.db) {
      try {
        const regex = new RegExp(q, "i");
        const vDocs = await this.db.collection("recintos").find({
          $or: [
            { nombre_local: regex },
            { direccion: regex },
            { sector: regex },
            { ciudad: regex }
          ]
        }).limit(15).toArray();

        const eDocs = await this.db.collection("eventos").find({
          $or: [
            { titulo: regex },
            { descripcion: regex },
            { categoria_musical: regex },
            { nombre_local: regex },
            { artistas: regex },
            { productora: regex }
          ]
        }).limit(15).toArray();

        const matchedVenues: VenueRow[] = vDocs.map((v: any) => ({
          id_recinto: v.id_recinto,
          nombre_local: v.nombre_local,
          direccion: v.direccion,
          sector: v.sector,
          ciudad: v.ciudad,
          tipo: v.tipo,
          lat: v.ubicacion?.coordinates ? v.ubicacion.coordinates[1] : -33.04,
          lng: v.ubicacion?.coordinates ? v.ubicacion.coordinates[0] : -71.62,
          patente_municipal: v.patente_municipal,
          estado_validacion: v.estado_validacion,
          rating: v.rating,
          reviews_count: v.reviews_count,
          aforo_total: v.aforo_total,
          aforo_disponible: v.aforo_disponible,
          precio_entrada: v.precio_entrada
        }));

        const matchedEvents: EventRow[] = eDocs.map((e: any) => ({
          id_evento: e.id_evento,
          titulo: e.titulo,
          descripcion: e.descripcion,
          fecha_hora: e.fecha_hora,
          precio_entrada: e.precio_entrada,
          categoria_musical: e.categoria_musical,
          aforo_total: e.aforo_total,
          aforo_disponible: e.aforo_disponible,
          id_recinto: e.id_recinto,
          nombre_local: e.nombre_local,
          direccion: e.direccion,
          ciudad: e.ciudad,
          sector: e.sector,
          banner_image: e.banner_image,
          productora: e.productora,
          ticket_provider: e.ticket_provider,
          hot: e.hot,
          artistas: e.artistas
        }));

        const matchedSectors = this.sectors.filter(
          (s) => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)
        );

        return { venues: matchedVenues, events: matchedEvents, sectors: matchedSectors };
      } catch (err) {
        console.error("Error al consultar MongoDB Atlas en search:", err);
      }
    }

    // Fast search across local document store
    const matchedVenues = this.venues.filter(
      (v) =>
        v.nombre_local.toLowerCase().includes(q) ||
        v.direccion.toLowerCase().includes(q) ||
        v.sector.toLowerCase().includes(q) ||
        v.ciudad.toLowerCase().includes(q) ||
        v.tipo.toLowerCase().includes(q)
    );

    const matchedEvents = this.events.filter(
      (e) =>
        e.titulo.toLowerCase().includes(q) ||
        e.descripcion.toLowerCase().includes(q) ||
        e.categoria_musical.toLowerCase().includes(q) ||
        e.nombre_local.toLowerCase().includes(q) ||
        (e.artistas && e.artistas.some((art) => art.toLowerCase().includes(q))) ||
        (e.productora && e.productora.toLowerCase().includes(q))
    );

    const matchedSectors = this.sectors.filter(
      (s) => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)
    );

    return {
      venues: matchedVenues,
      events: matchedEvents,
      sectors: matchedSectors,
    };
  }

  async getHealth() {
    return {
      ok: true,
      database: "connected",
      engine: this.isMongoAvailable
        ? "MongoDB Atlas 7.0+ (NoSQL Cluster dondee_db / GeoJSON 2dsphere)"
        : "Motor Documental NoSQL DondeE (Local GeoJSON/JSON Engine)",
      now: new Date().toISOString(),
      driver: "mongodb native driver",
      venues_count: this.venues.length,
      events_count: this.events.length,
      collections: ["recintos", "eventos", "usuarios", "reservas"]
    };
  }

  async getAllVenues(): Promise<VenueRow[]> {
    if (this.isMongoAvailable && this.db) {
      try {
        const docs = await this.db.collection("recintos").find({}).toArray();
        return docs.map((v: any) => ({
          ...v,
          lat: v.ubicacion?.coordinates ? v.ubicacion.coordinates[1] : v.lat,
          lng: v.ubicacion?.coordinates ? v.ubicacion.coordinates[0] : v.lng,
        }));
      } catch (e) {
        // Fallback to local
      }
    }
    return this.venues;
  }

  async getAllEvents(): Promise<EventRow[]> {
    if (this.isMongoAvailable && this.db) {
      try {
        return (await this.db.collection("eventos").find({}).toArray()) as any;
      } catch (e) {
        // Fallback to local
      }
    }
    return this.events;
  }

  async getAllUsers(): Promise<any[]> {
    if (this.isMongoAvailable && this.db) {
      try {
        return await this.db.collection("usuarios").find({}, { projection: { password_hash: 0 } }).toArray();
      } catch (e) {
        // Fallback to local
      }
    }
    return this.users.map(({ password_hash, ...rest }) => rest);
  }

  async getReviews(venueId?: number): Promise<any[]> {
    if (this.isMongoAvailable && this.db) {
      try {
        if (venueId) {
          const v = await this.db.collection("recintos").findOne({ id_recinto: venueId });
          return v?.resenas || [];
        }
        const venues = await this.db.collection("recintos").find({ "resenas.0": { $exists: true } }).toArray();
        return venues.flatMap((v: any) => v.resenas.map((r: any) => ({ ...r, id_recinto: v.id_recinto, nombre_local: v.nombre_local })));
      } catch (e) {
        // Fallback
      }
    }

    if (venueId) {
      const v = this.venues.find(v => v.id_recinto === venueId);
      return v?.resenas || [];
    }
    return this.venues.flatMap(v => (v.resenas || []).map(r => ({ ...r, id_recinto: v.id_recinto, nombre_local: v.nombre_local })));
  }

  async createReview(data: { rating: number; comment: string; userId: number; venueId: number; userName?: string }): Promise<any> {
    const newReview = {
      id_resena: Date.now(),
      calificacion: data.rating,
      comentario: data.comment,
      fecha: new Date().toISOString(),
      usuario: {
        id_usuario: data.userId,
        nombre: data.userName || "Usuario DondeE"
      }
    };

    if (this.isMongoAvailable && this.db) {
      try {
        await this.db.collection("recintos").updateOne(
          { id_recinto: data.venueId },
          {
            $push: { resenas: newReview } as any,
            $inc: { reviews_count: 1 }
          }
        );
      } catch (e) {
        console.error("Error al persistir reseña en MongoDB:", e);
      }
    }

    // Local update
    const v = this.venues.find(x => x.id_recinto === data.venueId);
    if (v) {
      if (!v.resenas) v.resenas = [];
      v.resenas.push(newReview);
      v.reviews_count = (v.reviews_count || 0) + 1;
    }

    return newReview;
  }

  async createReservation(data: { userId: number; eventId: number; quantity: number; totalPaid: number; userName?: string }): Promise<any> {
    const event = this.events.find(e => e.id_evento === data.eventId);
    const newReservation = {
      id_reserva: Date.now(),
      fecha_reserva: new Date().toISOString(),
      estado_pago: "PAGADO",
      cantidad_entradas: data.quantity,
      total_pagado: data.totalPaid,
      usuario: {
        id_usuario: data.userId,
        nombre: data.userName || "Cliente DondeE"
      },
      evento: {
        id_evento: data.eventId,
        titulo: event?.titulo || "Evento Nocturno",
        nombre_local: event?.nombre_local || "Recinto DondeE"
      }
    };

    if (this.isMongoAvailable && this.db) {
      try {
        await this.db.collection("reservas").insertOne(newReservation);
        await this.db.collection("eventos").updateOne(
          { id_evento: data.eventId },
          { $inc: { aforo_disponible: -data.quantity } }
        );
      } catch (e) {
        console.error("Error al persistir reserva en MongoDB:", e);
      }
    }

    if (event) {
      event.aforo_disponible = Math.max(0, event.aforo_disponible - data.quantity);
    }
    this.reservations.push(newReservation);

    return newReservation;
  }

  // --- NoSQL AGGREGATIONS & CONSULTAS DE RÚBRICA ---

  // 1. Resumen por Recinto (Aggregation $group)
  async getVenuesSummary(): Promise<any[]> {
    if (this.isMongoAvailable && this.db) {
      try {
        return await this.db.collection("eventos").aggregate([
          {
            $group: {
              _id: "$id_recinto",
              nombre_local: { $first: "$nombre_local" },
              total_eventos: { $sum: 1 },
              capacidad_total_eventos: { $sum: "$aforo_total" },
              precio_promedio: { $avg: "$precio_entrada" }
            }
          },
          {
            $project: {
              id_recinto: "$_id",
              nombre_local: 1,
              total_eventos: 1,
              capacidad_total_eventos: 1,
              precio_promedio: { $round: ["$precio_promedio", 2] }
            }
          },
          { $sort: { total_eventos: -1 } }
        ]).toArray();
      } catch (e) {
        console.error("Error en aggregate venues-summary:", e);
      }
    }

    // Local fallback
    const summaryMap = new Map<number, { id_recinto: number; nombre_local: string; count: number; cap: number; sumPrice: number }>();
    for (const e of this.events) {
      const existing = summaryMap.get(e.id_recinto) || {
        id_recinto: e.id_recinto,
        nombre_local: e.nombre_local,
        count: 0,
        cap: 0,
        sumPrice: 0
      };
      existing.count++;
      existing.cap += e.aforo_total;
      existing.sumPrice += e.precio_entrada;
      summaryMap.set(e.id_recinto, existing);
    }

    return Array.from(summaryMap.values())
      .map(s => ({
        id_recinto: s.id_recinto,
        nombre_local: s.nombre_local,
        total_eventos: s.count,
        capacidad_total_eventos: s.cap,
        precio_promedio: Math.round((s.sumPrice / s.count) * 100) / 100
      }))
      .sort((a, b) => b.total_eventos - a.total_eventos);
  }

  // 2. Ranking de Locales por Reseñas (Aggregation $match post-group / Having)
  async getTopRatedVenues(): Promise<any[]> {
    if (this.isMongoAvailable && this.db) {
      try {
        return await this.db.collection("recintos").aggregate([
          { $match: { "resenas.0": { $exists: true } } },
          {
            $project: {
              id_recinto: 1,
              nombre_local: 1,
              cantidad_resenas: { $size: "$resenas" },
              promedio_real: { $round: [{ $avg: "$resenas.calificacion" }, 1] }
            }
          },
          { $sort: { promedio_real: -1, cantidad_resenas: -1 } },
          { $limit: 5 }
        ]).toArray();
      } catch (e) {
        console.error("Error en aggregate top-rated:", e);
      }
    }

    // Local fallback
    return this.venues
      .filter(v => v.resenas && v.resenas.length >= 1)
      .map(v => {
        const sum = v.resenas!.reduce((acc, r) => acc + (r.calificacion || 0), 0);
        const avg = sum / v.resenas!.length;
        return {
          id_recinto: v.id_recinto,
          nombre_local: v.nombre_local,
          cantidad_resenas: v.resenas!.length,
          promedio_real: Math.round(avg * 10) / 10
        };
      })
      .sort((a, b) => b.promedio_real - a.promedio_real || b.cantidad_resenas - a.cantidad_resenas)
      .slice(0, 5);
  }

  // 3. Alerta de Aforo Crítico (MQL $expr con división)
  async getAlmostSoldOutEvents(): Promise<any[]> {
    if (this.isMongoAvailable && this.db) {
      try {
        return await this.db.collection("eventos").find({
          aforo_disponible: { $gt: 0 },
          $expr: {
            $lte: [{ $divide: ["$aforo_disponible", "$aforo_total"] }, 0.20]
          }
        }).sort({ aforo_disponible: 1 }).toArray();
      } catch (e) {
        console.error("Error en find almost-sold-out:", e);
      }
    }

    // Local fallback
    return this.events
      .filter(e => e.aforo_disponible > 0 && e.aforo_disponible / e.aforo_total <= 0.20)
      .map(e => ({
        id_evento: e.id_evento,
        titulo: e.titulo,
        nombre_local: e.nombre_local,
        aforo_disponible: e.aforo_disponible,
        aforo_total: e.aforo_total,
        porcentaje_disponible: Math.round((e.aforo_disponible / e.aforo_total) * 1000) / 10
      }))
      .sort((a, b) => a.porcentaje_disponible - b.porcentaje_disponible);
  }

  // 4. Usuarios Inactivos (Aggregation $lookup + $match vacíos / Except)
  async getInactiveUsers(): Promise<any[]> {
    if (this.isMongoAvailable && this.db) {
      try {
        return await this.db.collection("usuarios").aggregate([
          {
            $lookup: {
              from: "reservas",
              localField: "id_usuario",
              foreignField: "usuario.id_usuario",
              as: "compras"
            }
          },
          { $match: { "compras": { $size: 0 } } },
          { $project: { _id: 0, id_usuario: 1, nombre: 1, email: 1, rol: 1 } }
        ]).toArray();
      } catch (e) {
        console.error("Error en aggregate inactive users:", e);
      }
    }

    // Local fallback
    const buyerIds = new Set(this.reservations.map(r => r.usuario?.id_usuario));
    return this.users
      .filter(u => !buyerIds.has(u.id_usuario))
      .map(({ id_usuario, nombre, email, rol }) => ({ id_usuario, nombre, email, rol }));
  }

  // 5. Búsqueda Geoespacial por Radio de Cercanía (GeoJSON $near / $geoWithin)
  async getVenuesNear(lng: number, lat: number, maxDistanceMeters: number = 3000): Promise<any[]> {
    if (this.isMongoAvailable && this.db) {
      try {
        return await this.db.collection("recintos").find({
          ubicacion: {
            $near: {
              $geometry: { type: "Point", coordinates: [lng, lat] },
              $maxDistance: maxDistanceMeters
            }
          }
        }).toArray();
      } catch (e) {
        console.error("Error en $near query:", e);
      }
    }

    // Local fallback (Haversine formula)
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371000; // metros
    return this.venues
      .map(v => {
        const dLat = toRad(v.lat - lat);
        const dLng = toRad(v.lng - lng);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat)) * Math.cos(toRad(v.lat)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = Math.round(R * c);
        return { ...v, distancia_metros: dist };
      })
      .filter(v => v.distancia_metros <= maxDistanceMeters)
      .sort((a, b) => a.distancia_metros - b.distancia_metros);
  }

  // Estadísticas generales de colecciones NoSQL
  async getCollectionsStats(): Promise<any> {
    return {
      recintos: this.venues.length,
      eventos: this.events.length,
      usuarios: this.users.length,
      reservas: this.reservations.length,
      isMongoAvailable: this.isMongoAvailable
    };
  }
}

export const dbManager = new DatabaseManager();
