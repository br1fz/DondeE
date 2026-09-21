# DondeE - Frontend (FE) 🪩📍

Aplicación web frontend de última generación para **DondeE**, plataforma geo-social nocturna desarrollada con **React 19, TypeScript, Tailwind CSS v4 y Vite**. Centrada en la bohemia y vida nocturna real de **Valparaíso** y **Viña del Mar**.

---

## 🚀 Características y Funcionalidades Integradas

### 1. 🛰️ Geolocalización Automática y Proximidad Real
- **Solicitud de Permisos al Ingresar**: Al abrir la aplicación, un modal interactivo consulta automáticamente los permisos de geolocalización al usuario (`navigator.geolocation`).
- **Cálculo de Distancia Haversine**: Calcula en tiempo real la distancia euclidiana esférica entre la posición del usuario y los 42 recintos registrados.
- **Detección de Ciudad Más Cercana**: Centra la búsqueda automáticamente en **Valparaíso** o **Viña del Mar**, ordenando los locales y eventos según cercanía física real.

### 2. 🗺️ Radar Nocturno y Búsqueda Geo-Espacial (UCE01)
- **42 Locales Reales de la V Región**:
  - **Valparaíso (21 locales)**: Club El Huevo, Bar La Playa, Cinzano, Terraza Bellavista, El Gato en la Ventana, El Internado, Cervecería Altamira, Mascara Club, La Piedra Feliz, Pagano Club, Fauna Bar, Waddington, Subterráneo, etc.
  - **Viña del Mar (21 locales)**: Club OVO (Enjoy Viña), Journal Bar, Stylo Sunset, Living Club Reñaca, La Tertulia, Bar Hollywood, Del Barrio, Club de la Cerveza, Sunset Lounge Reñaca, Murano Viña, Deck 00, Gatsby, etc.
- **126 Eventos Nocturnos Reales**: 3 eventos por cada local, con producciones internas y alianzas con productoras consagradas (Transistor, Fauna, Sundeck, Club del Sol, Piknic Électronik, etc.).
- **Visualización Cyberpunk**: Radar interactivo, aforo en vivo (`aforo_disponible / aforo_total`) y reseñas verificadas.

### 3. 💳 Redirección Segura a Boleterías Externas y Retorno a DondeE (UCE02)
- **Asignación Oficial de Boletería**: Cada evento y recinto opera con su distribuidor autorizado de entradas en Chile:
  - 🎟️ **Passline Chile** (`passline.com`): Discotecas y eventos electrónicos masivos (El Huevo, Pagano, Living Reñaca, Murano, Deck 00, etc.).
  - 🎟️ **Puntoticket** (`puntoticket.com`): Eventos de gala y espectáculos en Casino Enjoy Viña del Mar.
  - 🎟️ **Ticketmaster Chile** (`ticketmaster.cl`): Grandes escenarios, producciones y conciertos (Hollywood, Cinzano, Gatsby).
  - 🎟️ **Ticketek Chile** (`ticketek.cl`): Bares de rock, bandas en vivo y tocatas (La Piedra Feliz, Journal, House Rock).
  - 🎟️ **Toliv Pay** (`toliv.com`): Cervecerías artesanales, bistrós culturales y gastronomía nocturna (Altamira, El Internado, Boca de Pez).
- **Flujo de Redirección Segura (Simulación de Pasarela Externa)**:
  1. **Selección y Control Anti-Reventa**: Elección de entradas (máx. 5 por usuario según restricción `CHECK`), cálculo de costo y tasa de servicio (5%).
  2. **Túnel de Redirección HTTPS**: Pantalla de transición segura con protocolo TLS 1.3 hacia los servidores oficiales del proveedor.
  3. **Pasarela de Checkout del Proveedor**: Simulación de la interfaz oficial de Passline, Puntoticket, Ticketmaster, etc., con barra de navegación SSL, datos del titular y medios de pago chilenos (**Webpay Plus / Transbank**, **BancoEstado CuentaRUT**, **Mercado Pago**).
  4. **Autorización Bancaria Webpay**: Simulación del flujo de confirmación 3D Secure con emisión de código de autorización (ej. `TBK-948210`).
  5. **Retorno Automático a DondeE**: Callback de éxito (`dondee.cl/checkout/callback?status=approved&token=...`) que retorna al usuario a DondeE.
  6. **Acreditación Inmediata de Entrada**: Generación de ticket QR oficial con firma criptográfica, descuento atómico de aforo en PostgreSQL y guardado en la Billetera del usuario.

### 4. 👥 Perfiles de Clientes y Billetera de Entradas
- Perfiles de clientes reales para demostración en vivo (excluyendo a miembros del grupo académico):
  - **Valentina Morales** (Viña del Mar)
  - **Diego Silva** (Valparaíso - USM)
  - **Camila Rojas** (Viña del Mar - Google Local Guide)
  - **Ignacio Valenzuela** (Valparaíso)
  - **Francisca Soto** (Reñaca)
  - **Matías Concha** (Valparaíso)
  - **Catalina Muñoz** (Viña del Mar)
  - **Sebastián Arancibia** (Valparaíso)
- Visualización de entradas activas con código de entrada, estado de validación, token de pasarela y boletería emisora.

---

## 💻 Ejecución del Proyecto

```bash
# 1. Navegar a la carpeta frontend
cd "DondeE - FE"

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor local
npm run dev
```

La aplicación abrirá por defecto en `http://localhost:5173/`.

---

## 🗄️ Sincronización con Base de Datos Relacional y Espacial

Todos los recintos, coordenadas PostGIS (SRID 4326), clientes y eventos se encuentran debidamente sincronizados con el script SQL:
`DondeE - BD/database/07_mock_valparaiso_vina.sql`
