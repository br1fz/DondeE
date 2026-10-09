import fs from "node:fs";
import path from "node:path";
import { ALL_EVENTS } from "./eventsData.js";

// Users Dataset
const usuarios = [
  {
    id_usuario: 1,
    nombre: "Administrador General DondeE",
    email: "admin@dondee.cl",
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: "ADMIN",
    fecha_registro: "2026-09-01T10:00:00.000Z"
  },
  {
    id_usuario: 2,
    nombre: "Valentina Morales",
    email: "valen.morales@gmail.com",
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: "CLIENTE",
    fecha_registro: "2026-09-10T14:30:00.000Z"
  },
  {
    id_usuario: 3,
    nombre: "Diego Silva",
    email: "diego.silva@alumnos.usm.cl",
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: "CLIENTE",
    fecha_registro: "2026-09-11T16:15:00.000Z"
  },
  {
    id_usuario: 4,
    nombre: "Camila Rojas",
    email: "camila.rojas@gmail.com",
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: "CLIENTE",
    fecha_registro: "2026-09-12T11:00:00.000Z"
  },
  {
    id_usuario: 5,
    nombre: "Ignacio Valenzuela",
    email: "ignacio.valenzuela@gmail.com",
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: "CLIENTE",
    fecha_registro: "2026-09-12T19:20:00.000Z"
  },
  {
    id_usuario: 6,
    nombre: "Sofía Henríquez",
    email: "sofia.henriquez@outlook.com",
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: "CLIENTE",
    fecha_registro: "2026-09-13T18:45:00.000Z"
  },
  {
    id_usuario: 7,
    nombre: "Matías Tapia",
    email: "matias.tapia@alumnos.uv.cl",
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: "CLIENTE",
    fecha_registro: "2026-09-14T20:10:00.000Z"
  },
  {
    id_usuario: 8,
    nombre: "Francisca Contreras",
    email: "fran.contreras@gmail.com",
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: "CLIENTE",
    fecha_registro: "2026-09-15T15:30:00.000Z"
  },
  {
    id_usuario: 9,
    nombre: "Lucas Sepúlveda",
    email: "lucas.sepulveda@gmail.com",
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: "CLIENTE",
    fecha_registro: "2026-09-15T22:00:00.000Z"
  },
  {
    id_usuario: 10,
    nombre: "Host Valparaíso Puerto SpA",
    email: "contacto@valpopuerto.cl",
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: "HOST",
    fecha_registro: "2026-09-02T12:00:00.000Z"
  },
  {
    id_usuario: 11,
    nombre: "Host Cerros Alegre & Concepción",
    email: "administracion@cerroalegre.cl",
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: "HOST",
    fecha_registro: "2026-09-02T12:30:00.000Z"
  },
  {
    id_usuario: 12,
    nombre: "Host Viña Poniente & Casino",
    email: "contacto@vinaponiente.cl",
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: "HOST",
    fecha_registro: "2026-09-03T09:15:00.000Z"
  },
  {
    id_usuario: 13,
    nombre: "Host Reñaca Beach Clubs",
    email: "contacto@renacabeach.cl",
    password_hash: "$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I",
    rol: "HOST",
    fecha_registro: "2026-09-03T10:00:00.000Z"
  }
];

// Raw Venues from DB
const rawVenues = [
  { id_recinto: 1, nombre_local: "Club El Huevo", direccion: "Blanco 1386, Valparaíso", sector: "Barrio Puerto / Blanco", ciudad: "Valparaíso", tipo: "club", lat: -33.0425, lng: -71.6245, patente_municipal: "PAT-VALP-001", estado_validacion: "APROBADO", rating: 4.8, reviews_count: 420, aforo_total: 500, aforo_disponible: 42, precio_entrada: 10000, id_host: 10 },
  { id_recinto: 2, nombre_local: "Bar La Playa", direccion: "Serrano 568, Barrio Puerto, Valparaíso", sector: "Barrio Puerto Histórico", ciudad: "Valparaíso", tipo: "bar", lat: -33.0375, lng: -71.6310, patente_municipal: "PAT-VALP-002", estado_validacion: "APROBADO", rating: 4.9, reviews_count: 530, aforo_total: 120, aforo_disponible: 15, precio_entrada: 0, id_host: 10 },
  { id_recinto: 3, nombre_local: "Bar Cinzano", direccion: "Plaza Aníbal Pinto 1182, Valparaíso", sector: "Plaza Aníbal Pinto", ciudad: "Valparaíso", tipo: "bar", lat: -33.0445, lng: -71.6248, patente_municipal: "PAT-VALP-003", estado_validacion: "APROBADO", rating: 4.7, reviews_count: 380, aforo_total: 140, aforo_disponible: 22, precio_entrada: 5000, id_host: 10 },
  { id_recinto: 4, nombre_local: "Terraza Bellavista Valpo", direccion: "Blanco 1240, Bellavista, Valparaíso", sector: "Bellavista / Vista Bahía", ciudad: "Valparaíso", tipo: "pub", lat: -33.0440, lng: -71.6220, patente_municipal: "PAT-VALP-004", estado_validacion: "APROBADO", rating: 4.6, reviews_count: 290, aforo_total: 180, aforo_disponible: 35, precio_entrada: 5000, id_host: 10 },
  { id_recinto: 5, nombre_local: "El Gato en la Ventana", direccion: "Cumming 113, Subida Ecuador, Valparaíso", sector: "Subida Ecuador / Cumming", ciudad: "Valparaíso", tipo: "bar", lat: -33.0448, lng: -71.6272, patente_municipal: "PAT-VALP-005", estado_validacion: "APROBADO", rating: 4.6, reviews_count: 210, aforo_total: 90, aforo_disponible: 18, precio_entrada: 3000, id_host: 10 },
  { id_recinto: 6, nombre_local: "El Internado Resto-Cultural", direccion: "Pasaje Dimalow 167, Cerro Alegre, Valparaíso", sector: "Cerro Alegre / Paseo Dimalow", ciudad: "Valparaíso", tipo: "pub", lat: -33.0412, lng: -71.6288, patente_municipal: "PAT-VALP-006", estado_validacion: "APROBADO", rating: 4.8, reviews_count: 340, aforo_total: 160, aforo_disponible: 28, precio_entrada: 4000, id_host: 11 },
  { id_recinto: 7, nombre_local: "Cervecería Altamira", direccion: "Av. Elías 122, Valparaíso", sector: "Pie de Ascensor Reina Victoria", ciudad: "Valparaíso", tipo: "pub", lat: -33.0438, lng: -71.6265, patente_municipal: "PAT-VALP-007", estado_validacion: "APROBADO", rating: 4.7, reviews_count: 410, aforo_total: 150, aforo_disponible: 30, precio_entrada: 4000, id_host: 11 },
  { id_recinto: 8, nombre_local: "Mascara Pub & Club", direccion: "Plaza Aníbal Pinto 1178, Valparaíso", sector: "Plaza Aníbal Pinto", ciudad: "Valparaíso", tipo: "club", lat: -33.0442, lng: -71.6247, patente_municipal: "PAT-VALP-008", estado_validacion: "APROBADO", rating: 4.5, reviews_count: 310, aforo_total: 220, aforo_disponible: 40, precio_entrada: 7000, id_host: 10 },
  { id_recinto: 9, nombre_local: "La Piedra Feliz", direccion: "Av. Errázuriz 1054, Valparaíso", sector: "Av. Errázuriz / Borde Mar", ciudad: "Valparaíso", tipo: "club", lat: -33.0418, lng: -71.6212, patente_municipal: "PAT-VALP-009", estado_validacion: "APROBADO", rating: 4.6, reviews_count: 450, aforo_total: 350, aforo_disponible: 55, precio_entrada: 8000, id_host: 10 },
  { id_recinto: 10, nombre_local: "Bar Liberty", direccion: "Cochrane 115, Plaza Echaurren, Valparaíso", sector: "Plaza Echaurren / Barrio Puerto", ciudad: "Valparaíso", tipo: "bar", lat: -33.0365, lng: -71.6325, patente_municipal: "PAT-VALP-010", estado_validacion: "APROBADO", rating: 4.9, reviews_count: 390, aforo_total: 80, aforo_disponible: 12, precio_entrada: 0, id_host: 10 },
  { id_recinto: 11, nombre_local: "Páramo Bar", direccion: "Condell 1395, Valparaíso", sector: "Condell / Teatro Municipal", ciudad: "Valparaíso", tipo: "bar", lat: -33.0458, lng: -71.6235, patente_municipal: "PAT-VALP-011", estado_validacion: "APROBADO", rating: 4.5, reviews_count: 180, aforo_total: 100, aforo_disponible: 20, precio_entrada: 4000, id_host: 10 },
  { id_recinto: 12, nombre_local: "El Rincón de las Guitarras", direccion: "Freire 631, Valparaíso", sector: "El Almendral / Freire", ciudad: "Valparaíso", tipo: "bar", lat: -33.0478, lng: -71.6185, patente_municipal: "PAT-VALP-012", estado_validacion: "APROBADO", rating: 4.8, reviews_count: 260, aforo_total: 110, aforo_disponible: 14, precio_entrada: 5000, id_host: 10 },
  { id_recinto: 13, nombre_local: "Bar Proa Valparaíso", direccion: "Cochrane 451, Plaza Sotomayor, Valparaíso", sector: "Plaza Sotomayor", ciudad: "Valparaíso", tipo: "pub", lat: -33.0390, lng: -71.6280, patente_municipal: "PAT-VALP-013", estado_validacion: "APROBADO", rating: 4.6, reviews_count: 230, aforo_total: 130, aforo_disponible: 25, precio_entrada: 4000, id_host: 10 },
  { id_recinto: 14, nombre_local: "Pagano Club", direccion: "Av. Errázuriz 1080, Valparaíso", sector: "Av. Errázuriz", ciudad: "Valparaíso", tipo: "club", lat: -33.0415, lng: -71.6210, patente_municipal: "PAT-VALP-014", estado_validacion: "APROBADO", rating: 4.7, reviews_count: 360, aforo_total: 300, aforo_disponible: 48, precio_entrada: 8000, id_host: 10 },
  { id_recinto: 15, nombre_local: "Waddington Bar & Resto", direccion: "Av. Gran Bretaña 437, Playa Ancha, Valparaíso", sector: "Playa Ancha Histórico", ciudad: "Valparaíso", tipo: "pub", lat: -33.0315, lng: -71.6395, patente_municipal: "PAT-VALP-015", estado_validacion: "APROBADO", rating: 4.7, reviews_count: 240, aforo_total: 140, aforo_disponible: 26, precio_entrada: 4500, id_host: 10 },
  { id_recinto: 16, nombre_local: "Bar Flamingo", direccion: "Urriola 560, Cerro Alegre, Valparaíso", sector: "Cerro Alegre / Urriola", ciudad: "Valparaíso", tipo: "bar", lat: -33.0428, lng: -71.6268, patente_municipal: "PAT-VALP-016", estado_validacion: "APROBADO", rating: 4.5, reviews_count: 190, aforo_total: 85, aforo_disponible: 16, precio_entrada: 3500, id_host: 11 },
  { id_recinto: 17, nombre_local: "House Rock Bar", direccion: "Cumming 98, Subida Ecuador, Valparaíso", sector: "Subida Ecuador", ciudad: "Valparaíso", tipo: "pub", lat: -33.0442, lng: -71.6268, patente_municipal: "PAT-VALP-017", estado_validacion: "APROBADO", rating: 4.6, reviews_count: 280, aforo_total: 150, aforo_disponible: 32, precio_entrada: 5000, id_host: 10 },
  { id_recinto: 18, nombre_local: "Fauna Restaurant & Bar", direccion: "Pasaje Dimalow 166, Cerro Alegre, Valparaíso", sector: "Cerro Alegre", ciudad: "Valparaíso", tipo: "bar", lat: -33.0415, lng: -71.6285, patente_municipal: "PAT-VALP-018", estado_validacion: "APROBADO", rating: 4.8, reviews_count: 480, aforo_total: 170, aforo_disponible: 24, precio_entrada: 6000, id_host: 11 },
  { id_recinto: 19, nombre_local: "Trolebús Bar", direccion: "Condell 1450, Valparaíso", sector: "Plaza Victoria / Condell", ciudad: "Valparaíso", tipo: "bar", lat: -33.0465, lng: -71.6225, patente_municipal: "PAT-VALP-019", estado_validacion: "APROBADO", rating: 4.4, reviews_count: 150, aforo_total: 95, aforo_disponible: 19, precio_entrada: 3000, id_host: 10 },
  { id_recinto: 20, nombre_local: "Restobar El Cielo", direccion: "San Juan de Dios 555, Subida Ecuador, Valparaíso", sector: "San Juan de Dios / Subida Ecuador", ciudad: "Valparaíso", tipo: "pub", lat: -33.0460, lng: -71.6280, patente_municipal: "PAT-VALP-020", estado_validacion: "APROBADO", rating: 4.5, reviews_count: 170, aforo_total: 110, aforo_disponible: 21, precio_entrada: 4000, id_host: 10 },
  { id_recinto: 21, nombre_local: "Club Subterráneo Valpo", direccion: "Cochrane 560, Valparaíso", sector: "Barrio Puerto / Cochrane", ciudad: "Valparaíso", tipo: "club", lat: -33.0385, lng: -71.6295, patente_municipal: "PAT-VALP-021", estado_validacion: "APROBADO", rating: 4.6, reviews_count: 290, aforo_total: 240, aforo_disponible: 38, precio_entrada: 7000, id_host: 10 },
  { id_recinto: 22, nombre_local: "Club OVO (Enjoy Viña)", direccion: "Av. San Martín 199, Viña del Mar", sector: "Av. San Martín / Casino", ciudad: "Viña del Mar", tipo: "club", lat: -33.0185, lng: -71.5582, patente_municipal: "PAT-VINA-101", estado_validacion: "APROBADO", rating: 4.8, reviews_count: 560, aforo_total: 600, aforo_disponible: 75, precio_entrada: 18000, id_host: 12 },
  { id_recinto: 23, nombre_local: "Journal Bar & Resto", direccion: "3 Poniente 420, Viña del Mar", sector: "3 Poniente / Casco Gastronómico", ciudad: "Viña del Mar", tipo: "pub", lat: -33.0192, lng: -71.5540, patente_municipal: "PAT-VINA-102", estado_validacion: "APROBADO", rating: 4.6, reviews_count: 320, aforo_total: 180, aforo_disponible: 30, precio_entrada: 5000, id_host: 12 },
  { id_recinto: 24, nombre_local: "Stylo Sunset & Lounge", direccion: "Av. San Martín 650, Viña del Mar", sector: "Av. San Martín / Playa Acapulco", ciudad: "Viña del Mar", tipo: "pub", lat: -33.0160, lng: -71.5560, patente_municipal: "PAT-VINA-103", estado_validacion: "APROBADO", rating: 4.7, reviews_count: 340, aforo_total: 200, aforo_disponible: 34, precio_entrada: 6000, id_host: 12 },
  { id_recinto: 25, nombre_local: "Living Club Reñaca", direccion: "Av. Borgoño 14500, Sector 5, Reñaca", sector: "Reñaca / Sector 5 Costanera", ciudad: "Viña del Mar", tipo: "club", lat: -32.9715, lng: -71.5450, patente_municipal: "PAT-VINA-104", estado_validacion: "APROBADO", rating: 4.8, reviews_count: 490, aforo_total: 450, aforo_disponible: 62, precio_entrada: 12000, id_host: 13 },
  { id_recinto: 26, nombre_local: "La Tertulia Cervecería", direccion: "1 Poniente 340, Viña del Mar", sector: "1 Poniente", ciudad: "Viña del Mar", tipo: "pub", lat: -33.0205, lng: -71.5552, patente_municipal: "PAT-VINA-105", estado_validacion: "APROBADO", rating: 4.7, reviews_count: 270, aforo_total: 130, aforo_disponible: 22, precio_entrada: 4500, id_host: 12 },
  { id_recinto: 27, nombre_local: "Bar Hollywood", direccion: "Av. San Martín 480, Viña del Mar", sector: "Av. San Martín", ciudad: "Viña del Mar", tipo: "club", lat: -33.0172, lng: -71.5568, patente_municipal: "PAT-VINA-106", estado_validacion: "APROBADO", rating: 4.5, reviews_count: 380, aforo_total: 280, aforo_disponible: 45, precio_entrada: 8000, id_host: 12 },
  { id_recinto: 28, nombre_local: "Del Barrio Pub", direccion: "3 Poniente 510, Viña del Mar", sector: "3 Poniente", ciudad: "Viña del Mar", tipo: "pub", lat: -33.0185, lng: -71.5535, patente_municipal: "PAT-VINA-107", estado_validacion: "APROBADO", rating: 4.6, reviews_count: 290, aforo_total: 160, aforo_disponible: 28, precio_entrada: 5000, id_host: 12 },
  { id_recinto: 29, nombre_local: "Club de la Cerveza Viña", direccion: "4 Norte 142, Viña del Mar", sector: "4 Norte", ciudad: "Viña del Mar", tipo: "pub", lat: -33.0150, lng: -71.5520, patente_municipal: "PAT-VINA-108", estado_validacion: "APROBADO", rating: 4.7, reviews_count: 310, aforo_total: 150, aforo_disponible: 26, precio_entrada: 5000, id_host: 12 },
  { id_recinto: 30, nombre_local: "Sunset Lounge Reñaca", direccion: "Av. Borgoño 15200, Reñaca", sector: "Reñaca / Costanera", ciudad: "Viña del Mar", tipo: "bar", lat: -32.9730, lng: -71.5435, patente_municipal: "PAT-VINA-109", estado_validacion: "APROBADO", rating: 4.8, reviews_count: 410, aforo_total: 220, aforo_disponible: 35, precio_entrada: 7000, id_host: 13 },
  { id_recinto: 31, nombre_local: "Murano Viña Club", direccion: "Av. San Martín 520, Viña del Mar", sector: "Av. San Martín", ciudad: "Viña del Mar", tipo: "club", lat: -33.0168, lng: -71.5565, patente_municipal: "PAT-VINA-110", estado_validacion: "APROBADO", rating: 4.6, reviews_count: 350, aforo_total: 320, aforo_disponible: 50, precio_entrada: 9000, id_host: 12 },
  { id_recinto: 32, nombre_local: "Deck 00 Reñaca", direccion: "Av. Borgoño 14800, Reñaca", sector: "Reñaca / Borde Costero", ciudad: "Viña del Mar", tipo: "club", lat: -32.9722, lng: -71.5442, patente_municipal: "PAT-VINA-111", estado_validacion: "APROBADO", rating: 4.8, reviews_count: 480, aforo_total: 400, aforo_disponible: 58, precio_entrada: 12000, id_host: 13 },
  { id_recinto: 33, nombre_local: "Gatsby Resto Bar", direccion: "Av. San Martín 250, Viña del Mar", sector: "Plaza México / San Martín", ciudad: "Viña del Mar", tipo: "bar", lat: -33.0180, lng: -71.5575, patente_municipal: "PAT-VINA-112", estado_validacion: "APROBADO", rating: 4.5, reviews_count: 230, aforo_total: 140, aforo_disponible: 24, precio_entrada: 6000, id_host: 12 },
  { id_recinto: 34, nombre_local: "Bar Callejero Viña", direccion: "2 Poniente 380, Viña del Mar", sector: "2 Poniente", ciudad: "Viña del Mar", tipo: "bar", lat: -33.0198, lng: -71.5548, patente_municipal: "PAT-VINA-113", estado_validacion: "APROBADO", rating: 4.6, reviews_count: 210, aforo_total: 110, aforo_disponible: 18, precio_entrada: 4500, id_host: 12 },
  { id_recinto: 35, nombre_local: "Bar El Patio 4 Norte", direccion: "4 Norte 230, Viña del Mar", sector: "4 Norte", ciudad: "Viña del Mar", tipo: "pub", lat: -33.0145, lng: -71.5512, patente_municipal: "PAT-VINA-114", estado_validacion: "APROBADO", rating: 4.5, reviews_count: 190, aforo_total: 120, aforo_disponible: 20, precio_entrada: 4000, id_host: 12 },
  { id_recinto: 36, nombre_local: "La Cava del Pisco Viña", direccion: "5 Norte 180, Viña del Mar", sector: "5 Norte", ciudad: "Viña del Mar", tipo: "bar", lat: -33.0135, lng: -71.5505, patente_municipal: "PAT-VINA-115", estado_validacion: "APROBADO", rating: 4.7, reviews_count: 250, aforo_total: 105, aforo_disponible: 17, precio_entrada: 5000, id_host: 12 },
  { id_recinto: 37, nombre_local: "Pub Dublín Viña", direccion: "8 Norte 550, Viña del Mar", sector: "8 Norte / Población Vergara", ciudad: "Viña del Mar", tipo: "pub", lat: -33.0110, lng: -71.5480, patente_municipal: "PAT-VINA-116", estado_validacion: "APROBADO", rating: 4.6, reviews_count: 280, aforo_total: 170, aforo_disponible: 29, precio_entrada: 5000, id_host: 12 },
  { id_recinto: 38, nombre_local: "Restobar Antojos", direccion: "Quillota 420, Viña del Mar", sector: "Quillota / Sector Oriente", ciudad: "Viña del Mar", tipo: "bar", lat: -33.0240, lng: -71.5420, patente_municipal: "PAT-VINA-117", estado_validacion: "APROBADO", rating: 4.4, reviews_count: 160, aforo_total: 95, aforo_disponible: 15, precio_entrada: 3500, id_host: 12 },
  { id_recinto: 39, nombre_local: "Bora Bora Reñaca", direccion: "Av. Borgoño 14100, Sector 4, Reñaca", sector: "Reñaca / Sector 4", ciudad: "Viña del Mar", tipo: "pub", lat: -32.9728, lng: -71.5460, patente_municipal: "PAT-VINA-118", estado_validacion: "APROBADO", rating: 4.7, reviews_count: 390, aforo_total: 260, aforo_disponible: 42, precio_entrada: 8000, id_host: 13 },
  { id_recinto: 40, nombre_local: "Viña Rock Bar", direccion: "1 Norte 1250, Viña del Mar", sector: "1 Norte / Sporting", ciudad: "Viña del Mar", tipo: "pub", lat: -33.0280, lng: -71.5385, patente_municipal: "PAT-VINA-119", estado_validacion: "APROBADO", rating: 4.6, reviews_count: 240, aforo_total: 150, aforo_disponible: 25, precio_entrada: 5000, id_host: 12 },
  { id_recinto: 41, nombre_local: "Club Soho Viña", direccion: "Av. San Martín 410, Viña del Mar", sector: "Av. San Martín / 4 Norte", ciudad: "Viña del Mar", tipo: "club", lat: -33.0175, lng: -71.5570, patente_municipal: "PAT-VINA-120", estado_validacion: "APROBADO", rating: 4.7, reviews_count: 430, aforo_total: 360, aforo_disponible: 52, precio_entrada: 10000, id_host: 12 },
  { id_recinto: 42, nombre_local: "Cervecería Kunstmann Viña", direccion: "7 Norte 440, Viña del Mar", sector: "7 Norte / Libertad", ciudad: "Viña del Mar", tipo: "pub", lat: -33.0125, lng: -71.5495, patente_municipal: "PAT-VINA-121", estado_validacion: "APROBADO", rating: 4.8, reviews_count: 510, aforo_total: 210, aforo_disponible: 33, precio_entrada: 6000, id_host: 12 }
];

// Mock Reviews
const mockReviews = [
  { id_resena: 1, id_recinto: 1, calificacion: 5, comentario: "Los 3 ambientes de El Huevo estuvieron increíbles. La pista subterránea de techno estuvo a otro nivel.", fecha: "2026-10-07T12:00:00.000Z", id_usuario: 3, usuario_nombre: "Diego Silva" },
  { id_resena: 2, id_recinto: 2, calificacion: 5, comentario: "Excelente bohemia y tradición centenaria en pleno Barrio Puerto.", fecha: "2026-10-08T14:30:00.000Z", id_usuario: 5, usuario_nombre: "Ignacio Valenzuela" },
  { id_resena: 3, id_recinto: 4, calificacion: 5, comentario: "La vista panorámica a los barcos de la bahía iluminada es impagable.", fecha: "2026-10-09T01:00:00.000Z", id_usuario: 4, usuario_nombre: "Camila Rojas" },
  { id_resena: 4, id_recinto: 22, calificacion: 5, comentario: "El mejor club nocturno de Viña del Mar por lejos. La infraestructura en Enjoy es insuperable.", fecha: "2026-10-09T08:00:00.000Z", id_usuario: 8, usuario_nombre: "Francisca Contreras" },
  { id_resena: 5, id_recinto: 25, calificacion: 5, comentario: "¡La fiesta en Reñaca frente a las olas no tiene comparación! El sistema de reserva nos evitó la fila.", fecha: "2026-10-09T10:00:00.000Z", id_usuario: 3, usuario_nombre: "Diego Silva" }
];

// Host lookup map
const hostMap = new Map(usuarios.filter(u => u.rol === "HOST").map(h => [h.id_usuario, { id_usuario: h.id_usuario, nombre: h.nombre, email: h.email }]));

// Transform Venues into NoSQL Document format with GeoJSON and embedded reviews
const recintos = rawVenues.map(v => {
  const host = hostMap.get(v.id_host) ?? { id_usuario: 10, nombre: "Host General", email: "contacto@dondee.cl" };
  const resenas = mockReviews
    .filter(r => r.id_recinto === v.id_recinto)
    .map(r => ({
      id_resena: r.id_resena,
      calificacion: r.calificacion,
      comentario: r.comentario,
      fecha: r.fecha,
      usuario: { id_usuario: r.id_usuario, nombre: r.usuario_nombre }
    }));

  return {
    id_recinto: v.id_recinto,
    nombre_local: v.nombre_local,
    direccion: v.direccion,
    sector: v.sector,
    ciudad: v.ciudad,
    tipo: v.tipo,
    patente_municipal: v.patente_municipal,
    estado_validacion: v.estado_validacion,
    aforo_total: v.aforo_total,
    aforo_disponible: v.aforo_disponible,
    precio_entrada: v.precio_entrada,
    rating: v.rating,
    reviews_count: v.reviews_count,
    ubicacion: {
      type: "Point",
      coordinates: [v.lng, v.lat]
    },
    host,
    resenas
  };
});

// Venue map for events denormalization
const venueMap = new Map(recintos.map(v => [v.id_recinto, v]));

// Transform Events into NoSQL format with denormalized venue location
const eventos = ALL_EVENTS.map(e => {
  const venue = venueMap.get(e.id_recinto);
  return {
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
    direccion: venue ? venue.direccion : e.direccion,
    ciudad: venue ? venue.ciudad : e.ciudad,
    sector: venue ? venue.sector : "Centro",
    ubicacion: venue ? venue.ubicacion : { type: "Point", coordinates: [-71.6245, -33.0425] },
    banner_image: e.banner_image,
    productora: e.productora,
    ticket_provider: e.ticket_provider,
    hot: e.hot,
    artistas: e.artistas
  };
});

// Mock Reservations with snapshots
const reservas = [
  {
    id_reserva: 1,
    fecha_reserva: "2026-10-09T10:00:00.000Z",
    estado_pago: "PAGADO",
    cantidad_entradas: 2,
    total_pagado: 20000.00,
    usuario: { id_usuario: 2, nombre: "Valentina Morales", email: "valen.morales@gmail.com" },
    evento: { id_evento: 1, titulo: "Valpo Techno Rave: 3 Niveles en Vivo", nombre_local: "Club El Huevo", fecha_hora: "Hoy, Sáb 21 Sep · 23:00 - 05:30" }
  },
  {
    id_reserva: 2,
    fecha_reserva: "2026-10-08T18:00:00.000Z",
    estado_pago: "PAGADO",
    cantidad_entradas: 1,
    total_pagado: 8000.00,
    usuario: { id_usuario: 3, nombre: "Diego Silva", email: "diego.silva@alumnos.usm.cl" },
    evento: { id_evento: 2, titulo: "Indie Rock Porteño & Post-Punk Fest", nombre_local: "Club El Huevo", fecha_hora: "Próximo Vie 27 Sep · 22:00 - 05:00" }
  },
  {
    id_reserva: 3,
    fecha_reserva: "2026-10-09T08:30:00.000Z",
    estado_pago: "PAGADO",
    cantidad_entradas: 2,
    total_pagado: 12000.00,
    usuario: { id_usuario: 4, nombre: "Camila Rojas", email: "camila.rojas@gmail.com" },
    evento: { id_evento: 3, titulo: "Fiesta Mechona Universitaria Gran Valpo", nombre_local: "Club El Huevo", fecha_hora: "Sáb 04 Oct · 22:30 - 05:30" }
  },
  {
    id_reserva: 4,
    fecha_reserva: "2026-10-09T12:15:00.000Z",
    estado_pago: "PAGADO",
    cantidad_entradas: 3,
    total_pagado: 15000.00,
    usuario: { id_usuario: 5, nombre: "Ignacio Valenzuela", email: "ignacio.valenzuela@gmail.com" },
    evento: { id_evento: 4, titulo: "Noche de Clásicos Porteños & Bohemia Viva", nombre_local: "Bar La Playa", fecha_hora: "Hoy, Sáb 21 Sep · 21:00 - 04:00" }
  }
];

// Target directory: DondeE - BD/nosql
const targetDir = path.resolve(process.cwd(), "..", "DondeE - BD", "nosql");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Write JSON files
fs.writeFileSync(path.join(targetDir, "usuarios.json"), JSON.stringify(usuarios, null, 2), "utf-8");
fs.writeFileSync(path.join(targetDir, "recintos.json"), JSON.stringify(recintos, null, 2), "utf-8");
fs.writeFileSync(path.join(targetDir, "eventos.json"), JSON.stringify(eventos, null, 2), "utf-8");
fs.writeFileSync(path.join(targetDir, "reservas.json"), JSON.stringify(reservas, null, 2), "utf-8");

console.log("Datsets JSON generados exitosamente en:", targetDir);
console.log("- usuarios.json:", usuarios.length, "documentos");
console.log("- recintos.json:", recintos.length, "documentos");
console.log("- eventos.json:", eventos.length, "documentos");
console.log("- reservas.json:", reservas.length, "documentos");
