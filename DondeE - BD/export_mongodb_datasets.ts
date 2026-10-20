import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MOCK_VENUES } from "../DondeE - FE/src/data/mockVenues";
import { MOCK_EVENTS } from "../DondeE - FE/src/data/mockEvents";
import { MOCK_CLIENTS } from "../DondeE - FE/src/data/mockClients";

// Helper to generate deterministic ObjectId hex string (24 hex characters)
function makeObjectId(prefix: string, idNum: number): string {
  const hexNum = idNum.toString(16).padStart(8, "0");
  return `${prefix.padEnd(16, "0").slice(0, 16)}${hexNum}`;
}

// 1. USUARIOS (Clientes + Hosts Comerciales + Admin)
const HOSTS = [
  {
    id_usuario: 9,
    nombre: "Host Valparaíso Puerto SpA",
    email: "contacto@valpopuerto.cl",
    rol: "HOST",
    ciudad: "Valparaíso",
    fecha_registro: "2026-08-15T10:00:00.000Z",
  },
  {
    id_usuario: 10,
    nombre: "Host Cerros Alegre & Concepción",
    email: "administracion@cerroalegre.cl",
    rol: "HOST",
    ciudad: "Valparaíso",
    fecha_registro: "2026-08-18T11:30:00.000Z",
  },
  {
    id_usuario: 11,
    nombre: "Host Viña Poniente & Casino",
    email: "contacto@vinaponiente.cl",
    rol: "HOST",
    ciudad: "Viña del Mar",
    fecha_registro: "2026-08-20T14:15:00.000Z",
  },
  {
    id_usuario: 12,
    nombre: "Host Reñaca Beach Clubs",
    email: "contacto@renacabeach.cl",
    rol: "HOST",
    ciudad: "Viña del Mar",
    fecha_registro: "2026-08-22T16:45:00.000Z",
  },
  {
    id_usuario: 13,
    nombre: "Administrador General DondeE",
    email: "admin@dondee.cl",
    rol: "ADMIN",
    ciudad: "Gran Valparaíso",
    fecha_registro: "2026-08-01T09:00:00.000Z",
  },
];

const usuariosData = [
  ...MOCK_CLIENTS.map((c) => ({
    _id: { $oid: makeObjectId("67069b1200000001", c.id_usuario) },
    id_usuario: c.id_usuario,
    nombre: c.name,
    email: c.email,
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: c.role,
    ciudad: c.city,
    bio: c.bio,
    fecha_registro: "2026-09-01T12:00:00.000Z",
  })),
  ...HOSTS.map((h) => ({
    _id: { $oid: makeObjectId("67069b1200000001", h.id_usuario) },
    id_usuario: h.id_usuario,
    nombre: h.nombre,
    email: h.email,
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: h.rol,
    ciudad: h.ciudad,
    fecha_registro: h.fecha_registro,
  })),
];

// Helper to determine host for venue
function getHostForVenue(sector: string, city: string) {
  if (city === "Viña del Mar") {
    if (sector.toLowerCase().includes("reñaca")) {
      return { id_usuario: 12, nombre: "Host Reñaca Beach Clubs", email: "contacto@renacabeach.cl" };
    }
    return { id_usuario: 11, nombre: "Host Viña Poniente & Casino", email: "contacto@vinaponiente.cl" };
  } else {
    if (sector.toLowerCase().includes("alegre") || sector.toLowerCase().includes("concepción")) {
      return { id_usuario: 10, nombre: "Host Cerros Alegre & Concepción", email: "administracion@cerroalegre.cl" };
    }
    return { id_usuario: 9, nombre: "Host Valparaíso Puerto SpA", email: "contacto@valpopuerto.cl" };
  }
}

// 2. RECINTOS (42 locales con GeoJSON, Extended Reference de Host y Reseñas embebidas)
let globalReviewCounter = 1;
const allReviewsList: any[] = [];

const recintosData = MOCK_VENUES.map((v) => {
  const host = getHostForVenue(v.sector, v.city);
  
  const embeddedReviews = (v.reviews || []).map((r, rIdx) => {
    const currentReviewId = globalReviewCounter++;
    
    // match author with a known user if possible
    const authorUser = usuariosData.find((u) => u.email === r.userEmail) || {
      id_usuario: (rIdx % 8) + 1,
      nombre: r.userName,
      email: r.userEmail,
    };

    const reviewDoc = {
      _id: { $oid: makeObjectId("67069b1200000005", currentReviewId) },
      id_resena: currentReviewId,
      id_recinto: v.id_recinto,
      nombre_local: v.name,
      calificacion: r.rating,
      comentario: r.comment,
      fecha: "2026-10-07T12:00:00.000Z",
      usuario: {
        id_usuario: authorUser.id_usuario,
        nombre: authorUser.nombre,
        email: authorUser.email,
      },
    };

    allReviewsList.push(reviewDoc);

    return {
      id_resena: currentReviewId,
      calificacion: r.rating,
      comentario: r.comment,
      fecha: "2026-10-07T12:00:00.000Z",
      usuario: {
        id_usuario: authorUser.id_usuario,
        nombre: authorUser.nombre,
        email: authorUser.email,
      },
    };
  });

  return {
    _id: { $oid: makeObjectId("67069b1200000002", v.id_recinto) },
    id_recinto: v.id_recinto,
    nombre_local: v.name,
    direccion: v.address,
    sector: v.sector,
    ciudad: v.city,
    tipo: v.type,
    patente_municipal: `PAT-${v.city === "Valparaíso" ? "VALP" : "VINA"}-${v.id_recinto.toString().padStart(3, "0")}`,
    estado_validacion: "APROBADO",
    aforo_total: v.capacity,
    aforo_disponible: v.available,
    precio_entrada: v.price,
    rating: v.rating,
    reviews_count: v.reviewsCount,
    genero_musical: v.genre,
    horario: v.schedule,
    descripcion: v.description,
    ticket_provider: v.ticketProvider || "Passline",
    hot: v.hot || false,
    ubicacion: {
      type: "Point",
      coordinates: [v.lng, v.lat], // GeoJSON order: [longitude, latitude] in WGS84
    },
    host: host,
    resenas: embeddedReviews,
  };
});

// 3. EVENTOS (126 eventos con datos desnormalizados del local anfitrión)
const eventosData = MOCK_EVENTS.map((e) => {
  const sourceVenue = MOCK_VENUES.find((v) => v.id === e.venueId);
  const venue =
    recintosData.find((v) => v.id_recinto === sourceVenue?.id_recinto) || recintosData[0];

  return {
    _id: { $oid: makeObjectId("67069b1200000003", e.id_evento) },
    id_evento: e.id_evento,
    titulo: e.title,
    descripcion: e.description,
    fecha_hora: "2026-10-10T22:30:00.000Z",
    fecha_display: e.date,
    horario: e.time,
    precio_entrada: e.price,
    categoria_musical: e.genre,
    aforo_total: e.totalCapacity,
    aforo_disponible: e.availableCapacity,
    id_recinto: venue.id_recinto,
    nombre_local: venue.nombre_local,
    direccion: venue.direccion,
    ciudad: venue.ciudad,
    sector: venue.sector,
    ubicacion: {
      type: "Point",
      coordinates: venue.ubicacion.coordinates,
    },
    artistas: e.djsOrArtists || [],
    banner_image: e.bannerImage,
    productora: e.producer || "Producción Oficial",
    ticket_provider: e.ticketProvider || venue.ticket_provider,
    hot: e.hot || false,
  };
});

// 4. RESERVAS (Transacciones de compra con snapshot inmutable)
let resIdCounter = 1;
const reservasData: any[] = [];

MOCK_CLIENTS.forEach((c) => {
  (c.activeTickets || []).forEach((t) => {
    const resId = resIdCounter++;
    const relatedEvent = eventosData.find((e) => e.titulo === t.eventTitle) || eventosData[0];
    const relatedVenue = recintosData.find((v) => v.nombre_local === t.venueName) || recintosData[0];

    reservasData.push({
      _id: { $oid: makeObjectId("67069b1200000004", resId) },
      id_reserva: resId,
      ticket_code: t.ticketId,
      fecha_reserva: "2026-09-21T18:30:00.000Z",
      estado_pago: "PAGADO",
      cantidad_entradas: t.quantity,
      precio_unitario: t.unitPrice,
      cargo_servicio: t.serviceFee,
      total_pagado: t.totalPaid,
      ticket_provider: t.provider,
      transaction_token: t.transactionToken,
      usuario: {
        id_usuario: c.id_usuario,
        nombre: c.name,
        email: c.email,
        ciudad: c.city,
      },
      evento: {
        id_evento: relatedEvent.id_evento,
        titulo: t.eventTitle,
        fecha_hora: "2026-09-21T23:00:00.000Z",
        nombre_local: relatedVenue.nombre_local,
        direccion: relatedVenue.direccion,
        ciudad: relatedVenue.ciudad,
      },
    });
  });
});

// If fewer than 8 reservations, supplement with standard test mock bookings
while (reservasData.length < 8) {
  const resId = resIdCounter++;
  const u = usuariosData[resId % 8];
  const e = eventosData[resId * 3];
  reservasData.push({
    _id: { $oid: makeObjectId("67069b1200000004", resId) },
    id_reserva: resId,
    ticket_code: `DONDEE-TK-00${resId}`,
    fecha_reserva: "2026-10-09T13:00:00.000Z",
    estado_pago: "PAGADO",
    cantidad_entradas: 2,
    precio_unitario: e.precio_entrada,
    cargo_servicio: Math.round(e.precio_entrada * 0.05),
    total_pagado: Math.round(e.precio_entrada * 2 * 1.05),
    ticket_provider: e.ticket_provider,
    transaction_token: `TX-TBK-${100000 + resId}`,
    usuario: {
      id_usuario: u.id_usuario,
      nombre: u.nombre,
      email: u.email,
      ciudad: u.ciudad,
    },
    evento: {
      id_evento: e.id_evento,
      titulo: e.titulo,
      fecha_hora: e.fecha_hora,
      nombre_local: e.nombre_local,
      direccion: e.direccion,
      ciudad: e.ciudad,
    },
  });
}

// 5. RESEÑAS (Colección independiente con todas las reseñas: 25+ registros)
// We already populated allReviewsList above during recintos iteration

// Target export directories
const dirs = [
  path.resolve("..", "DondeE - BD", "datasets_json"),
  path.resolve("..", "Documentos", "datasets_json"),
];

dirs.forEach((d) => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const filesToSave = [
  { name: "recintos.json", data: recintosData, count: recintosData.length },
  { name: "eventos.json", data: eventosData, count: eventosData.length },
  { name: "usuarios.json", data: usuariosData, count: usuariosData.length },
  { name: "reservas.json", data: reservasData, count: reservasData.length },
  { name: "resenas.json", data: allReviewsList, count: allReviewsList.length },
];

console.log("\n========================================================");
console.log("   GENERADOR DE DATASETS JSON CANÓNICOS (ENTREGA 2)");
console.log("========================================================\n");

filesToSave.forEach((f) => {
  const jsonContent = JSON.stringify(f.data, null, 2);
  dirs.forEach((d) => {
    const filePath = path.join(d, f.name);
    fs.writeFileSync(filePath, jsonContent, "utf-8");
  });
  console.log(`✓ ${f.name.padEnd(16)} -> ${f.count.toString().padStart(4)} documentos guardados`);
});

console.log("\n--- RESUMEN DE INTEGRIDAD Y CUADRATURA CON POSTGRESQL ---");
console.log(`• Recintos:  ${recintosData.length} (42 locales: 21 Valparaíso, 21 Viña del Mar, IDs 1..42)`);
console.log(`• Eventos:   ${eventosData.length} (126 eventos: 3 por recinto, IDs 1..126)`);
console.log(`• Usuarios:  ${usuariosData.length} (8 clientes asistentes + 4 hosts comerciales + 1 admin)`);
console.log(`• Reservas:  ${reservasData.length} (transacciones con snapshot histórico)`);
console.log(`• Reseñas:   ${allReviewsList.length} (reseñas con rating 1..5, comentarios y usuarios)`);
console.log("========================================================\n");
