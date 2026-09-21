export type City = "Valparaíso" | "Viña del Mar" | "Gran Valparaíso";

export type VenueType = "club" | "bar" | "pub";

export type TicketProvider = "Passline" | "Ticketmaster" | "Ticketek" | "Puntoticket" | "Toliv";

export interface Venue {
  id: string;
  id_recinto: number; // Mapping with relational DB
  name: string;
  city: "Valparaíso" | "Viña del Mar";
  sector: string; // e.g. "Cerro Alegre", "Barrio Puerto", "1 Poniente", "Reñaca"
  address: string;
  type: VenueType;
  rating: number;
  reviewsCount: number;
  distance: string; // e.g. "0.4 km"
  distanceKm: number; // numeric distance from active city center
  capacity: number; // aforo_total
  available: number; // aforo_disponible
  price: number; // entry price in CLP (0 = gratis)
  genre: string; // music / environment style
  image: string;
  coverImage?: string;
  description: string;
  schedule: string;
  x: number; // radar X coordinate (percentage 0-100)
  y: number; // radar Y coordinate (percentage 0-100)
  lat: number; // real latitude
  lng: number; // real longitude
  hot?: boolean; // trending
  ticketProvider?: TicketProvider;
  reviews: Review[];
}

export interface NightEvent {
  id: string;
  id_evento: number;
  venueId: string;
  venueName: string;
  city: "Valparaíso" | "Viña del Mar";
  title: string;
  description: string;
  date: string;
  time: string;
  price: number;
  genre: string;
  totalCapacity: number;
  availableCapacity: number;
  djsOrArtists: string[];
  bannerImage: string;
  producer: string; // Internal production or external hosted production company
  ticketProvider: TicketProvider; // Passline, Ticketmaster, Ticketek, Puntoticket, etc.
  hot?: boolean;
}

export interface Review {
  id: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  timeAgo: string;
  date: string;
}

export interface ClientProfile {
  id: string;
  id_usuario: number;
  name: string;
  email: string;
  role: "CLIENTE" | "HOST" | "ADMIN";
  city: "Valparaíso" | "Viña del Mar";
  bio: string;
  avatarGradient: string;
  activeTickets: ReservationTicket[];
}

export interface ReservationTicket {
  ticketId: string;
  id_reserva?: number;
  venueId: string;
  venueName: string;
  city: "Valparaíso" | "Viña del Mar";
  address: string;
  eventTitle: string;
  eventDate: string;
  quantity: number;
  unitPrice: number;
  serviceFee: number;
  totalPaid: number;
  purchaseDate: string;
  qrCodeUrl?: string;
  provider: TicketProvider;
  transactionToken?: string;
  status: "PAGADO" | "PENDIENTE" | "CANCELADO";
}
