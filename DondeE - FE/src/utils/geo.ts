// Haversine formula to compute great-circle distance between two GPS coordinates in kilometers
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Math.round(dist * 10) / 10;
}

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  label?: string;
}

// Centros de referencia en V Región
export const VALPARAISO_CENTER = { lat: -33.044, lng: -71.624, name: "Plaza Aníbal Pinto, Valparaíso" };
export const VINA_DEL_MAR_CENTER = { lat: -33.019, lng: -71.555, name: "Plaza Sucre / 1 Poniente, Viña del Mar" };

// Determina si las coordenadas del usuario están más cerca de Valparaíso o de Viña del Mar
export function getClosestCity(lat: number, lng: number): "Valparaíso" | "Viña del Mar" {
  const distToValpo = calculateDistanceKm(lat, lng, VALPARAISO_CENTER.lat, VALPARAISO_CENTER.lng);
  const distToVina = calculateDistanceKm(lat, lng, VINA_DEL_MAR_CENTER.lat, VINA_DEL_MAR_CENTER.lng);
  return distToValpo <= distToVina ? "Valparaíso" : "Viña del Mar";
}
