export interface BackendHealth {
  ok: boolean;
  database: string;
  engine?: string;
  now: string;
  postgis_version: string;
  venues_count?: number;
  events_count?: number;
}

export interface DbVenueItem {
  id_recinto: number;
  nombre_local: string;
  direccion: string;
  sector?: string;
  ciudad?: string;
  tipo?: string;
  lat: number;
  lng: number;
  rating?: number;
  price?: number;
  aforo_disponible?: number;
}

export interface DbEventItem {
  id_evento: number;
  titulo: string;
  descripcion: string;
  fecha_hora: string;
  precio_entrada: number;
  categoria_musical: string;
  aforo_disponible: number;
  id_recinto: number;
  nombre_local: string;
  direccion: string;
  ciudad?: string;
  banner_image?: string;
  productora?: string;
  ticket_provider?: string;
  hot?: boolean;
  artistas?: string[];
}

export interface DbSectorItem {
  name: string;
  city: string;
  lat: number;
  lng: number;
  venuesCount: number;
}

export interface DbSearchResult {
  venues: DbVenueItem[];
  events: DbEventItem[];
  sectors: DbSectorItem[];
}

export async function getBackendHealth(): Promise<BackendHealth> {
  const response = await fetch("/api/health");
  if (!response.ok) {
    throw new Error(`Backend respondió con HTTP ${response.status}`);
  }
  return response.json() as Promise<BackendHealth>;
}

export async function searchDatabase(query: string): Promise<DbSearchResult> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`Error en búsqueda BD HTTP ${response.status}`);
  }
  return response.json() as Promise<DbSearchResult>;
}
