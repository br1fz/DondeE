import React, { useState } from "react";
import type { ClientProfile, ReservationTicket } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientProfile[];
  activeClient: ClientProfile;
  onSelectClient: (client: ClientProfile) => void;
}

export default function ClientDrawer({
  isOpen,
  onClose,
  clients,
  activeClient,
  onSelectClient,
}: Props) {
  const [activeTab, setActiveTab] = useState<"tickets" | "clients">("tickets");
  const [selectedTicket, setSelectedTicket] = useState<ReservationTicket | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md transition-all">
      <div
        className="relative w-full max-w-[430px] h-[85%] sm:h-[650px] rounded-t-[32px] sm:rounded-[32px] flex flex-col overflow-hidden border border-purple-500/30"
        style={{
          background: "linear-gradient(165deg, #0f0a24 0%, #080614 100%)",
          boxShadow: "0 0 60px rgba(168,85,247,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Top Header */}
        <div className="p-5 pb-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg"
              style={{ background: activeClient.avatarGradient }}
            >
              {activeClient.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-white text-base leading-tight">
                  {activeClient.name}
                </h3>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                  {activeClient.role}
                </span>
              </div>
              <p className="font-mono text-xs text-white/50">{activeClient.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 flex items-center justify-center border border-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex px-5 pt-3 gap-2 border-b border-white/5">
          <button
            onClick={() => setActiveTab("tickets")}
            className={`flex-1 py-2 text-xs font-display font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === "tickets"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            <span>🎟️ Mis Entradas</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-200">
              {activeClient.activeTickets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("clients")}
            className={`flex-1 py-2 text-xs font-display font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === "clients"
                ? "border-pink-500 text-pink-300"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            <span>👥 Cambiar Cliente ({clients.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {activeTab === "tickets" ? (
            activeClient.activeTickets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center text-2xl mb-3 border border-purple-500/20">
                  🎟️
                </div>
                <h4 className="font-display font-bold text-white text-sm mb-1">Sin entradas activas</h4>
                <p className="font-mono text-xs text-white/40 max-w-[220px]">
                  Reserva en los locales de Valparaíso o Viña del Mar para ver tu QR y ticket aquí.
                </p>
              </div>
            ) : (
              activeClient.activeTickets.map((t, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl p-4 border transition-all"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    borderColor: "rgba(168, 85, 247, 0.25)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-purple-400 font-semibold">
                          {t.city} · {t.venueName}
                        </span>
                        <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                          {t.provider}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-white text-base leading-tight mt-0.5">
                        {t.eventTitle}
                      </h4>
                      <p className="font-mono text-[11px] text-white/45 mt-1">{t.eventDate}</p>
                    </div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      VÁLIDO
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-white/40">Código:</span>
                      <span className="font-mono text-xs font-bold text-purple-300">
                        {t.ticketId}
                      </span>
                    </div>

                    <div className="font-mono text-xs font-bold text-white">
                      {t.quantity} {t.quantity === 1 ? "cupo" : "cupos"} (${(t.totalPaid / 1000).toFixed(0)}.000)
                    </div>
                  </div>

                  {t.transactionToken && (
                    <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-white/5 font-mono text-[9px]">
                      <span className="text-white/35">Token Pasarela:</span>
                      <span className="text-emerald-400/80 font-bold">{t.transactionToken}</span>
                    </div>
                  )}
                </div>
              ))
            )
          ) : (
            // CLIENTS TAB
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase text-white/40 tracking-wider mb-2">
                Selecciona un cliente para la demostración en vivo:
              </p>
              {clients.map((c) => {
                const isSelected = c.id === activeClient.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectClient(c)}
                    className={`w-full text-left p-3 rounded-2xl flex items-center justify-between border transition-all ${
                      isSelected
                        ? "bg-purple-500/20 border-purple-500 text-white"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow"
                        style={{ background: c.avatarGradient }}
                      >
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-semibold text-xs text-white">
                            {c.name}
                          </span>
                          <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-white/10 text-white/60">
                            {c.city}
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-white/40 truncate max-w-[200px]">
                          {c.bio}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[10px] text-purple-300">
                        {c.activeTickets.length} {c.activeTickets.length === 1 ? "ticket" : "tickets"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-black/40 border-t border-white/5 text-center">
          <span className="font-mono text-[9px] text-white/30">
            DondeE DB v1.0 · Usuarios y Clientes sincronizados con PostgreSQL
          </span>
        </div>
      </div>
    </div>
  );
}
