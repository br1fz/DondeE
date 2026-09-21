import React, { useState, useRef, useEffect } from "react";
import type { Venue, City, NightEvent, ClientProfile, Review } from "../types";
import type { UserCoordinates } from "../utils/geo";
import AddReviewModal from "../components/AddReviewModal";

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
  const [radius, setRadius] = useState(4);
  const [chip, setChip] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [bottomTab, setBottomTab] = useState<"detail" | "events" | "reviews">("detail");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);

  // Filter venues by city, chip, radius, and search text
  const filteredVenues = venues.filter((v) => {
    if (activeCity !== "Gran Valparaíso" && v.city !== activeCity) return false;
    if (v.distanceKm > radius) return false;
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

  const setPct = (v: number) => {
    sliderRef.current?.style.setProperty("--val", `${((v - 1) / 4) * 100}%`);
  };

  useEffect(() => {
    setPct(radius);
  }, [radius]);

  const pick = (v: Venue) => {
    onVenueSelect(v);
  };

  const cfg = PIN_COLOR[active?.type || "club"];
  const avail = active?.available ?? 20;
  const cap = active?.capacity ?? 100;
  const pct = (avail / cap) * 100;
  const avCol = pct > 40 ? "#22c55e" : pct > 15 ? "#f59e0b" : "#ef4444";

  const stars = (n: number) =>
    Array.from({ length: 5 }, (_, i) => (i < Math.floor(n) ? "★" : i < n ? "½" : "☆"));

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#07071a]">
      {/* ── MAP BACKDROP WITH COASTLINE & RADAR ── */}
      <div className="absolute inset-0">
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0"
        >
          <defs>
            <pattern id="grid-lg" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M44 0H0V44" fill="none" stroke="rgba(255,255,255,0.028)" strokeWidth="1" />
            </pattern>
            <pattern id="grid-sm" x="0" y="0" width="11" height="11" patternUnits="userSpaceOnUse">
              <path d="M11 0H0V11" fill="none" stroke="rgba(255,255,255,0.012)" strokeWidth="0.5" />
            </pattern>
            <filter id="road-glow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="ocean-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#030818" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#07071a" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Background & Grids */}
          <rect width="100%" height="100%" fill="#07071a" />
          <rect width="100%" height="100%" fill="url(#grid-sm)" />
          <rect width="100%" height="100%" fill="url(#grid-lg)" />

          {/* Coastline / Bahía */}
          <path
            d="M -30,140 Q 95,250 140,430 T 75,730 L -30,860 Z"
            fill="url(#ocean-grad)"
            stroke="rgba(56, 189, 248, 0.28)"
            strokeWidth="2.5"
            strokeDasharray="5 3"
          />

          <text
            x="22"
            y="260"
            fill="rgba(56, 189, 248, 0.35)"
            fontSize="9"
            fontFamily="monospace"
            letterSpacing="2"
            transform="rotate(-55 22 260)"
          >
            BAHÍA VALPARAÍSO / VIÑA · PACÍFICO
          </text>

          {/* City blocks */}
          {[
            [160, 110, 130, 80],
            [305, 120, 110, 70],
            [150, 240, 100, 110],
            [270, 230, 140, 80],
            [140, 390, 110, 80],
            [270, 370, 140, 95],
            [150, 500, 130, 80],
            [300, 490, 110, 85],
            [130, 610, 110, 80],
            [260, 600, 150, 75],
          ].map(([x, y, w, h], i) => (
            <rect
              key={i}
              x={x}
              y={y}
              width={w}
              height={h}
              rx="6"
              fill="rgba(255,255,255,0.018)"
              stroke="rgba(255,255,255,0.038)"
              strokeWidth="0.5"
            />
          ))}

          {/* Glowing avenues */}
          {[
            { d: "M 80,180 Q 180,310 170,550 T 150,850", c: "rgba(59,130,246,0.32)", w: 8 },
            { d: "M 0,380 Q 215,360 430,385", c: "rgba(168,85,247,0.22)", w: 7 },
            { d: "M 0,520 Q 215,500 430,530", c: "rgba(168,85,247,0.16)", w: 6 },
            { d: "M 280,0 Q 270,422 290,844", c: "rgba(236,72,153,0.18)", w: 6 },
          ].map((r, i) => (
            <path
              key={i}
              d={r.d}
              fill="none"
              stroke={r.c}
              strokeWidth={r.w}
              strokeLinecap="round"
              filter="url(#road-glow)"
            />
          ))}

          {/* User Halo */}
          <circle
            cx="215"
            cy="400"
            r={radius * 44}
            fill="rgba(168,85,247,0.03)"
            stroke="rgba(168,85,247,0.25)"
            strokeWidth="1.2"
            strokeDasharray="6 6"
          />
        </svg>

        {/* Scanlines & Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.04) 3px,rgba(0,0,0,0.04) 4px)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 80% at 50% 50%,transparent 40%,rgba(7,7,26,0.72) 100%)",
          }}
        />
      </div>

      {/* ── MAP PINS ── */}
      {filteredVenues.map((v) => {
        const c = PIN_COLOR[v.type];
        const isActive = active?.id === v.id;
        return (
          <button
            key={v.id}
            onClick={() => pick(v)}
            className="absolute z-10 flex flex-col items-center cursor-pointer"
            style={{
              left: `${v.x}%`,
              top: `${v.y}%`,
              transform: "translate(-50%,-100%)",
              filter: isActive
                ? `drop-shadow(0 0 14px ${c.ring}) drop-shadow(0 0 30px ${c.glow})`
                : `drop-shadow(0 0 4px ${c.glow})`,
              transition: "filter 0.2s ease, transform 0.2s ease",
              transformOrigin: "bottom center",
              scale: isActive ? "1.2" : "0.95",
            }}
          >
            {isActive && (
              <div
                className="mb-1 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider whitespace-nowrap shadow-lg"
                style={{
                  background: `${c.ring}30`,
                  border: `1px solid ${c.ring}90`,
                  color: c.dot,
                  backdropFilter: "blur(8px)",
                }}
              >
                {v.name}
              </div>
            )}

            <svg
              width={isActive ? 32 : 24}
              height={isActive ? 40 : 30}
              viewBox="0 0 36 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isActive && (
                <circle cx="18" cy="18" r="18" fill={`${c.ring}20`}>
                  <animate attributeName="r" values="14;21;14" dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2.2s" repeatCount="indefinite" />
                </circle>
              )}
              <path
                d="M18 2C11.373 2 6 7.373 6 14C6 22 18 34 18 34C18 34 30 22 30 14C30 7.373 24.627 2 18 2Z"
                fill={isActive ? `${c.ring}40` : `${c.ring}25`}
                stroke={c.ring}
                strokeWidth={isActive ? "2" : "1.5"}
              />
              <circle cx="18" cy="14" r={isActive ? 5 : 4} fill={c.dot} />
            </svg>

            {v.hot && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-orange-500 border border-[#07071a] flex items-center justify-center text-[7px]">
                🔥
              </div>
            )}
          </button>
        );
      })}

      {/* ── USER DOT ── */}
      <div
        className="absolute z-10 pointer-events-none"
        style={{ left: "50%", top: "48%", transform: "translate(-50%,-50%)" }}
      >
        <div className="relative w-5 h-5">
          <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 scale-[3] animate-ping" />
          <div className="w-5 h-5 rounded-full bg-blue-400 border-2 border-white shadow-[0_0_14px_rgba(59,130,246,0.9)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
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
                42 Locales · 126 Eventos
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
            const isActive = activeCity === c;
            return (
              <button
                key={c}
                onClick={() => onCityChange(c)}
                className={`flex-1 py-1 rounded-lg font-display text-[10px] font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                    : "text-white/45 hover:text-white/80"
                }`}
              >
                {c === "Valparaíso" ? "📍 Valparaíso (21)" : c === "Viña del Mar" ? "🌊 Viña del Mar (21)" : "🗺️ Gran Valpo (42)"}
              </button>
            );
          })}
        </div>

        {/* GPS bar + Search input */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "rgba(10,10,28,0.85)",
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
              placeholder="Buscar por local o sector (ej: Cerro Alegre, OVO, Reñaca)..."
              className="w-full bg-transparent text-white text-xs placeholder-white/30 focus:outline-none font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-white/40 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* GPS Position & Radius row */}
          <div className="flex items-center gap-2 px-3 py-1.5">
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

            <span className="font-mono text-[9px] text-white/40">Radio:</span>
            <input
              ref={sliderRef}
              type="range"
              min={1}
              max={5}
              value={radius}
              onChange={(e) => {
                const v = Number(e.target.value);
                setRadius(v);
                setPct(v);
              }}
              className="w-16"
              style={{ "--val": `${((radius - 1) / 4) * 100}%` } as React.CSSProperties}
            />
            <span className="font-mono text-[9px] text-purple-300 font-bold w-6">{radius}km</span>
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

      {/* ── BOTTOM SHEET (LOCAL + 3 EVENTOS + RESEÑAS) ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 transition-all duration-300"
        style={{ height: expanded ? "75%" : "auto" }}
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
            <span className="font-mono text-[9px] text-white/50 uppercase tracking-wider">
              {filteredVenues.length} locales en {activeCity} ({radius} km)
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.9)] animate-pulse" />
              <span className="font-mono text-[9px] text-green-400 font-semibold uppercase">
                Aforo en Vivo
              </span>
            </div>
          </div>

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

          {/* ── EXPANDED CONTENT: 3 EVENTOS O RESEÑAS ── */}
          {expanded && active && (
            <div className="flex-1 overflow-y-auto px-3.5 mt-2 pb-6 space-y-2.5">
              {bottomTab === "events" ? (
                // 3 EVENTOS DE ESTE LOCAL
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
                // RESEÑAS SOCIALES
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
                            <span className="text-xs font-semibold text-white/90">{r.userName}</span>
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
