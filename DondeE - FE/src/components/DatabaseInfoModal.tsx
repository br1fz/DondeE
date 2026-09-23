import React from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  backendStatus: "checking" | "connected" | "offline";
  postgisVersion?: string;
}

export default function DatabaseInfoModal({ isOpen, onClose, backendStatus, postgisVersion }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        className="w-full max-w-[500px] max-h-[85vh] rounded-3xl p-6 border border-purple-500/40 overflow-y-auto flex flex-col"
        style={{
          background: "linear-gradient(160deg, #11092a 0%, #060412 100%)",
          boxShadow: "0 0 60px rgba(168, 85, 247, 0.35)",
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗄️</span>
            <div>
              <h3 className="font-display font-bold text-white text-base">
                Arquitectura DondeE · Base de Datos & PostGIS
              </h3>
              <p className="font-mono text-[10px] text-purple-300">
                Esquema Relacional + PostGIS SRID 4326 (Valparaíso & Viña)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 text-white/60 hover:text-white flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 font-mono text-xs">
          <div className={`p-3 rounded-2xl border ${backendStatus === "connected" ? "bg-emerald-500/10 border-emerald-400/30" : backendStatus === "offline" ? "bg-red-500/10 border-red-400/30" : "bg-amber-500/10 border-amber-400/30"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-white/80">Conexión API + PostgreSQL</span>
              <span className={backendStatus === "connected" ? "text-emerald-300" : backendStatus === "offline" ? "text-red-300" : "text-amber-300"}>
                {backendStatus === "connected" ? "CONECTADO" : backendStatus === "offline" ? "DESCONECTADO" : "VERIFICANDO..."}
              </span>
            </div>
            {postgisVersion && <p className="mt-1 text-[10px] text-white/50">PostGIS {postgisVersion}</p>}
          </div>

          {/* Geolocation Section */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-purple-400 font-bold mb-1.5 text-[11px]">
              <span>📍</span>
              <span>1. FILTRADO GEOESPACIAL (PostGIS)</span>
            </div>
            <p className="text-white/60 text-[11px] leading-relaxed mb-2 font-sans">
              Búsqueda de recintos nocturnos cercanos al punto GPS del usuario mediante índice GiST y función métrica:
            </p>
            <div className="p-2.5 rounded-xl bg-black/60 text-[10px] text-emerald-300 overflow-x-auto">
              <code>
                {`SELECT id_recinto, nombre_local, direccion,
       ST_Distance(ubicacion_geom, ST_SetSRID(ST_MakePoint(:user_lng, :user_lat), 4326)::geography) AS distancia_metros
FROM recinto
WHERE ST_DWithin(ubicacion_geom, ST_SetSRID(ST_MakePoint(:user_lng, :user_lat), 4326)::geography, :radio_metros)
ORDER BY distancia_metros ASC;`}
              </code>
            </div>
          </div>

          {/* Concurrency Section */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-pink-400 font-bold mb-1.5 text-[11px]">
              <span>⚡</span>
              <span>2. TRANSACCIÓN ATÓMICA DE AFORO (Anti-Sobreventa)</span>
            </div>
            <p className="text-white/60 text-[11px] leading-relaxed mb-2 font-sans">
              Control de concurrencia para descontar cupos en tiempo real y evitar condiciones de carrera (Race Conditions):
            </p>
            <div className="p-2.5 rounded-xl bg-black/60 text-[10px] text-pink-300 overflow-x-auto">
              <code>
                {`BEGIN;
-- Bloqueo pesimista de fila del evento
SELECT aforo_disponible FROM evento WHERE id_evento = :id FOR UPDATE;

-- Validar cupo y descontar
UPDATE evento 
SET aforo_disponible = aforo_disponible - :cantidad 
WHERE id_evento = :id AND aforo_disponible >= :cantidad;

-- Insertar reserva con tope máx. 5 entradas
INSERT INTO reserva (estado_pago, cantidad_entradas, total_pagado, id_usuario, id_evento)
VALUES ('PAGADO', :cantidad, :total, :id_usuario, :id);
COMMIT;`}
              </code>
            </div>
          </div>

          {/* Seed script reference */}
          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 text-purple-300 font-bold mb-1 text-[11px]">
              <span>💾</span>
              <span>3. SCRIPT MOCKUP VALPARAÍSO & VIÑA DEL MAR</span>
            </div>
            <p className="text-white/70 text-[11px] font-sans">
              El archivo SQL con todos los datos sincronizados se encuentra en:
              <br />
              <span className="text-purple-300 font-mono text-[10px] select-all bg-black/40 px-1.5 py-0.5 rounded mt-1 inline-block">
                DondeE - BD/database/07_mock_valparaiso_vina.sql
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-display font-semibold text-xs border border-white/10"
        >
          Cerrar Explicación Técnica
        </button>
      </div>
    </div>
  );
}
