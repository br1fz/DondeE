import React, { useState, useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Venue, City, NightEvent, ClientProfile, Review } from "../types";
import type { UserCoordinates } from "../utils/geo";
import AddReviewModal from "../components/AddReviewModal";
import {
  searchDatabase,
  type DbSearchResult,
  type DbSectorItem,
  type DbEventItem,
  type DbVenueItem,
} from "../api";

const PIN_COLOR: Record<string, { glow: string; ring: string; dot: string; label: string }> = {
  club: { glow: "rgba(168,85,247,0.55)", ring: "#a855f7", dot: "#c084fc", label: "Club" },
  pub: { glow: "rgba(59,130,246,0.55)", ring: "#3b82f6", dot: "#60a5fa", label: "Pub" },
  bar: { glow: "rgba(236,72,153,0.55)", ring: "#ec4899", dot: "#f472b6", label: "Bar" },
};

const CHIPS = ["Todos", "Clubs", "Bares", "Pubs", "Eventos"];

const CITY_GPS: Record<City, { address: string; centerLat: number; centerLng: number }> = {
  "Valparaíso": {
    address: "Plaza Aníbal Pinto, Valparaíso",
    centerLat: -33.044,
    centerLng: -71.624,
  },
  "Viña del Mar": {
    address: "Plaza Sucre / 1 Poniente, Viña del Mar",
    centerLat: -33.019,
    centerLng: -71.555,
  },
  "Gran Valparaíso": {
    address: "Borde Costero Valparaíso - Viña del Mar",
    centerLat: -33.03,
    centerLng: -71.58,
  },
};

export type MapLayerType = "osm" | "satellite" | "dark";

const MAP_LAYERS: Record<
  MapLayerType,
  {
    name: string;
    icon: string;
    description: string;
    url: string;
    subdomains?: string;
    maxZoom: number;
    attribution: string;
  }
> = {
  osm: {
    name: "Calles (OpenStreetMap)",
    icon: "🗺️",
    description: "Mapa oficial libre y visible: calles, plazas y borde costero",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  },
  satellite: {
    name: "Satélite HD (Esri)",
    icon: "🛰️",
    description: "Fotografía satelital real de alta resolución",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    maxZoom: 19,
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, USGS",
  },
  dark: {
    name: "Modo Nocturno",
    icon: "🌙",
    description: "Estilo nocturno cyberpunk de alto contraste",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    maxZoom: 19,
    attribution: "&copy; CartoDB",
  },
};

interface Props {
  venues: Venue[];
  events: NightEvent[];
  selectedVenue: Venue | null;
  onVenueSelect: (v: Venue) => void;
  onReserve: (v: Venue, event?: NightEvent) => void;
  activeCity: City;
  onCityChange: (city: City) => void;
  activeClient: ClientProfile;
  userCoordinates: UserCoordinates | null;
  onRequestGeoModal: () => void;
  onOpenClientDrawer: () => void;
  onOpenDbModal: () => void;
  onAddReview: (venueId: string, review: Review) => void;
}

export default function MapScreen({
  venues,
  events,
  selectedVenue,
  onVenueSelect,
  onReserve,
  activeCity,
  onCityChange,
  activeClient,
  userCoordinates,
  onRequestGeoModal,
  onOpenClientDrawer,
  onOpenDbModal,
  onAddReview,
}: Props) {
  const [radius, setRadius] = useState(5);
  const [isUnlimitedRadius, setIsUnlimitedRadius] = useState(false);
  const [showRadiusSelector, setShowRadiusSelector] = useState(false);
  const [chip, setChip] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [bottomTab, setBottomTab] = useState<"detail" | "events" | "reviews">("detail");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(14);
  const [activeLayer, setActiveLayer] = useState<MapLayerType>("osm");
  const [showLayerPicker, setShowLayerPicker] = useState(false);

  // Database search states
  const [dbResults, setDbResults] = useState<DbSearchResult | null>(null);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [searchFilterTab, setSearchFilterTab] = useState<"all" | "sectors" | "events" | "venues">("all");
  const [activeSector, setActiveSector] = useState<DbSectorItem | null>(null);
  const [selectedSearchedEvent, setSelectedSearchedEvent] = useState<DbEventItem | null>(null);

  // Map DOM and Leaflet instance references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const sectorMarkerRef = useRef<L.Marker | null>(null);
  const sectorCircleRef = useRef<L.Circle | null>(null);

  // Debounced search against backend PostgreSQL/Relational database
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDbResults(null);
      setIsSearchingDb(false);
      return;
    }

    setIsSearchingDb(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchDatabase(searchQuery.trim());
        setDbResults(results);
      } catch (err) {
        console.error("Error al buscar en Base de Datos:", err);
      } finally {
        setIsSearchingDb(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sector highlight and smooth map flyTo
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (sectorMarkerRef.current) {
      map.removeLayer(sectorMarkerRef.current);
      sectorMarkerRef.current = null;
    }
    if (sectorCircleRef.current) {
      map.removeLayer(sectorCircleRef.current);
      sectorCircleRef.current = null;
    }

    if (!activeSector) return;

    const locDotHtml = `
      <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; pointer-events: none; user-select: none;">
        <div style="padding: 3px 9px; border-radius: 99px; background: rgba(236,72,153,0.92); color: white; font-family: monospace; font-size: 10px; font-weight: bold; border: 1px solid #f472b6; box-shadow: 0 0 18px rgba(236,72,153,0.85); margin-bottom: 3px; white-space: nowrap;">
          📍 ${activeSector.name}
        </div>
        <div style="width: 14px; height: 14px; border-radius: 99px; background: #ec4899; border: 2.5px solid #ffffff; box-shadow: 0 0 14px #ec4899;"></div>
      </div>
    `;

    const locIcon = L.divIcon({
      html: locDotHtml,
      className: "sector-highlight-pin",
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    sectorMarkerRef.current = L.marker([activeSector.lat, activeSector.lng], {
      icon: locIcon,
      zIndexOffset: 1200,
      interactive: false,
    }).addTo(map);

    sectorCircleRef.current = L.circle([activeSector.lat, activeSector.lng], {
      radius: 650,
      color: "#ec4899",
      weight: 2,
      dashArray: "4, 6",
      fillColor: "#ec4899",
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(map);

    map.flyTo([activeSector.lat, activeSector.lng], 15, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [activeSector]);

  // Sector events & venues
  const sectorVenues = venues.filter((v) => {
    if (!activeSector) return false;
    const sName = activeSector.name.toLowerCase();
    return (
      v.sector.toLowerCase().includes(sName) ||
      sName.includes(v.sector.toLowerCase()) ||
      v.name.toLowerCase().includes(sName) ||
      (v.city.toLowerCase() === activeSector.city.toLowerCase() &&
        (sName === "valparaíso" || sName === "viña del mar"))
    );
  });

  const sectorVenueIds = new Set(sectorVenues.map((v) => v.id));
  const sectorEvents = events.filter(
    (e) =>
      sectorVenueIds.has(e.venueId) ||
      (activeSector && e.venueName.toLowerCase().includes(activeSector.name.toLowerCase())) ||
      (activeSector && activeSector.name.toLowerCase().includes(e.venueName.toLowerCase()))
  );

  const getEventAndVenue = (dbEvt: DbEventItem): { venue: Venue; nightEvent: NightEvent } => {
    const hostVenue =
      venues.find(
        (v) =>
          v.id === `valpo-${dbEvt.id_recinto}` ||
          v.id === `vina-${dbEvt.id_recinto - 21}` ||
          v.name.toLowerCase().trim() === dbEvt.nombre_local.toLowerCase().trim()
      ) || venues[0];

    const matchedEvent: NightEvent =
      events.find(
        (e) =>
          e.id_evento === dbEvt.id_evento ||
          e.title.toLowerCase().trim() === dbEvt.titulo.toLowerCase().trim()
      ) || {
        id: `evt-db-${dbEvt.id_evento}`,
        id_evento: dbEvt.id_evento,
        venueId: hostVenue.id,
        venueName: dbEvt.nombre_local,
        city: hostVenue.city,
        title: dbEvt.titulo,
        description: dbEvt.descripcion,
        date: dbEvt.fecha_hora.split("·")[0]?.trim() || "Hoy",
        time: dbEvt.fecha_hora.split("·")[1]?.trim() || "22:00",
        price: dbEvt.precio_entrada,
        genre: dbEvt.categoria_musical,
        totalCapacity: 200,
        availableCapacity: dbEvt.aforo_disponible,
        djsOrArtists: dbEvt.artistas || [],
        bannerImage:
          dbEvt.banner_image ||
          "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop&auto=format",
        producer: dbEvt.productora || "Productora Aliada",
        ticketProvider: (dbEvt.ticket_provider as any) || "Passline",
        hot: !!dbEvt.hot,
      };

    return { venue: hostVenue, nightEvent: matchedEvent };
  };

  const getFullVenue = (dbVen: DbVenueItem): Venue => {
    return (
      venues.find(
        (v) =>
          v.id === `valpo-${dbVen.id_recinto}` ||
          v.id === `vina-${dbVen.id_recinto - 21}` ||
          v.name.toLowerCase().trim() === dbVen.nombre_local.toLowerCase().trim()
      ) || venues[0]
    );
  };

  const handleSelectSector = (sec: DbSectorItem) => {
    setActiveSector(sec);
    setSelectedSearchedEvent(null);
  };

  const handleSelectVenueFromDb = (dbVen: DbVenueItem) => {
    const fullVenue = getFullVenue(dbVen);
    pick(fullVenue);
    mapInstanceRef.current?.flyTo([fullVenue.lat, fullVenue.lng], 16, { duration: 1.0 });
  };

  const handleSelectEventFromDb = (dbEvt: DbEventItem) => {
    setSelectedSearchedEvent(dbEvt);
    const { venue } = getEventAndVenue(dbEvt);
    mapInstanceRef.current?.panTo([venue.lat, venue.lng], { animate: true, duration: 0.8 });
  };

  const handleReserveFromDb = (dbEvt: DbEventItem) => {
    const { venue, nightEvent } = getEventAndVenue(dbEvt);
    onReserve(venue, nightEvent);
  };

  // Filter venues by city, chip, radius, and search text
  const filteredVenues = venues.filter((v) => {
    if (!isUnlimitedRadius && activeCity !== "Gran Valparaíso" && v.city !== activeCity) return false;
    if (!isUnlimitedRadius && v.distanceKm > radius) return false;
    if (chip === "Clubs" && v.type !== "club") return false;
    if (chip === "Bares" && v.type !== "bar") return false;
    if (chip === "Pubs" && v.type !== "pub") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        v.sector.toLowerCase().includes(q) ||
        v.genre.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Active venue
  const active =
    selectedVenue && filteredVenues.some((v) => v.id === selectedVenue.id)
      ? selectedVenue
      : filteredVenues[0] || venues[0];

  // 3 events for active venue
  const activeVenueEvents = events.filter((e) => e.venueId === active?.id);

  const pick = (v: Venue) => {
    onVenueSelect(v);
    mapInstanceRef.current?.panTo([v.lat, v.lng], { animate: true, duration: 0.5 });
  };

  const cfg = PIN_COLOR[active?.type || "club"];
  const avail = active?.available ?? 20;
  const cap = active?.capacity ?? 100;
  const pct = (avail / cap) * 100;
  const avCol = pct > 40 ? "#22c55e" : pct > 15 ? "#f59e0b" : "#ef4444";

  const stars = (n: number) =>
    Array.from({ length: 5 }, (_, i) => (i < Math.floor(n) ? "★" : i < n ? "½" : "☆"));

  // 1. Initialize real Leaflet dark matter map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = userCoordinates
      ? [userCoordinates.latitude, userCoordinates.longitude]
      : [CITY_GPS[activeCity].centerLat, CITY_GPS[activeCity].centerLng];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      minZoom: 2, // Allows deep zoom out to continent / planet Earth
      maxZoom: 19, // Allows deep zoom in to street level
      zoomControl: false,
      attributionControl: false,
    });

    // Dynamic initial tile layer (OpenStreetMap default, 100% free and visible, no API key required)
    const initialTileConfig = MAP_LAYERS[activeLayer];
    const initialTile = L.tileLayer(initialTileConfig.url, {
      subdomains: initialTileConfig.subdomains || "abc",
      maxZoom: initialTileConfig.maxZoom,
      attribution: initialTileConfig.attribution,
    }).addTo(map);

    tileLayerRef.current = initialTile;

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    map.on("zoomend", () => {
      setCurrentZoom(map.getZoom());
    });

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch tile layer dynamically (OpenStreetMap / Esri Satellite / Dark)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const layerCfg = MAP_LAYERS[activeLayer];
    const newTileLayer = L.tileLayer(layerCfg.url, {
      subdomains: layerCfg.subdomains || "abc",
      maxZoom: layerCfg.maxZoom,
      attribution: layerCfg.attribution,
    }).addTo(map);

    newTileLayer.bringToBack();
    tileLayerRef.current = newTileLayer;
  }, [activeLayer]);

  // 2. Render neon cyber pins for all venues
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    filteredVenues.forEach((v) => {
      const c = PIN_COLOR[v.type];
      const isActive = active?.id === v.id;

      const iconHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer; user-select: none;">
          ${
            isActive
              ? `<div style="margin-bottom: 4px; padding: 2px 8px; border-radius: 99px; font-size: 9px; font-family: monospace; font-weight: bold; white-space: nowrap; background: ${c.ring}35; border: 1px solid ${c.ring}90; color: ${c.dot}; backdrop-filter: blur(8px); box-shadow: 0 0 16px ${c.ring};">
                  ${v.name}
                 </div>`
              : ""
          }
          <div style="filter: ${isActive ? `drop-shadow(0 0 14px ${c.ring}) drop-shadow(0 0 25px ${c.glow})` : `drop-shadow(0 0 5px ${c.glow})`}; transform: scale(${isActive ? "1.25" : "0.95"}); transition: transform 0.2s ease;">
            <svg width="${isActive ? 32 : 24}" height="${isActive ? 40 : 30}" viewBox="0 0 36 44" fill="none">
              ${
                isActive
                  ? `<circle cx="18" cy="18" r="18" fill="${c.ring}25">
                      <animate attributeName="r" values="14;21;14" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                    </circle>`
                  : ""
              }
              <path d="M18 2C11.373 2 6 7.373 6 14C6 22 18 34 18 34C18 34 30 22 30 14C30 7.373 24.627 2 18 2Z"
                    fill="${isActive ? `${c.ring}55` : `${c.ring}30`}"
                    stroke="${c.ring}"
                    stroke-width="${isActive ? "2.2" : "1.6"}" />
              <circle cx="18" cy="14" r="${isActive ? 5 : 4}" fill="${c.dot}" />
            </svg>
          </div>
          ${
            v.hot
              ? `<div style="position: absolute; top: -3px; right: -3px; width: 14px; height: 14px; border-radius: 99px; background: #f97316; border: 1px solid #07071a; display: flex; align-items: center; justify-content: center; font-size: 8px;">
                  🔥
                 </div>`
              : ""
          }
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-venue-pin",
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([v.lat, v.lng], { icon: customIcon });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        pick(v);
      });
      group.addLayer(marker);
    });
  }, [filteredVenues, active]);

  // 3. User location marker and PostGIS distance coverage circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const userLat = userCoordinates ? userCoordinates.latitude : CITY_GPS[activeCity].centerLat;
    const userLng = userCoordinates ? userCoordinates.longitude : CITY_GPS[activeCity].centerLng;

    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    if (userCircleRef.current) map.removeLayer(userCircleRef.current);

    const userDotHtml = `
      <div style="transform: translate(-50%, -50%); position: relative; width: 22px; height: 22px;">
        <div style="position: absolute; inset: 0; border-radius: 99px; background: #60a5fa; opacity: 0.35; transform: scale(3.2); animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
        <div style="width: 22px; height: 22px; border-radius: 99px; background: #3b82f6; border: 2.5px solid #ffffff; box-shadow: 0 0 16px rgba(59,130,246,1); display: flex; align-items: center; justify-content: center;">
          <div style="width: 7px; height: 7px; border-radius: 99px; background: #ffffff;"></div>
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userDotHtml,
      className: "user-loc-dot",
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    userMarkerRef.current = L.marker([userLat, userLng], {
      icon: userIcon,
      interactive: false,
      zIndexOffset: 1000,
    }).addTo(map);

    if (!isUnlimitedRadius) {
      userCircleRef.current = L.circle([userLat, userLng], {
        radius: radius * 1000,
        color: "#a855f7",
        weight: 1.5,
        dashArray: "6, 6",
        fillColor: "#a855f7",
        fillOpacity: 0.05,
        interactive: false,
      }).addTo(map);
    }
  }, [userCoordinates, activeCity, radius, isUnlimitedRadius]);

  // 4. City change animation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const target = CITY_GPS[activeCity];
    if (target) {
      const zoomLevel = activeCity === "Gran Valparaíso" ? 12 : 14;
      map.flyTo([target.centerLat, target.centerLng], zoomLevel, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [activeCity]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#07071a]">
      {/* ── REAL LEAFLET MAP CANVAS (WORLDWIDE ZOOM & PAN) ── */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-[#07071a]" />

      {/* ── FLOATING MAP NAVIGATION CONTROLS (DEEP ZOOM, SCALE & LAYER PICKER) ── */}
      <div className="absolute right-3.5 top-56 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Layer Selector button */}
        <div className="relative">
          <button
            onClick={() => setShowLayerPicker(!showLayerPicker)}
            title="Cambiar capa del mapa (Calles OpenStreetMap / Satélite HD / Modo Nocturno)"
            className="w-8 h-8 rounded-xl bg-[#0d0d26]/90 backdrop-blur-md border border-emerald-500/50 text-emerald-300 hover:text-white hover:border-emerald-400 flex items-center justify-center text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            {MAP_LAYERS[activeLayer].icon}
          </button>

          {showLayerPicker && (
            <div className="absolute right-full mr-2 top-0 p-2 rounded-2xl bg-[#09091e]/98 backdrop-blur-2xl border border-purple-500/40 shadow-2xl z-50 flex flex-col gap-1.5 min-w-[220px]">
              <div className="flex items-center justify-between text-[10px] font-mono pb-1 border-b border-white/10">
                <span className="font-bold text-emerald-300">Capas de Mapa (Sin API Key)</span>
                <button
                  onClick={() => setShowLayerPicker(false)}
                  className="text-white/40 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {(["osm", "satellite", "dark"] as MapLayerType[]).map((key) => {
                const l = MAP_LAYERS[key];
                const isSelected = activeLayer === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveLayer(key);
                      setShowLayerPicker(false);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-600 text-white shadow-md border border-purple-400"
                        : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
                    }`}
                  >
                    <span className="text-base">{l.icon}</span>
                    <div className="min-w-0">
                      <p className="font-display text-xs font-bold leading-tight">{l.name}</p>
                      <p className="font-mono text-[8px] text-white/50">{l.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Recenter button */}
        <button
          onClick={() => {
            const map = mapInstanceRef.current;
            if (!map) return;
            const target = userCoordinates
              ? [userCoordinates.latitude, userCoordinates.longitude]
              : [CITY_GPS[activeCity].centerLat, CITY_GPS[activeCity].centerLng];
            map.flyTo(target as [number, number], 14, { duration: 0.9 });
          }}
          title="Centrar en ubicación"
          className="w-8 h-8 rounded-xl bg-[#0d0d26]/85 backdrop-blur-md border border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400 flex items-center justify-center text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          🎯
        </button>

        {/* Zoom In (+) */}
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          title="Acercar mapa (+)"
          className="w-8 h-8 rounded-xl bg-[#0d0d26]/85 backdrop-blur-md border border-purple-500/30 text-white/80 hover:text-white hover:border-purple-400 flex items-center justify-center text-sm font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          +
        </button>

        {/* Zoom Out (-) Unlimited */}
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          title="Alejar mapa (-)"
          className="w-8 h-8 rounded-xl bg-[#0d0d26]/85 backdrop-blur-md border border-purple-500/30 text-white/80 hover:text-white hover:border-purple-400 flex items-center justify-center text-sm font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          −
        </button>

        {/* Toggle Country/Global View */}
        <button
          onClick={() => {
            const map = mapInstanceRef.current;
            if (!map) return;
            if (currentZoom <= 6) {
              map.flyTo([-33.03, -71.58], 13, { duration: 1.2 });
            } else {
              map.flyTo([-33.5, -70.7], 5, { duration: 1.4 });
            }
          }}
          title={currentZoom <= 6 ? "Acercar a V Región" : "Ver todo Chile y Región (Zoom Out País)"}
          className="w-8 h-8 rounded-xl bg-[#0d0d26]/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 flex items-center justify-center text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          {currentZoom <= 6 ? "📍" : "🇨🇱"}
        </button>
      </div>

      {/* ── DYNAMIC SCALE INDICATOR BADGE ── */}
      <div className="absolute top-52 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all">
        <div className="px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-purple-500/40 text-[10px] font-mono text-purple-200 shadow-2xl flex items-center gap-2 whitespace-nowrap">
          <span>
            {currentZoom >= 16
              ? "🔍 Nivel Calle / Bar"
              : currentZoom >= 13
              ? "🏙️ Nivel Ciudad"
              : currentZoom >= 10
              ? "🗺️ Nivel V Región / Borde Costero"
              : currentZoom >= 6
              ? "🇨🇱 Nivel País (Chile & Sudamérica)"
              : "🌍 Nivel Continental / Mundial"}
          </span>
          <span className="w-1 h-1 rounded-full bg-purple-400" />
          <span className="text-cyan-300 font-bold">Z-{currentZoom}</span>
        </div>
      </div>

      {/* ── TOP BAR & SEARCH ── */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-7 px-3.5">
        {/* Brand + Client Switcher */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-[0_0_16px_rgba(168,85,247,0.6)]">
              <span className="font-display font-extrabold text-white text-sm">D</span>
            </div>
            <div>
              <span className="font-display font-extrabold text-white text-base tracking-tight leading-none block">
                Donde<span className="text-purple-400">E</span>
              </span>
              <span className="font-mono text-[8px] text-white/40">
                42 Locales · 126 Eventos · Multiciudad
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenDbModal}
              title="Ver esquema SQL y PostGIS"
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-purple-300 flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>🗄️</span>
              <span>PostGIS</span>
            </button>

            <button
              onClick={onOpenClientDrawer}
              title={`Cliente actual: ${activeClient.name}`}
              className="flex items-center gap-1.5 p-1 pr-2 rounded-full border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 transition-all cursor-pointer"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow"
                style={{ background: activeClient.avatarGradient }}
              >
                {activeClient.name.slice(0, 1)}
              </div>
              <span className="font-mono text-[9px] text-white/80 max-w-[65px] truncate">
                {activeClient.name.split(" ")[0]}
              </span>
              {activeClient.activeTickets.length > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-pink-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {activeClient.activeTickets.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* City Switcher */}
        <div className="flex p-1 rounded-xl bg-[#0d0d26]/85 backdrop-blur-md border border-purple-500/25 mb-2 shadow-lg">
          {(["Valparaíso", "Viña del Mar", "Gran Valparaíso"] as City[]).map((c) => {
            const isActive = activeCity === c && !isUnlimitedRadius;
            return (
              <button
                key={c}
                onClick={() => {
                  onCityChange(c);
                  setIsUnlimitedRadius(false);
                }}
                className={`flex-1 py-1 rounded-lg font-display text-[10px] font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                    : "text-white/45 hover:text-white/80"
                }`}
              >
                {c === "Valparaíso"
                  ? "📍 Valparaíso (21)"
                  : c === "Viña del Mar"
                  ? "🌊 Viña del Mar (21)"
                  : "🗺️ Gran Valpo (42)"}
              </button>
            );
          })}
          <button
            onClick={() => {
              setIsUnlimitedRadius(true);
              onCityChange("Gran Valparaíso");
              mapInstanceRef.current?.flyTo([-33.03, -71.58], 11, { duration: 1.2 });
            }}
            title="Ver todas las ciudades sin límites"
            className={`px-2 py-1 rounded-lg font-display text-[10px] font-bold transition-all cursor-pointer ${
              isUnlimitedRadius
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/30"
                : "text-cyan-400/80 hover:text-cyan-300"
            }`}
          >
            🌐 Todo
          </button>
        </div>

        {/* GPS bar + Search input + User Limit Config */}
        <div
          className="rounded-2xl border"
          style={{
            background: "rgba(10,10,28,0.88)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(168,85,247,0.25)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
          }}
        >
          {/* Quick Search */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5">
            <span className="text-white/40 text-xs">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar evento, localidad o pub (ej: Cerro Alegre, Techno, OVO, Reñaca)..."
              className="w-full bg-transparent text-white text-xs placeholder-white/30 focus:outline-none font-sans"
            />
            {isSearchingDb && (
              <span className="font-mono text-[9px] text-cyan-300 animate-pulse flex-shrink-0">
                BD...
              </span>
            )}
            {(searchQuery || activeSector) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveSector(null);
                  setSelectedSearchedEvent(null);
                }}
                className="text-white/40 hover:text-white text-xs cursor-pointer"
                title="Limpiar búsqueda y filtros"
              >
                ✕
              </button>
            )}
          </div>

          {/* GPS Position & User Defined Limit row */}
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 relative">
            <button
              onClick={onRequestGeoModal}
              title="Actualizar o cambiar permisos GPS"
              className="flex items-center gap-1.5 truncate flex-1 text-left cursor-pointer hover:opacity-85 transition-opacity"
            >
              <span className="text-xs">🛰️</span>
              <span className="font-mono text-[9px] text-purple-300 font-semibold truncate">
                {userCoordinates
                  ? `${userCoordinates.label || "GPS Activo"} (${userCoordinates.latitude.toFixed(3)}, ${userCoordinates.longitude.toFixed(3)})`
                  : `📍 ${CITY_GPS[activeCity].address}`}
              </span>
              {userCoordinates && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.9)] animate-pulse flex-shrink-0" />
              )}
            </button>

            {/* User defined exploration limit button */}
            <div className="relative flex items-center">
              <button
                onClick={() => setShowRadiusSelector(!showRadiusSelector)}
                className={`font-mono text-[9px] px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                  isUnlimitedRadius
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                    : "bg-purple-950/50 border-purple-500/40 text-purple-200 font-bold"
                }`}
                title="Configurar límite de exploración territorial"
              >
                <span>{isUnlimitedRadius ? "🌐 Sin Límite" : `Límite: ${radius}km`}</span>
                <span className="text-[7px]">⚙️</span>
              </button>

              {/* Limit Configuration Modal / Dropdown */}
              {showRadiusSelector && (
                <div
                  className="absolute right-0 top-full mt-2 p-2.5 rounded-2xl bg-[#09091e]/98 backdrop-blur-2xl border border-purple-500/40 shadow-2xl z-40 flex flex-col gap-2 min-w-[230px]"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono pb-1 border-b border-white/10">
                    <span className="font-bold text-purple-300">Definir Límite de Búsqueda</span>
                    <button
                      onClick={() => setShowRadiusSelector(false)}
                      className="text-white/40 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-[9px] text-white/50 font-sans">
                    Escala el rango de exploración según la ciudad o territorio deseado:
                  </p>

                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: "3 km", km: 3, unl: false },
                      { label: "8 km", km: 8, unl: false },
                      { label: "15 km", km: 15, unl: false },
                      { label: "30 km", km: 30, unl: false },
                      { label: "50 km", km: 50, unl: false },
                      { label: "∞ Global", km: 50, unl: true },
                    ].map((p) => (
                      <button
                        key={p.label}
                        onClick={() => {
                          setIsUnlimitedRadius(p.unl);
                          if (!p.unl) setRadius(p.km);
                          setShowRadiusSelector(false);
                        }}
                        className={`py-1 px-1 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer text-center ${
                          (p.unl && isUnlimitedRadius) || (!p.unl && !isUnlimitedRadius && radius === p.km)
                            ? "bg-purple-600 text-white shadow-md shadow-purple-500/40 border border-purple-400"
                            : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/5"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {!isUnlimitedRadius && (
                    <div className="pt-1 flex items-center gap-2 border-t border-white/5 mt-1">
                      <span className="font-mono text-[9px] text-white/40">Manual:</span>
                      <input
                        type="range"
                        min={1}
                        max={50}
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="w-full"
                      />
                      <span className="font-mono text-[9px] text-purple-300 font-bold w-8 text-right">
                        {radius}km
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-hide">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => setChip(c)}
              className="flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-medium font-display transition-all cursor-pointer"
              style={
                chip === c
                  ? {
                      background: "linear-gradient(135deg,rgba(168,85,247,0.4),rgba(236,72,153,0.3))",
                      border: "1px solid rgba(168,85,247,0.6)",
                      color: "#e9d5ff",
                    }
                  : {
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.45)",
                    }
              }
            >
              {c === "Eventos" ? "🎉 126 Eventos" : c}
            </button>
          ))}
        </div>
      </div>

      {/* ── BOTTOM SHEET (LOCAL + 3 EVENTOS + RESEÑAS O RESULTADOS DE BD) ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 transition-all duration-300"
        style={{
          height: expanded || searchQuery.trim().length > 0 || activeSector !== null ? "78%" : "auto",
        }}
      >
        <div
          className="relative h-full flex flex-col overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg,rgba(8,8,24,0.0) 0%,rgba(8,8,24,0.96) 6%,rgba(8,8,24,0.99) 100%)",
            backdropFilter: "blur(24px)",
            borderTop: "1px solid rgba(168,85,247,0.2)",
            borderRadius: "28px 28px 0 0",
            boxShadow: "0 -20px 60px rgba(0,0,0,0.7)",
          }}
        >
          {/* Drag Handle */}
          <button
            className="w-full flex justify-center pt-2 pb-1 flex-shrink-0 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="w-10 h-[3px] rounded-full bg-white/25" />
          </button>

          {/* Counts and Live Indicator */}
          <div className="flex items-center justify-between px-4 mb-2 flex-shrink-0">
            {searchQuery.trim().length > 0 || activeSector !== null ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-purple-300 uppercase tracking-wider font-bold">
                  ⚡ Base de Datos SQL & PostGIS
                </span>
                {isSearchingDb && (
                  <span className="font-mono text-[8px] text-cyan-300 animate-pulse">
                    (Consultando...)
                  </span>
                )}
              </div>
            ) : (
              <span className="font-mono text-[9px] text-white/50 uppercase tracking-wider">
                {filteredVenues.length} locales en {activeCity} ({radius} km)
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.9)] animate-pulse" />
              <span className="font-mono text-[9px] text-green-400 font-semibold uppercase">
                Aforo en Vivo
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              MODE A: DATABASE SEARCH & LOCALITY RESULTS DEPLOYED IN SHEET
             ═══════════════════════════════════════════════════════════════ */}
          {searchQuery.trim().length > 0 || activeSector !== null ? (
            <div className="flex-1 flex flex-col overflow-hidden px-3.5">
              {/* Active Locality / Sector Banner */}
              {activeSector && (
                <div className="mb-2 p-2.5 rounded-2xl bg-gradient-to-r from-pink-950/70 via-purple-950/70 to-indigo-950/70 border border-pink-500/40 shadow-lg flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/50 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                      📍
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-pink-300 font-bold">
                          Localidad Enfocada
                        </span>
                        <span className="font-mono text-[8px] px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-200">
                          {sectorEvents.length} eventos · {sectorVenues.length} locales
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-white text-sm leading-tight">
                        {activeSector.name} ({activeSector.city})
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        mapInstanceRef.current?.flyTo([activeSector.lat, activeSector.lng], 15, {
                          duration: 1.0,
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[9px] cursor-pointer"
                      title="Recentrar mapa en esta localidad"
                    >
                      🎯 Centrar
                    </button>
                    <button
                      onClick={() => setActiveSector(null)}
                      className="px-2 py-1 rounded-lg bg-pink-500/30 hover:bg-pink-500/50 text-pink-200 font-mono text-[9px] cursor-pointer"
                      title="Quitar foco de localidad"
                    >
                      ✕ Quitar
                    </button>
                  </div>
                </div>
              )}

              {/* Category Filter Chips inside Bottom Sheet */}
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                  {[
                    {
                      id: "all",
                      label: `Todos (${(dbResults?.sectors.length || 0) + (dbResults?.events.length || 0) + (dbResults?.venues.length || 0)})`,
                    },
                    { id: "sectors", label: `📍 Localidades (${dbResults?.sectors.length || 0})` },
                    { id: "events", label: `🎶 Eventos (${dbResults?.events.length || 0})` },
                    { id: "venues", label: `🍸 Locales (${dbResults?.venues.length || 0})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setSearchFilterTab(tab.id as any);
                        setSelectedSearchedEvent(null);
                      }}
                      className={`px-2.5 py-1 rounded-full font-mono text-[9px] font-bold transition-all cursor-pointer ${
                        searchFilterTab === tab.id
                          ? "bg-purple-600 text-white shadow-md shadow-purple-500/40 border border-purple-400"
                          : "bg-white/5 text-white/50 hover:text-white/80 border border-white/10"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail View of a Selected Event */}
              {selectedSearchedEvent ? (
                <div className="flex-1 overflow-y-auto pb-6 space-y-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <button
                      onClick={() => setSelectedSearchedEvent(null)}
                      className="font-mono text-[10px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      ← Volver a lista de resultados
                    </button>
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                      ID Evento #{selectedSearchedEvent.id_evento}
                    </span>
                  </div>

                  <div
                    className="rounded-2xl overflow-hidden border p-3"
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      borderColor: "rgba(168, 85, 247, 0.3)",
                    }}
                  >
                    {selectedSearchedEvent.banner_image && (
                      <div className="relative h-28 -mx-3 -mt-3 mb-3 overflow-hidden rounded-t-2xl">
                        <img
                          src={selectedSearchedEvent.banner_image}
                          alt={selectedSearchedEvent.titulo}
                          className="w-full h-full object-cover"
                          style={{ filter: "brightness(0.7) saturate(1.2)" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#09091e] to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-purple-500/80 text-white font-bold backdrop-blur-sm">
                            {selectedSearchedEvent.categoria_musical}
                          </span>
                          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/80 text-white font-bold backdrop-blur-sm">
                            {selectedSearchedEvent.aforo_disponible} cupos disponibles
                          </span>
                        </div>
                      </div>
                    )}

                    <h3 className="font-display text-base font-extrabold text-white mb-1">
                      {selectedSearchedEvent.titulo}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 mb-2 font-mono text-[9px] text-white/60">
                      <span className="text-purple-300 font-bold">
                        📍 {selectedSearchedEvent.nombre_local} ({selectedSearchedEvent.direccion})
                      </span>
                      <span>·</span>
                      <span>📅 {selectedSearchedEvent.fecha_hora}</span>
                    </div>

                    <p className="text-xs text-white/70 mb-3 font-sans leading-relaxed">
                      {selectedSearchedEvent.descripcion}
                    </p>

                    {selectedSearchedEvent.artistas && selectedSearchedEvent.artistas.length > 0 && (
                      <div className="mb-3 p-2 rounded-xl bg-white/5 border border-white/5">
                        <span className="font-mono text-[9px] text-white/40 block mb-0.5">
                          Lineup / Artistas:
                        </span>
                        <span className="font-mono text-[10px] text-pink-300 font-semibold">
                          {selectedSearchedEvent.artistas.join(", ")}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div>
                        <span className="font-mono text-[8px] text-white/40 block">Precio entrada</span>
                        <span className="font-display text-base font-bold text-emerald-400">
                          {selectedSearchedEvent.precio_entrada === 0
                            ? "Gratis"
                            : `$${(selectedSearchedEvent.precio_entrada / 1000).toFixed(0)}.000`}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const { venue } = getEventAndVenue(selectedSearchedEvent);
                            pick(venue);
                            mapInstanceRef.current?.flyTo([venue.lat, venue.lng], 16, { duration: 1.0 });
                          }}
                          className="px-3 py-1.5 rounded-xl font-display text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer"
                        >
                          📍 Ver en Mapa
                        </button>

                        <button
                          onClick={() => handleReserveFromDb(selectedSearchedEvent)}
                          className="px-3.5 py-1.5 rounded-xl font-display text-[10px] font-bold text-white shadow-lg cursor-pointer flex items-center gap-1.5"
                          style={{ background: "linear-gradient(135deg,#9333ea,#db2777)" }}
                        >
                          <span>🎟️ Reservar Cupo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Results list view */
                <div className="flex-1 overflow-y-auto pb-6 space-y-3">
                  {/* 1. SECTOR / LOCALITY RESULTS */}
                  {(searchFilterTab === "all" || searchFilterTab === "sectors") &&
                    dbResults?.sectors &&
                    dbResults.sectors.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-pink-300 font-bold flex items-center gap-1">
                            <span>📍</span> Localidades / Sectores ({dbResults.sectors.length})
                          </span>
                          <span className="font-mono text-[8px] text-white/40">
                            Haz clic para mover el mapa y ver eventos
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {dbResults.sectors.map((sec) => (
                            <div
                              key={sec.name}
                              onClick={() => handleSelectSector(sec)}
                              className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                activeSector?.name === sec.name
                                  ? "bg-pink-950/40 border-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.3)]"
                                  : "bg-white/5 hover:bg-white/10 border-white/10"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base">📍</span>
                                <div className="truncate">
                                  <h4 className="font-display font-bold text-white text-xs truncate">
                                    {sec.name}
                                  </h4>
                                  <p className="font-mono text-[9px] text-white/50 truncate">
                                    {sec.city} · {sec.venuesCount} locales registrados
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSector(sec);
                                }}
                                className="px-2 py-1 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 font-mono text-[9px] font-bold flex-shrink-0 cursor-pointer"
                              >
                                Volar al sector ↗
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* 2. IF ACTIVE SECTOR IS SELECTED: SHOW ALL EVENTS IN THAT SECTOR */}
                  {activeSector && sectorEvents.length > 0 && (
                    <div className="p-2.5 rounded-2xl bg-purple-950/30 border border-purple-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-purple-300 font-bold flex items-center gap-1">
                          <span>🎉</span> Eventos en {activeSector.name} ({sectorEvents.length})
                        </span>
                        <span className="font-mono text-[8px] text-emerald-400 font-bold">
                          Disponibles para reserva
                        </span>
                      </div>

                      <div className="space-y-2">
                        {sectorEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 flex items-start justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-purple-500/25 text-purple-300 font-bold">
                                  {evt.genre}
                                </span>
                                <span className="font-mono text-[8px] text-emerald-400 font-bold">
                                  {evt.availableCapacity} cupos
                                </span>
                              </div>
                              <h5 className="font-display font-bold text-white text-xs truncate">
                                {evt.title}
                              </h5>
                              <p className="font-mono text-[9px] text-white/50 truncate">
                                {evt.venueName} · {evt.date} {evt.time}
                              </p>
                            </div>

                            <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                              <span className="font-display font-bold text-xs text-purple-300">
                                {evt.price === 0 ? "Gratis" : `$${(evt.price / 1000).toFixed(0)}.000`}
                              </span>
                              <button
                                onClick={() => {
                                  const v = venues.find((x) => x.id === evt.venueId) || venues[0];
                                  onReserve(v, evt);
                                }}
                                className="px-2.5 py-1 rounded-lg text-white font-display text-[9px] font-bold shadow cursor-pointer"
                                style={{ background: "linear-gradient(135deg,#9333ea,#db2777)" }}
                              >
                                🎟️ Reservar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. EVENT RESULTS MATCHING QUERY */}
                  {(searchFilterTab === "all" || searchFilterTab === "events") &&
                    dbResults?.events &&
                    dbResults.events.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-purple-300 font-bold flex items-center gap-1">
                            <span>🎶</span> Eventos Encontrados ({dbResults.events.length})
                          </span>
                          <span className="font-mono text-[8px] text-white/40">
                            Consulta en tiempo real
                          </span>
                        </div>

                        <div className="space-y-2">
                          {dbResults.events.map((dbEvt) => (
                            <div
                              key={dbEvt.id_evento}
                              className="p-3 rounded-2xl border transition-all bg-white/5 hover:bg-white/8 border-purple-500/20"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                    <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-purple-500/25 text-purple-300 font-bold">
                                      {dbEvt.categoria_musical}
                                    </span>
                                    <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                      {dbEvt.aforo_disponible} cupos
                                    </span>
                                    {dbEvt.ciudad && (
                                      <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-white/10 text-white/60">
                                        {dbEvt.ciudad}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-display font-bold text-white text-xs leading-snug">
                                    {dbEvt.titulo}
                                  </h4>
                                  <p className="font-mono text-[9px] text-white/50 mt-0.5">
                                    📍 {dbEvt.nombre_local} · {dbEvt.fecha_hora}
                                  </p>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <span className="font-display font-bold text-sm text-purple-300">
                                    {dbEvt.precio_entrada === 0
                                      ? "Gratis"
                                      : `$${(dbEvt.precio_entrada / 1000).toFixed(0)}.000`}
                                  </span>
                                </div>
                              </div>

                              <p className="text-[10px] text-white/60 line-clamp-2 mb-2 font-sans">
                                {dbEvt.descripcion}
                              </p>

                              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <button
                                  onClick={() => handleSelectEventFromDb(dbEvt)}
                                  className="font-mono text-[9px] text-purple-300 hover:text-white flex items-center gap-1 cursor-pointer"
                                >
                                  <span>ℹ️ Ver ficha completa</span>
                                </button>

                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => {
                                      const { venue } = getEventAndVenue(dbEvt);
                                      pick(venue);
                                      mapInstanceRef.current?.flyTo([venue.lat, venue.lng], 16, {
                                        duration: 1.0,
                                      });
                                    }}
                                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-[9px] cursor-pointer"
                                  >
                                    📍 Mapa
                                  </button>

                                  <button
                                    onClick={() => handleReserveFromDb(dbEvt)}
                                    className="px-3 py-1 rounded-xl font-display text-[10px] font-bold text-white shadow-md cursor-pointer flex items-center gap-1"
                                    style={{ background: "linear-gradient(135deg,#9333ea,#db2777)" }}
                                  >
                                    <span>🎟️ Reservar</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* 4. VENUE RESULTS MATCHING QUERY */}
                  {(searchFilterTab === "all" || searchFilterTab === "venues") &&
                    dbResults?.venues &&
                    dbResults.venues.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1">
                            <span>🍸</span> Recintos y Pubs ({dbResults.venues.length})
                          </span>
                          <span className="font-mono text-[8px] text-white/40">Locales validados</span>
                        </div>

                        <div className="space-y-2">
                          {dbResults.venues.map((dbVen) => {
                            const fullV = getFullVenue(dbVen);
                            const c = PIN_COLOR[fullV.type];
                            return (
                              <div
                                key={dbVen.id_recinto}
                                onClick={() => handleSelectVenueFromDb(dbVen)}
                                className="p-2.5 rounded-2xl border transition-all bg-white/5 hover:bg-white/10 border-white/10 flex items-center justify-between gap-3 cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={fullV.image}
                                    alt={dbVen.nombre_local}
                                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span
                                        className="font-mono text-[8px] px-1.5 py-0.2 rounded-full uppercase font-bold"
                                        style={{
                                          color: c.dot,
                                          background: `${c.ring}25`,
                                          border: `1px solid ${c.ring}50`,
                                        }}
                                      >
                                        {c.label} · {fullV.city}
                                      </span>
                                      <span className="font-mono text-[8px] text-amber-400 font-bold">
                                        ★ {fullV.rating}
                                      </span>
                                    </div>
                                    <h4 className="font-display font-bold text-white text-xs truncate">
                                      {dbVen.nombre_local}
                                    </h4>
                                    <p className="font-mono text-[9px] text-white/50 truncate">
                                      {dbVen.sector || fullV.sector} · {dbVen.direccion}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  <span className="font-mono text-[9px] text-emerald-400 font-bold">
                                    {fullV.available} cupos
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectVenueFromDb(dbVen);
                                    }}
                                    className="px-2 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-mono text-[9px] font-bold cursor-pointer"
                                  >
                                    Ver Recinto ↗
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* No results message */}
                  {dbResults &&
                    dbResults.sectors.length === 0 &&
                    dbResults.events.length === 0 &&
                    dbResults.venues.length === 0 &&
                    !isSearchingDb && (
                      <div className="text-center py-8 px-4 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-2xl mb-2 block">🔍</span>
                        <p className="font-display text-sm font-bold text-white mb-1">
                          Sin resultados para "{searchQuery}"
                        </p>
                        <p className="font-mono text-[10px] text-white/40 mb-3">
                          No se hallaron localidades, eventos ni pubs con ese término en la base de
                          datos.
                        </p>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {[
                            "Cerro Alegre",
                            "Reñaca",
                            "Barrio Puerto",
                            "Techno",
                            "OVO",
                            "Rock",
                            "Bar La Playa",
                          ].map((s) => (
                            <button
                              key={s}
                              onClick={() => setSearchQuery(s)}
                              className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-purple-300 font-mono text-[9px] cursor-pointer"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          ) : (
            /* ═══════════════════════════════════════════════════════════════
               MODE B: STANDARD VENUE CARD & 3 EVENTS / REVIEWS TABS
               ═══════════════════════════════════════════════════════════════ */
            <>
              {/* Venue Card */}
              {active && (
                <div className="mx-3 flex-shrink-0">
                  <div
                    className="relative rounded-2xl overflow-hidden border"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderColor: `${cfg.ring}40`,
                      boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
                    }}
                  >
                    {/* Image Strip */}
                    <div className="relative h-24 overflow-hidden">
                      <img
                        src={active.image}
                        alt={active.name}
                        className="w-full h-full object-cover"
                        style={{ filter: "brightness(0.65) saturate(1.2)" }}
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to right,rgba(7,7,26,0.9) 0%,rgba(7,7,26,0.4) 60%,rgba(7,7,26,0.1) 100%)",
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col justify-end p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span
                                className="font-mono text-[8px] px-2 py-0.2 rounded-full uppercase tracking-widest font-bold"
                                style={{
                                  color: cfg.dot,
                                  background: `${cfg.ring}25`,
                                  border: `1px solid ${cfg.ring}50`,
                                }}
                              >
                                {cfg.label} · {active.city}
                              </span>
                              {active.ticketProvider && (
                                <span className="font-mono text-[8px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold uppercase">
                                  🎟️ {active.ticketProvider}
                                </span>
                              )}
                              {active.hot && (
                                <span className="font-mono text-[8px] px-1.5 py-0.2 rounded-full bg-orange-500/25 border border-orange-500/50 text-orange-300 font-bold uppercase">
                                  🔥 Trending
                                </span>
                              )}
                            </div>
                            <h2 className="font-display text-lg font-extrabold text-white leading-tight">
                              {active.name}
                            </h2>
                            <p className="font-mono text-[9px] text-white/60">
                              {active.sector} · {active.genre}
                            </p>
                          </div>

                          <div className="flex-shrink-0 flex flex-col items-end">
                            <span className="font-mono text-[8px] text-white/40">Entrada</span>
                            <span
                              className="font-display text-sm font-bold"
                              style={{ color: active.price === 0 ? "#4ade80" : "#e9d5ff" }}
                            >
                              {active.price === 0 ? "Gratis" : `$${(active.price / 1000).toFixed(0)}.000`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sub-bar with Rating + Aforo + Actions */}
                    <div className="p-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {stars(active.rating).map((s, i) => (
                              <span
                                key={i}
                                className="text-[10px]"
                                style={{
                                  color: s === "☆" ? "rgba(255,255,255,0.2)" : "#fbbf24",
                                }}
                              >
                                {s === "½" ? "★" : s}
                              </span>
                            ))}
                          </div>
                          <span className="font-mono text-[10px] font-bold text-white/90">
                            {active.rating}
                          </span>
                          <span className="font-mono text-[9px] text-white/40">
                            ({active.reviews.length} reseñas)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: avCol }} />
                          <span className="font-mono text-[10px] font-bold" style={{ color: avCol }}>
                            {avail} cupos
                          </span>
                        </div>
                      </div>

                      {/* Tab Selector inside bottom sheet */}
                      <div className="flex gap-1.5 mb-2">
                        <button
                          onClick={() => {
                            setBottomTab("events");
                            setExpanded(true);
                          }}
                          className={`flex-1 py-1.5 rounded-xl font-display text-[10px] font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                            expanded && bottomTab === "events"
                              ? "bg-purple-600 text-white border-purple-500"
                              : "bg-white/5 border-white/10 text-purple-300 hover:bg-white/10"
                          }`}
                        >
                          <span>🎉 3 Eventos</span>
                          <span className="font-mono text-[9px] px-1 rounded bg-purple-500/30">
                            {activeVenueEvents.length}
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            setBottomTab("reviews");
                            setExpanded(true);
                          }}
                          className={`flex-1 py-1.5 rounded-xl font-display text-[10px] font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                            expanded && bottomTab === "reviews"
                              ? "bg-pink-600 text-white border-pink-500"
                              : "bg-white/5 border-white/10 text-pink-300 hover:bg-white/10"
                          }`}
                        >
                          <span>💬 Reseñas</span>
                          <span className="font-mono text-[9px] px-1 rounded bg-pink-500/30">
                            {active.reviews.length}
                          </span>
                        </button>

                        <button
                          onClick={() => onReserve(active, activeVenueEvents[0])}
                          className="flex-[1.2] py-1.5 rounded-xl font-display text-[10px] font-bold text-white transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                          style={{ background: "linear-gradient(135deg,#9333ea,#db2777)" }}
                        >
                          <span>🎟️ Reservar Cupo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Expanded Content: 3 Events or Reviews */}
              {expanded && active && (
                <div className="flex-1 overflow-y-auto px-3.5 mt-2 pb-6 space-y-2.5">
                  {bottomTab === "events" ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-purple-300 font-bold">
                          Cartelera: 3 Eventos en {active.name}
                        </p>
                        <span className="font-mono text-[9px] text-white/40">
                          Propias y productoras aliadas
                        </span>
                      </div>

                      <div className="space-y-2">
                        {activeVenueEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="p-3 rounded-2xl border transition-all"
                            style={{
                              background: "rgba(255, 255, 255, 0.03)",
                              borderColor: "rgba(168, 85, 247, 0.2)",
                            }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-purple-500/25 text-purple-300 border border-purple-500/30 font-semibold">
                                    {evt.producer}
                                  </span>
                                  <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                                    Boletería: {evt.ticketProvider}
                                  </span>
                                  {evt.hot && (
                                    <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-bold">
                                      DESTACADO
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-display font-bold text-white text-xs leading-tight">
                                  {evt.title}
                                </h4>
                                <p className="font-mono text-[9px] text-white/50 mt-0.5">
                                  {evt.date} · {evt.time}
                                </p>
                              </div>

                              <div className="text-right flex-shrink-0">
                                <span className="font-display font-bold text-sm text-purple-300">
                                  {evt.price === 0 ? "Gratis" : `$${(evt.price / 1000).toFixed(0)}.000`}
                                </span>
                                <p className="font-mono text-[8px] text-emerald-400 font-semibold">
                                  {evt.availableCapacity} cupos
                                </p>
                              </div>
                            </div>

                            <p className="text-[10px] text-white/60 mb-2 font-sans leading-relaxed">
                              {evt.description}
                            </p>

                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                              <span className="font-mono text-[9px] text-white/40 truncate max-w-[190px]">
                                Lineup: {evt.djsOrArtists.join(", ")}
                              </span>

                              <button
                                onClick={() => onReserve(active, evt)}
                                className="px-3 py-1 rounded-xl font-display text-[10px] font-bold text-white transition-all cursor-pointer flex items-center gap-1"
                                style={{ background: "linear-gradient(135deg,#9333ea,#db2777)" }}
                              >
                                <span>Comprar en {evt.ticketProvider} ↗</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-pink-300 font-bold">
                          Reseñas del Ambiente Nocturno ({active.reviews.length})
                        </p>
                        <button
                          onClick={() => setShowReviewModal(true)}
                          className="px-2.5 py-1 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[9px] font-mono font-semibold cursor-pointer"
                        >
                          + Dejar Reseña
                        </button>
                      </div>

                      <div className="space-y-2">
                        {active.reviews.map((r) => (
                          <div
                            key={r.id}
                            className="p-2.5 rounded-2xl border"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              borderColor: "rgba(255,255,255,0.07)",
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[9px] font-bold text-white">
                                  {r.userName[0]}
                                </div>
                                <span className="text-xs font-semibold text-white/90">
                                  {r.userName}
                                </span>
                              </div>
                              <span className="font-mono text-[8px] text-white/35">{r.timeAgo}</span>
                            </div>

                            <div className="flex gap-0.5 mb-1 ml-6">
                              {Array.from({ length: 5 }, (_, j) => (
                                <span
                                  key={j}
                                  className="text-[10px]"
                                  style={{
                                    color: j < r.rating ? "#fbbf24" : "rgba(255,255,255,0.15)",
                                  }}
                                >
                                  ★
                                </span>
                              ))}
                            </div>

                            <p className="text-[10px] text-white/60 ml-6 leading-relaxed font-sans">
                              {r.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!expanded && <div className="h-4 flex-shrink-0" />}
            </>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && active && (
        <AddReviewModal
          venue={active}
          activeClient={activeClient}
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onAddReview={(newReview) => {
            onAddReview(active.id, newReview);
          }}
        />
      )}
    </div>
  );
}
