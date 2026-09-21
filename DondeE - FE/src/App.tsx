import React, { useState, useEffect } from "react";
import type { Venue, City, NightEvent, ClientProfile, ReservationTicket, Review } from "./types";
import type { UserCoordinates } from "./utils/geo";
import { calculateDistanceKm, getClosestCity } from "./utils/geo";
import { MOCK_VENUES } from "./data/mockVenues";
import { MOCK_EVENTS } from "./data/mockEvents";
import { MOCK_CLIENTS } from "./data/mockClients";
import MapScreen from "./screens/MapScreen";
import ReservationScreen from "./screens/ReservationScreen";
import ClientDrawer from "./components/ClientDrawer";
import DatabaseInfoModal from "./components/DatabaseInfoModal";
import GeolocationModal from "./components/GeolocationModal";

type Screen = "map" | "reservation";

export default function App() {
  const [venues, setVenues] = useState<Venue[]>(MOCK_VENUES);
  const [events, setEvents] = useState<NightEvent[]>(MOCK_EVENTS);
  const [clients, setClients] = useState<ClientProfile[]>(MOCK_CLIENTS);
  const [activeClient, setActiveClient] = useState<ClientProfile>(MOCK_CLIENTS[0]); // Valentina Morales
  const [activeCity, setActiveCity] = useState<City>("Valparaíso");
  const [screen, setScreen] = useState<Screen>("map");
  const [selectedVenue, setSelectedVenue] = useState<Venue>(MOCK_VENUES[0]);
  const [selectedEvent, setSelectedEvent] = useState<NightEvent | undefined>(MOCK_EVENTS[0]);
  const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  // Geolocation automatic prompt state on initial entry
  const [isGeoModalOpen, setIsGeoModalOpen] = useState(true);
  const [userCoordinates, setUserCoordinates] = useState<UserCoordinates | null>(null);

  // Switch venue selection
  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    const relatedEvent = events.find((e) => e.venueId === venue.id);
    setSelectedEvent(relatedEvent);
  };

  // Trigger reservation
  const handleReserve = (venue: Venue, event?: NightEvent) => {
    setSelectedVenue(venue);
    setSelectedEvent(event);
    setScreen("reservation");
  };

  // Back to map
  const handleBack = () => {
    setScreen("map");
  };

  // Handle location granted from GeolocationModal
  const handleLocationGranted = (coords: UserCoordinates) => {
    setUserCoordinates(coords);
    setIsGeoModalOpen(false);

    // 1. Calculate closest city
    const closestCity = getClosestCity(coords.latitude, coords.longitude);
    setActiveCity(closestCity);

    // 2. Recalculate real distance for all 42 venues from user coordinates
    const updatedVenues = venues.map((v) => {
      const dist = calculateDistanceKm(coords.latitude, coords.longitude, v.lat, v.lng);
      return {
        ...v,
        distanceKm: dist,
        distance: `${dist} km`,
      };
    });

    // 3. Sort venues in the active city by proximity
    const inCity = updatedVenues.filter((v) => v.city === closestCity);
    const sorted = inCity.sort((a, b) => a.distanceKm - b.distanceKm);

    setVenues(updatedVenues);

    if (sorted.length > 0) {
      setSelectedVenue(sorted[0]);
      const relatedEvent = events.find((e) => e.venueId === sorted[0].id);
      setSelectedEvent(relatedEvent);
    }
  };

  const handleLocationDismiss = () => {
    setIsGeoModalOpen(false);
  };

  // When a reservation is completed: update available capacity & client's ticket wallet
  const handleConfirmReservation = (ticket: ReservationTicket) => {
    // 1. Decrement venue capacity
    setVenues((prev) =>
      prev.map((v) =>
        v.id === ticket.venueId ? { ...v, available: Math.max(0, v.available - ticket.quantity) } : v
      )
    );

    // 2. Decrement event capacity if any
    setEvents((prev) =>
      prev.map((e) =>
        e.venueId === ticket.venueId
          ? { ...e, availableCapacity: Math.max(0, e.availableCapacity - ticket.quantity) }
          : e
      )
    );

    // 3. Add ticket to active client
    setActiveClient((prev) => ({
      ...prev,
      activeTickets: [ticket, ...prev.activeTickets],
    }));

    setClients((prev) =>
      prev.map((c) =>
        c.id === activeClient.id
          ? { ...c, activeTickets: [ticket, ...c.activeTickets] }
          : c
      )
    );
  };

  // When a review is posted
  const handleAddReview = (venueId: string, review: Review) => {
    setVenues((prev) =>
      prev.map((v) =>
        v.id === venueId ? { ...v, reviews: [review, ...v.reviews] } : v
      )
    );
  };

  // City change handler
  const handleCityChange = (city: City) => {
    setActiveCity(city);
    if (city !== "Gran Valparaíso") {
      const match = venues.find((v) => v.city === city);
      if (match) handleVenueSelect(match);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#06060f] overflow-hidden font-display text-[#f0eeff]">
      {/* Mobile container centered on screen */}
      <div className="relative w-full h-full max-w-[430px] mx-auto overflow-hidden shadow-2xl border-x border-purple-500/10">
        {screen === "map" ? (
          <MapScreen
            venues={venues}
            events={events}
            selectedVenue={selectedVenue}
            onVenueSelect={handleVenueSelect}
            onReserve={handleReserve}
            activeCity={activeCity}
            onCityChange={handleCityChange}
            activeClient={activeClient}
            userCoordinates={userCoordinates}
            onRequestGeoModal={() => setIsGeoModalOpen(true)}
            onOpenClientDrawer={() => setIsClientDrawerOpen(true)}
            onOpenDbModal={() => setIsDbModalOpen(true)}
            onAddReview={handleAddReview}
          />
        ) : (
          <ReservationScreen
            venue={selectedVenue}
            event={selectedEvent}
            activeClient={activeClient}
            onBack={handleBack}
            onConfirmReservation={handleConfirmReservation}
            onViewWallet={() => {
              setScreen("map");
              setIsClientDrawerOpen(true);
            }}
          />
        )}
      </div>

      {/* Floating Demo Control Bar (for Academic Live Presentation) */}
      <div
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-1.5 rounded-full bg-black/80 backdrop-blur-lg border border-purple-500/40 shadow-2xl"
        style={{ maxWidth: "calc(100vw - 24px)" }}
      >
        <button
          onClick={() => setScreen("map")}
          className={`font-mono text-[10px] px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            screen === "map"
              ? "bg-purple-600 text-white font-bold shadow-md shadow-purple-500/40"
              : "text-white/60 hover:text-white"
          }`}
        >
          UCE01 · Mapa
        </button>

        <button
          onClick={() => setScreen("reservation")}
          className={`font-mono text-[10px] px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            screen === "reservation"
              ? "bg-pink-600 text-white font-bold shadow-md shadow-pink-500/40"
              : "text-white/60 hover:text-white"
          }`}
        >
          UCE02 · Reserva
        </button>

        <div className="w-px h-4 bg-white/20" />

        <button
          onClick={() => setIsClientDrawerOpen(true)}
          className="font-mono text-[10px] px-2.5 py-1.5 rounded-full text-purple-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>👤</span>
          <span className="hidden sm:inline">Clientes</span>
        </button>

        <button
          onClick={() => setIsGeoModalOpen(true)}
          className="font-mono text-[10px] px-2.5 py-1.5 rounded-full text-emerald-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>🛰️</span>
          <span className="hidden sm:inline">GPS</span>
        </button>
      </div>

      {/* Automatic Geolocation Permission Modal */}
      <GeolocationModal
        isOpen={isGeoModalOpen}
        onLocationGranted={handleLocationGranted}
        onLocationDismiss={handleLocationDismiss}
      />

      {/* Client Profile and Tickets Drawer */}
      <ClientDrawer
        isOpen={isClientDrawerOpen}
        onClose={() => setIsClientDrawerOpen(false)}
        clients={clients}
        activeClient={activeClient}
        onSelectClient={(c) => {
          setActiveClient(c);
          setIsClientDrawerOpen(false);
        }}
      />

      {/* Database Technical Information Modal */}
      <DatabaseInfoModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </div>
  );
}
