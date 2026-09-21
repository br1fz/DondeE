import React, { useState } from "react";
import type { UserCoordinates } from "../utils/geo";
import { VALPARAISO_CENTER, VINA_DEL_MAR_CENTER } from "../utils/geo";

interface Props {
  isOpen: boolean;
  onLocationGranted: (coords: UserCoordinates) => void;
  onLocationDismiss: () => void;
}

export default function GeolocationModal({
  isOpen,
  onLocationGranted,
  onLocationDismiss,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestNativeGeo = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Tu navegador no soporta geolocalización GPS. Puedes elegir una ciudad de prueba.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        onLocationGranted({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          label: "Ubicación GPS en Vivo",
        });
      },
      (error) => {
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMsg("Permiso de ubicación denegado en el navegador. Puedes seleccionar una ubicación de prueba abajo.");
        } else {
          setErrorMsg("No se pudo obtener la señal GPS. Puedes usar una ubicación predeterminada.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSelectSimulated = (city: "Valparaíso" | "Viña del Mar") => {
    if (city === "Valparaíso") {
      onLocationGranted({
        latitude: VALPARAISO_CENTER.lat,
        longitude: VALPARAISO_CENTER.lng,
        label: "GPS Valparaíso (Plaza Aníbal Pinto)",
      });
    } else {
      onLocationGranted({
        latitude: VINA_DEL_MAR_CENTER.lat,
        longitude: VINA_DEL_MAR_CENTER.lng,
        label: "GPS Viña del Mar (1 Poniente)",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div
        className="w-full max-w-[390px] rounded-[32px] p-6 border border-purple-500/40 overflow-hidden relative"
        style={{
          background: "linear-gradient(150deg, #130c2e 0%, #080516 100%)",
          boxShadow: "0 0 60px rgba(168, 85, 247, 0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Pulsing GPS satellite icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.7)]">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="3" fill="#ffffff" />
                <path
                  d="M12 2v3M12 19v3M2 12h3M19 12h3"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="12" r="7" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
              </svg>
            </div>
            <div className="absolute -inset-1 rounded-3xl bg-purple-500/20 animate-ping pointer-events-none" />
          </div>
        </div>

        {/* Text Header */}
        <div className="text-center mb-5">
          <span className="font-mono text-[9px] uppercase tracking-widest text-purple-400 font-bold">
            Búsqueda Geoespacial · PostGIS
          </span>
          <h2 className="font-display font-extrabold text-white text-xl leading-tight mt-1">
            ¿Permitir acceso a tu ubicación?
          </h2>
          <p className="font-sans text-xs text-white/60 mt-2 leading-relaxed">
            <strong className="text-white">DondeE</strong> necesita tu GPS para centrar automáticamente el radar nocturno y calcular la distancia a los <strong className="text-purple-300">42 bares y 126 eventos</strong> más cercanos en Valparaíso y Viña del Mar.
          </p>
        </div>

        {/* Feature bullets */}
        <div className="space-y-2 mb-5">
          {[
            { icon: "🎯", title: "Radar Centrado en Ti", desc: "Filtra locales a tu alrededor de 1 a 5 km." },
            { icon: "⚡", title: "Cálculo Métrico en Vivo", desc: "Estimación de distancias reales con PostGIS." },
            { icon: "🎟️", title: "Alertas de Aforo Próximo", desc: "Reserva de cupos en locales cercanos antes de que se agoten." },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/5"
            >
              <span className="text-base">{item.icon}</span>
              <div>
                <p className="font-display font-bold text-white text-xs leading-none">
                  {item.title}
                </p>
                <p className="font-mono text-[9px] text-white/45 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Error message if any */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 font-mono text-[10px] text-center">
            {errorMsg}
          </div>
        )}

        {/* Main Action Button (Native GPS) */}
        <div className="space-y-2">
          <button
            onClick={handleRequestNativeGeo}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl font-display font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #9333ea 0%, #db2777 100%)",
              boxShadow: "0 0 25px rgba(168,85,247,0.5)",
            }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Solicitando GPS al navegador...</span>
              </>
            ) : (
              <>
                <span>🛰️ Permitir Ubicación GPS Automática</span>
              </>
            )}
          </button>

          {/* Simulation buttons for demo / academic evaluation */}
          <div className="pt-2">
            <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest text-center mb-1.5">
              O simular ubicación para demostración:
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleSelectSimulated("Valparaíso")}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono font-semibold text-purple-300 transition-colors cursor-pointer"
              >
                📍 En Valparaíso
              </button>
              <button
                onClick={() => handleSelectSimulated("Viña del Mar")}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono font-semibold text-pink-300 transition-colors cursor-pointer"
              >
                🌊 En Viña del Mar
              </button>
            </div>
          </div>

          <button
            onClick={onLocationDismiss}
            className="w-full py-2 text-center font-mono text-[10px] text-white/40 hover:text-white/70 transition-colors cursor-pointer pt-1"
          >
            Continuar sin permisos (Ubicación por defecto)
          </button>
        </div>
      </div>
    </div>
  );
}
