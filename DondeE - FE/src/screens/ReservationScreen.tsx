import React, { useState, useEffect } from "react";
import type { Venue, NightEvent, ClientProfile, ReservationTicket, TicketProvider } from "../types";
import { fireConfetti } from "../utils/confetti";

interface Props {
  venue: Venue;
  event?: NightEvent;
  activeClient: ClientProfile;
  onBack: () => void;
  onConfirmReservation: (ticket: ReservationTicket) => void;
  onViewWallet?: () => void;
}

type Phase =
  | "selection"
  | "redirecting"
  | "gateway"
  | "gateway_paying"
  | "gateway_approved"
  | "success";

interface ProviderMeta {
  name: TicketProvider;
  domain: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  brandColor: string;
  brandAccent: string;
  headerBg: string;
  tagline: string;
  logoText: string;
  partnerCode: string;
}

const PROVIDER_METAS: Record<TicketProvider, ProviderMeta> = {
  Passline: {
    name: "Passline",
    domain: "passline.com",
    badgeBg: "rgba(6, 182, 212, 0.15)",
    badgeBorder: "rgba(6, 182, 212, 0.4)",
    badgeText: "#22d3ee",
    brandColor: "#00d2ff",
    brandAccent: "#0284c7",
    headerBg: "linear-gradient(135deg, #091a32 0%, #030712 100%)",
    tagline: "Boletería Oficial & Tickets Digitales",
    logoText: "PASSLINE",
    partnerCode: "PL-CHILE",
  },
  Ticketmaster: {
    name: "Ticketmaster",
    domain: "ticketmaster.cl",
    badgeBg: "rgba(2, 108, 223, 0.15)",
    badgeBorder: "rgba(2, 108, 223, 0.4)",
    badgeText: "#60a5fa",
    brandColor: "#026cdf",
    brandAccent: "#1d4ed8",
    headerBg: "linear-gradient(135deg, #021a42 0%, #020b1e 100%)",
    tagline: "Verified Tickets · Compra 100% Segura",
    logoText: "ticketmaster",
    partnerCode: "TM-CHILE",
  },
  Puntoticket: {
    name: "Puntoticket",
    domain: "puntoticket.com",
    badgeBg: "rgba(255, 87, 34, 0.15)",
    badgeBorder: "rgba(255, 87, 34, 0.4)",
    badgeText: "#fb923c",
    brandColor: "#ff5722",
    brandAccent: "#ea580c",
    headerBg: "linear-gradient(135deg, #260a3a 0%, #100418 100%)",
    tagline: "Canal Oficial de Venta de Entradas",
    logoText: "PUNTOTICKET",
    partnerCode: "PT-CHILE",
  },
  Ticketek: {
    name: "Ticketek",
    domain: "ticketek.cl",
    badgeBg: "rgba(225, 29, 72, 0.15)",
    badgeBorder: "rgba(225, 29, 72, 0.4)",
    badgeText: "#f43f5e",
    brandColor: "#e11d48",
    brandAccent: "#be123c",
    headerBg: "linear-gradient(135deg, #2a0812 0%, #0d0407 100%)",
    tagline: "Líder en Recitales y Conciertos en Vivo",
    logoText: "TICKETEK",
    partnerCode: "TK-CHILE",
  },
  Toliv: {
    name: "Toliv",
    domain: "toliv.com",
    badgeBg: "rgba(139, 92, 246, 0.15)",
    badgeBorder: "rgba(139, 92, 246, 0.4)",
    badgeText: "#c084fc",
    brandColor: "#8b5cf6",
    brandAccent: "#7c3aed",
    headerBg: "linear-gradient(135deg, #18092a 0%, #080410 100%)",
    tagline: "Gastro, Bares & Experiencias",
    logoText: "TOLIV PAY",
    partnerCode: "TL-CHILE",
  },
};

export default function ReservationScreen({
  venue,
  event,
  activeClient,
  onBack,
  onConfirmReservation,
  onViewWallet,
}: Props) {
  const providerKey: TicketProvider =
    event?.ticketProvider || venue.ticketProvider || "Passline";
  const provider = PROVIDER_METAS[providerKey] || PROVIDER_METAS.Passline;

  const [qty, setQty] = useState(2);
  const [avail, setAvail] = useState(event ? event.availableCapacity : venue.available);
  const [phase, setPhase] = useState<Phase>("selection");
  const [payMethod, setPayMethod] = useState<"webpay" | "cuentarut" | "mercadopago">("webpay");
  const [payStepText, setPayStepText] = useState("Conectando con Transbank Webpay Plus...");
  const [payProgress, setPayProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [generatedTicket, setGeneratedTicket] = useState<ReservationTicket | null>(null);

  const [orderId] = useState(
    () => `ORD-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [authCode] = useState(
    () => `TBK-${Math.floor(100000 + Math.random() * 900000)}`
  );

  const MAX = 5; // DB check constraint: cantidad_entradas <= 5
  const unitPrice = event ? event.price : venue.price;
  const service = Math.round(unitPrice * qty * 0.05);
  const total = unitPrice * qty + service;
  const capacity = event ? event.totalCapacity : venue.capacity;
  const availPct = (avail / capacity) * 100;

  // Occasional simulated live seat decrease
  useEffect(() => {
    if (phase !== "selection") return;
    const t = setInterval(() => {
      setAvail((a) => Math.max(0, a - (Math.random() < 0.35 ? 1 : 0)));
    }, 4500);
    return () => clearInterval(t);
  }, [phase]);

  // Phase transition: Redirection to external ticketing platform
  useEffect(() => {
    if (phase === "redirecting") {
      const timer = setTimeout(() => {
        setPhase("gateway");
      }, 1300);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Phase transition: External gateway payment processing
  useEffect(() => {
    if (phase !== "gateway_paying") return;

    setPayProgress(10);
    setPayStepText("Conectando con Servidor Seguro de Transbank...");

    const t1 = setTimeout(() => {
      setPayProgress(40);
      setPayStepText("Autorizando transacción con el emisor bancario (3D Secure)...");
    }, 700);

    const t2 = setTimeout(() => {
      setPayProgress(80);
      setPayStepText(`¡Transacción Autorizada! Código ${authCode}`);
    }, 1400);

    const t3 = setTimeout(() => {
      setPayProgress(100);
      setPayStepText(`Emitiendo entrada digital vía ${provider.name}...`);
      setPhase("gateway_approved");
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [phase, authCode, provider.name]);

  // Phase transition: Countdown after approved payment and redirect back to DondeE
  useEffect(() => {
    if (phase !== "gateway_approved") return;

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          completeCallbackToDondeE();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Complete return callback to DondeE
  const completeCallbackToDondeE = () => {
    const cityPrefix = venue.city === "Valparaíso" ? "VALP" : "VINA";
    const venueSlug = venue.name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `${cityPrefix}-${venueSlug}-${randomCode}`;

    const newTicket: ReservationTicket = {
      ticketId,
      venueId: venue.id,
      venueName: venue.name,
      city: venue.city,
      address: venue.address,
      eventTitle: event ? event.title : `Entrada General · ${venue.name}`,
      eventDate: event ? `${event.date} · ${event.time}` : "Hoy · 22:00",
      quantity: qty,
      unitPrice,
      serviceFee: service,
      totalPaid: total,
      purchaseDate: "Hoy, Ahora",
      provider: provider.name,
      transactionToken: `${provider.partnerCode}-${authCode}`,
      status: "PAGADO",
    };

    setGeneratedTicket(newTicket);
    onConfirmReservation(newTicket);
    fireConfetti();
    setPhase("success");
  };

  const avColor = availPct > 40 ? "#22c55e" : availPct > 15 ? "#f59e0b" : "#ef4444";
  const avLabel = avail <= 5 ? "¡Últimos cupos!" : avail <= 12 ? "Pocos cupos" : "Disponible";

  // ── BACKGROUND BACKDROP ──
  const Backdrop = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg width="100%" height="100%" className="absolute inset-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="g48" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#07071a" />
        <rect width="100%" height="100%" fill="url(#g48)" />
      </svg>
      <div className="absolute inset-0" style={{ backdropFilter: "blur(16px) saturate(120%)" }} />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, rgba(7,7,26,0.6) 0%, rgba(7,7,26,0.88) 100%)",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "20%",
          top: "25%",
          width: 250,
          height: 250,
          borderRadius: "50%",
          background: "rgba(168,85,247,0.14)",
          filter: "blur(60px)",
        }}
      />
    </div>
  );

  // =========================================================================
  // VIEW 1: REDIRECTION TRANSITION
  // =========================================================================
  if (phase === "redirecting") {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
        <Backdrop />
        <div className="relative z-10 w-full max-w-[360px] p-6 rounded-3xl border border-purple-500/30 bg-[#0e0a24]/90 backdrop-blur-xl shadow-2xl flex flex-col items-center animate-fade-in">
          {/* Animated Lock Shield */}
          <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-25"
              style={{ background: provider.brandColor }}
            />
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xl"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderColor: provider.brandColor,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={provider.brandColor} strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

          <span
            className="font-mono text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full mb-2"
            style={{
              background: provider.badgeBg,
              border: `1px solid ${provider.badgeBorder}`,
              color: provider.badgeText,
            }}
          >
            Redirección Segura SSL 256-bit
          </span>

          <h2 className="font-display font-extrabold text-xl text-white mb-1">
            Conectando con {provider.name}
          </h2>
          <p className="font-mono text-xs text-white/50 mb-4 leading-relaxed">
            Transfiriendo tu reserva cifrada hacia los servidores oficiales de{" "}
            <span className="text-white font-semibold">{provider.domain}</span>...
          </p>

          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mb-3">
            <div
              className="h-full rounded-full animate-pulse transition-all duration-1000"
              style={{ width: "90%", background: provider.brandColor }}
            />
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[9px] text-white/40">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Protocolo HTTPS Cifrado TLS 1.3 · Partner Verificado</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: EXTERNAL TICKETING GATEWAY (Passline / Puntoticket / Ticketmaster / etc.)
  // =========================================================================
  if (phase === "gateway" || phase === "gateway_paying" || phase === "gateway_approved") {
    return (
      <div className="relative w-full h-full flex flex-col bg-[#070b14] overflow-hidden select-none">
        {/* Simulated Browser Chrome / Address Bar */}
        <div className="bg-[#0f172a] border-b border-white/10 pt-7 pb-2.5 px-3 flex flex-col gap-1.5 flex-shrink-0 z-30 shadow-md">
          <div className="flex items-center justify-between text-white/40 text-[10px]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPhase("selection")}
                disabled={phase === "gateway_paying"}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                title="Volver a DondeE"
              >
                <span>✕</span>
                <span className="font-mono text-[9px]">Cancelar y volver a DondeE</span>
              </button>
            </div>
            <span className="font-mono text-[9px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              TLS 1.3 Seguro
            </span>
          </div>

          {/* Browser Address Bar URL */}
          <div className="flex items-center gap-2 bg-[#090d16] px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div className="flex-1 font-mono text-[11px] text-white/80 truncate">
              {phase === "gateway_approved" ? (
                <span className="text-emerald-300">
                  https://dondee.cl/checkout/callback?status=approved&order_id={orderId}&token={authCode}
                </span>
              ) : (
                <>
                  <span className="text-emerald-400 font-bold">https://www.{provider.domain}</span>
                  <span className="text-white/40">/checkout/{orderId.toLowerCase()}?partner=dondee</span>
                </>
              )}
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
              <path d="M21 2l-2 2m-14 14l-2 2m16-16l-2 2M3 21l2-2" />
            </svg>
          </div>
        </div>

        {/* Main Gateway Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-8">
          {/* Official Provider Header */}
          <div
            className="rounded-2xl p-4 border border-white/10 shadow-lg relative overflow-hidden"
            style={{ background: provider.headerBg }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="px-2.5 py-1 rounded-lg font-display font-black text-xs tracking-wider text-black shadow"
                  style={{ background: provider.brandColor }}
                >
                  {provider.logoText}
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/60">
                  Boletería Oficial
                </span>
              </div>
              <span className="font-mono text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                ✓ Comercio Verificado
              </span>
            </div>
            <h3 className="font-display font-extrabold text-white text-base leading-tight">
              {provider.tagline}
            </h3>
            <p className="font-mono text-[10px] text-white/50 mt-0.5">
              Transacción conectada con DondeE · Partner Autorizado V Región
            </p>
          </div>

          {/* If Approved: Show Countdown & Immediate Return */}
          {phase === "gateway_approved" ? (
            <div className="rounded-2xl p-5 border border-emerald-500/40 bg-emerald-950/40 backdrop-blur-md text-center space-y-3 animate-fade-in shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-300">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Pago Aprobado por Webpay Plus
                </span>
                <h3 className="font-display font-extrabold text-xl text-white mt-1">
                  ¡Transacción Exitosa!
                </h3>
                <p className="font-mono text-xs text-white/70 mt-1">
                  Código Transbank: <span className="text-emerald-300 font-bold">{authCode}</span>
                </p>
                <p className="font-mono text-xs text-white/50 mt-0.5">
                  Monto Cobrado: ${(total / 1000).toFixed(0)}.000 CLP
                </p>
              </div>

              {/* Countdown banner */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-xs text-white/90">
                  Redirigiendo de regreso a <strong className="text-purple-300">DondeE</strong> en{" "}
                  <strong className="text-emerald-400 font-bold">{countdown}s</strong>...
                </span>
              </div>

              <button
                onClick={completeCallbackToDondeE}
                className="w-full py-3 rounded-xl font-display text-xs font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  boxShadow: "0 0 20px rgba(34, 197, 94, 0.4)",
                }}
              >
                <span>↩ Volver a DondeE ahora</span>
              </button>
            </div>
          ) : (
            <>
              {/* Order Summary on Provider */}
              <div className="rounded-2xl p-4 bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-mono text-[10px] text-white/40 uppercase">Resumen de la Orden</span>
                  <span className="font-mono text-[10px] text-purple-300 font-bold">{orderId}</span>
                </div>

                <div>
                  <h4 className="font-display font-bold text-white text-sm">
                    {event ? event.title : `Entrada General · ${venue.name}`}
                  </h4>
                  <p className="font-mono text-[10px] text-white/50 mt-0.5">
                    {venue.name} · {venue.city} ({venue.sector})
                  </p>
                  <p className="font-mono text-[10px] text-purple-300 mt-0.5">
                    {event ? `${event.date} · ${event.time}` : "Hoy · 22:00"}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-white/60">
                    <span>Titular:</span>
                    <span className="text-white font-semibold">{activeClient.name}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Email de envío:</span>
                    <span className="text-white font-semibold">{activeClient.email}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>RUT Verificado:</span>
                    <span className="text-white font-semibold">18.492.381-K</span>
                  </div>
                </div>

                {/* Pricing Table */}
                <div className="space-y-1 pt-1 font-mono text-[11px]">
                  <div className="flex justify-between text-white/50">
                    <span>{qty}× Entradas Generales</span>
                    <span>${((unitPrice * qty) / 1000).toFixed(0)}.000 CLP</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>Cargo por Servicio {provider.name} (5%)</span>
                    <span>${(service / 1000).toFixed(1)}.000 CLP</span>
                  </div>
                  <div className="h-px bg-white/10 my-1.5" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-display font-bold text-white">Total a Cobrar</span>
                    <span className="font-display font-extrabold text-emerald-400 text-base">
                      ${(total / 1000).toFixed(0)}.000 CLP
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="rounded-2xl p-4 bg-white/5 border border-white/10 space-y-2">
                <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
                  Selecciona Medio de Pago Seguro (Chile)
                </span>

                <div className="space-y-1.5">
                  {[
                    {
                      id: "webpay",
                      name: "Webpay Plus (Transbank)",
                      desc: "Tarjetas de Débito, Crédito y Prepago",
                      icon: "💳",
                    },
                    {
                      id: "cuentarut",
                      name: "BancoEstado (CuentaRUT / Redcompra)",
                      desc: "Pago inmediato con Clave Transferencias",
                      icon: "🏦",
                    },
                    {
                      id: "mercadopago",
                      name: "Mercado Pago Chile",
                      desc: "Saldo en cuenta o dinero disponible",
                      icon: "📱",
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={phase === "gateway_paying"}
                      onClick={() => setPayMethod(m.id as any)}
                      className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        payMethod === m.id
                          ? "bg-purple-500/20 border-purple-400 text-white"
                          : "bg-black/20 border-white/5 text-white/60 hover:bg-black/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{m.icon}</span>
                        <div>
                          <p className="font-display font-bold text-xs text-white leading-tight">
                            {m.name}
                          </p>
                          <p className="font-mono text-[10px] text-white/40">{m.desc}</p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          payMethod === m.id ? "border-purple-400 bg-purple-500" : "border-white/20"
                        }`}
                      >
                        {payMethod === m.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paying Progress or Pay Action Button */}
              {phase === "gateway_paying" ? (
                <div className="rounded-2xl p-4 border border-cyan-500/40 bg-cyan-950/20 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                    <span className="font-mono text-xs text-cyan-300 font-semibold">{payStepText}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${payProgress}%`,
                        background: "linear-gradient(90deg, #00d2ff, #22c55e)",
                      }}
                    />
                  </div>
                  <p className="font-mono text-[9px] text-white/40 text-center">
                    No cierres esta ventana mientras Transbank procesa el pago seguro.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => setPhase("gateway_paying")}
                    className="w-full py-3.5 rounded-2xl font-display text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${provider.brandAccent}, ${provider.brandColor})`,
                      boxShadow: `0 0 25px ${provider.brandColor}50`,
                      color: "#000",
                    }}
                  >
                    <span>🔒 Pagar ${(total / 1000).toFixed(0)}.000 CLP en {provider.name}</span>
                  </button>

                  <div className="flex items-center justify-center gap-2 font-mono text-[9px] text-white/40 text-center">
                    <span>Transacción protegida por Transbank 3D Secure</span>
                    <span>·</span>
                    <span>Retorno automático garantizado a DondeE</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: SUCCESS CONFIRMATION IN DONDE-E (Returned from External Gateway)
  // =========================================================================
  if (phase === "success" && generatedTicket) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden p-4 select-none">
        <Backdrop />
        <div className="relative z-10 w-full max-w-[390px] animate-slide-up">
          {/* Ticket Body */}
          <div
            className="rounded-[28px] overflow-hidden border border-purple-500/40 shadow-2xl"
            style={{
              background: "linear-gradient(150deg, rgba(20,10,42,0.96), rgba(12,6,26,0.98))",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.06), 0 24px 64px rgba(0,0,0,0.8), 0 0 60px rgba(168,85,247,0.25)",
            }}
          >
            {/* Venue Image Banner */}
            <div className="relative h-36 overflow-hidden">
              <img
                src={venue.image}
                alt={venue.name}
                className="w-full h-full object-cover"
                style={{ filter: "brightness(0.5) saturate(1.3)" }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(12,6,26,1) 0%, rgba(12,6,26,0.3) 60%, transparent 100%)",
                }}
              />
              {/* Green checkmark badge */}
              <div
                className="absolute top-3.5 right-4 w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(34,197,94,0.2)",
                  border: "1.5px solid rgba(34,197,94,0.6)",
                  boxShadow: "0 0 20px rgba(34,197,94,0.4)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>

              <div className="absolute bottom-3 left-4 right-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-mono text-[9px] text-green-400 font-bold uppercase tracking-widest">
                    ✓ Compra Exitosa Confirmada
                  </span>
                  <span
                    className="font-mono text-[8px] px-1.5 py-0.2 rounded font-bold"
                    style={{
                      background: provider.badgeBg,
                      color: provider.badgeText,
                      border: `1px solid ${provider.badgeBorder}`,
                    }}
                  >
                    Vía {provider.name}
                  </span>
                </div>
                <h2 className="font-display text-xl font-extrabold text-white leading-tight">
                  {venue.name}
                </h2>
                <p className="font-mono text-[11px] text-white/60 truncate">
                  {generatedTicket.eventTitle}
                </p>
              </div>
            </div>

            {/* Tear Divider with Notches */}
            <div className="flex items-center px-0 -my-px">
              <div
                className="w-6 h-6 rounded-full -ml-3 flex-shrink-0"
                style={{ background: "rgba(7,7,26,0.98)" }}
              />
              <div
                className="flex-1"
                style={{ borderTop: "1.5px dashed rgba(168,85,247,0.35)", margin: "0 2px" }}
              />
              <div
                className="w-6 h-6 rounded-full -mr-3 flex-shrink-0"
                style={{ background: "rgba(7,7,26,0.98)" }}
              />
            </div>

            {/* QR Code & Transaction Details */}
            <div className="p-5 flex gap-4 items-start">
              {/* Dynamic QR Code mockup with DondeE emblem */}
              <div className="w-[88px] h-[88px] flex-shrink-0 bg-white rounded-2xl p-2 relative shadow-md">
                <svg viewBox="0 0 80 80" className="w-full h-full">
                  <rect x="4" y="4" width="26" height="26" fill="none" stroke="#000" strokeWidth="5" rx="3" />
                  <rect x="11" y="11" width="12" height="12" fill="#000" rx="1" />
                  <rect x="50" y="4" width="26" height="26" fill="none" stroke="#000" strokeWidth="5" rx="3" />
                  <rect x="57" y="11" width="12" height="12" fill="#000" rx="1" />
                  <rect x="4" y="50" width="26" height="26" fill="none" stroke="#000" strokeWidth="5" rx="3" />
                  <rect x="11" y="57" width="12" height="12" fill="#000" rx="1" />
                  {[
                    [36, 6], [42, 6], [36, 12], [42, 12], [36, 18], [42, 18],
                    [6, 36], [12, 36], [6, 42], [12, 42], [36, 36], [42, 36],
                    [42, 42], [50, 42], [50, 50], [56, 50], [56, 56], [62, 56]
                  ].map(([x, y], i) => (
                    <rect key={i} x={x} y={y} width="5" height="5" fill="#000" rx="0.5" />
                  ))}
                </svg>
                {/* Center Badge */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shadow"
                    style={{ background: "linear-gradient(135deg,#9333ea,#db2777)" }}
                  >
                    <span className="font-display font-extrabold text-white text-[10px]">D</span>
                  </div>
                </div>
              </div>

              {/* Text metadata */}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mb-0.5">
                  Ticket Identificador
                </p>
                <p className="font-mono text-xs font-bold text-purple-300 tracking-wider mb-2">
                  {generatedTicket.ticketId}
                </p>

                <div className="space-y-1">
                  {[
                    ["Titular", activeClient.name.split(" ")[0] + " " + (activeClient.name.split(" ")[1] || "")],
                    ["Boletería", provider.name],
                    ["Token Webpay", generatedTicket.transactionToken || "TBK-OK"],
                    ["Entradas", `${qty}× general`],
                    ["Total Pagado", `$${(total / 1000).toFixed(0)}.000 CLP`],
                  ].map(([k, val], i) => (
                    <div key={i} className="flex justify-between text-[10px] font-mono">
                      <span className="text-white/35">{k}:</span>
                      <span className={i === 4 ? "text-emerald-300 font-bold" : "text-white/70"}>
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Validity status footer */}
            <div
              className="mx-4 mb-4 flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-green-400"
                  style={{ boxShadow: "0 0 6px rgba(34,197,94,0.9)" }}
                />
                <span className="font-mono text-[9px] text-green-400 font-semibold uppercase tracking-wider">
                  Válido · PostgreSQL Transaction OK
                </span>
              </div>
              <span className="font-mono text-[9px] text-white/40">Guardado en Billetera</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 space-y-2">
            {onViewWallet && (
              <button
                onClick={onViewWallet}
                className="w-full py-3 rounded-2xl font-display text-sm font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg,#9333ea,#db2777)",
                  boxShadow: "0 0 20px rgba(168,85,247,0.4)",
                }}
              >
                <span>🎟️ Ver en mi Billetera de Entradas</span>
              </button>
            )}

            <button
              onClick={onBack}
              className="w-full py-2.5 rounded-2xl font-display text-xs font-semibold text-white/70 hover:text-white bg-white/5 border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🗺️ Volver al Mapa de Locales</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: SELECTION & REDIRECTION PREPARATION (Initial Checkout Screen)
  // =========================================================================
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none">
      <Backdrop />

      {/* Top back navigation button */}
      <div className="relative z-20 pt-8 px-4 flex-shrink-0 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(12px)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-semibold">
            Boletería: {provider.name}
          </span>
        </div>
      </div>

      {/* Center modal card */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 -mt-3">
        <div
          className="w-full max-w-[390px] rounded-[30px] overflow-hidden border border-purple-500/30"
          style={{
            background: "linear-gradient(145deg,rgba(18,10,38,0.92) 0%,rgba(10,5,22,0.95) 100%)",
            backdropFilter: "blur(32px) saturate(160%)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.06), 0 32px 80px rgba(0,0,0,0.75), 0 0 80px rgba(168,85,247,0.2)",
          }}
        >
          {/* Header image & title */}
          <div className="relative h-32 overflow-hidden">
            <img
              src={venue.image}
              alt={venue.name}
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.45) saturate(1.4)" }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(12,6,26,0) 0%, rgba(12,6,26,0.6) 60%, rgba(12,6,26,1) 100%)",
              }}
            />

            {/* Tag badge */}
            <div className="absolute top-3 left-4 flex gap-1.5">
              <span
                className="font-mono text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-widest font-bold text-purple-200"
                style={{
                  background: "rgba(168,85,247,0.3)",
                  border: "1px solid rgba(168,85,247,0.5)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {venue.city} · {venue.sector}
              </span>
            </div>

            {/* Title */}
            <div className="absolute bottom-2 left-4 right-4">
              <h1 className="font-display text-[20px] font-extrabold text-white leading-tight tracking-tight">
                {venue.name}
              </h1>
              <p className="font-mono text-[10px] text-white/50">
                {event ? event.title : venue.genre}
              </p>
            </div>
          </div>

          <div className="px-4 pt-2.5 pb-4 space-y-2.5">
            {/* ── OFFICIAL TICKETING PLATFORM BANNER ── */}
            <div
              className="rounded-2xl p-2.5 border flex items-center justify-between"
              style={{
                background: provider.badgeBg,
                borderColor: provider.badgeBorder,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-display font-extrabold text-[10px] text-black shadow"
                  style={{ background: provider.brandColor }}
                >
                  {provider.logoText.slice(0, 3)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-bold text-xs text-white">
                      Boletería Oficial: {provider.name}
                    </span>
                    <span className="font-mono text-[8px] text-emerald-400 font-bold">✓ Cifrado</span>
                  </div>
                  <p className="font-mono text-[9px] text-white/50">
                    Redirección externa segura con retorno garantizado
                  </p>
                </div>
              </div>
              <span
                className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                style={{ color: provider.badgeText, background: "rgba(0,0,0,0.3)" }}
              >
                {provider.domain}
              </span>
            </div>

            {/* ── REAL-TIME CAPACITY INDICATOR ── */}
            <div
              className="rounded-2xl p-2.5"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${avColor}30` }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: avColor,
                      boxShadow: `0 0 8px ${avColor}`,
                    }}
                  />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-white/55">
                    Aforo en Tiempo Real (PostgreSQL)
                  </span>
                </div>
                <span
                  className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                  style={{ color: avColor, background: `${avColor}20`, border: `1px solid ${avColor}40` }}
                >
                  {avLabel}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display text-[26px] font-extrabold leading-none" style={{ color: avColor }}>
                  {avail}
                </span>
                <span className="font-mono text-xs text-white/40">/ {capacity} cupos totales</span>
              </div>

              {/* Progress bar */}
              <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${availPct}%`,
                    background: `linear-gradient(90deg,${avColor}bb,${avColor})`,
                    boxShadow: `0 0 10px ${avColor}80`,
                  }}
                />
              </div>
            </div>

            {/* ── QUANTITY SELECTOR (ANTI-OVERBOOKING & REVENTA) ── */}
            <div
              className="rounded-2xl p-2.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/50">
                  Cantidad de Entradas
                </span>
                <span className="font-mono text-[9px] text-white/35">Máx. {MAX} por usuario</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-display text-xl transition-all cursor-pointer"
                  style={{
                    background: qty > 1 ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${qty > 1 ? "rgba(168,85,247,0.45)" : "rgba(255,255,255,0.08)"}`,
                    color: qty > 1 ? "#c084fc" : "rgba(255,255,255,0.2)",
                  }}
                >
                  −
                </button>

                <div className="flex-1 flex flex-col items-center">
                  <span className="font-display text-[28px] font-extrabold leading-none text-white">
                    {qty}
                  </span>
                  <span className="font-mono text-[9px] text-white/40 uppercase mt-0.5">
                    {qty === 1 ? "entrada nominativa" : "entradas nominativas"}
                  </span>
                </div>

                <button
                  onClick={() => setQty((q) => Math.min(MAX, Math.min(avail, q + 1)))}
                  disabled={qty >= MAX || qty >= avail}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-display text-xl transition-all cursor-pointer"
                  style={{
                    background:
                      qty < MAX && qty < avail ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${
                      qty < MAX && qty < avail ? "rgba(168,85,247,0.45)" : "rgba(255,255,255,0.08)"
                    }`,
                    color: qty < MAX && qty < avail ? "#c084fc" : "rgba(255,255,255,0.2)",
                  }}
                >
                  +
                </button>
              </div>

              {qty >= MAX && (
                <div
                  className="mt-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded-lg"
                  style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)" }}
                >
                  <span className="font-mono text-[8px] text-orange-300">
                    ⚠️ Límite anti-reventa activado (tope 5 entradas por RUT)
                  </span>
                </div>
              )}
            </div>

            {/* ── PRICE SUMMARY ── */}
            <div
              className="rounded-2xl p-2.5 space-y-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex justify-between items-center font-mono text-[10px]">
                <span className="text-white/45">{qty}× general</span>
                <span className="text-white/70">${((unitPrice * qty) / 1000).toFixed(0)}.000</span>
              </div>
              <div className="flex justify-between items-center font-mono text-[10px]">
                <span className="text-white/45">Cargo de servicio {provider.name} (5%)</span>
                <span className="text-white/70">${(service / 1000).toFixed(1)}.000</span>
              </div>
              <div className="h-px bg-white/10 my-0.5" />
              <div className="flex justify-between items-center">
                <span className="font-display text-xs font-bold text-white">Total a Pagar</span>
                <span className="font-display text-base font-extrabold text-purple-300">
                  ${(total / 1000).toFixed(0)}.000 CLP
                </span>
              </div>
            </div>

            {/* ── REDIRECTION ACTION BUTTON ── */}
            <div>
              <button
                onClick={() => setPhase("redirecting")}
                disabled={avail === 0}
                className="w-full py-3 rounded-2xl font-display text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg,#9333ea 0%,#a855f7 45%,#db2777 100%)",
                  boxShadow: "0 0 25px rgba(168,85,247,0.5), 0 8px 24px rgba(0,0,0,0.5)",
                }}
              >
                <span>🔒 Pagar vía {provider.name} (Redirección Segura) ↗️</span>
              </button>
            </div>

            {/* Redirection Security Note */}
            <p className="font-mono text-[8px] text-white/40 text-center leading-normal">
              Serás redirigido a la pasarela de <strong>{provider.name}</strong> para el pago en Webpay.
              Al finalizar, serás devuelto automáticamente a DondeE con tus entradas activas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
