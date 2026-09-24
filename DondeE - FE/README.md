# DondeE - Frontend (FE) 🪩📍

Aplicación web frontend de última generación para **DondeE**, plataforma geo-social nocturna desarrollada con **React 19, TypeScript, Tailwind CSS v4, Leaflet y Vite**. Centrada en la bohemia y vida nocturna real de **Valparaíso** y **Viña del Mar**, con capacidad de escala global.

---

## 🚀 Características y Funcionalidades Integradas

### 1. 🗺️ Mapa Cartográfico Interactivo con Zoom Mundial y Navegación Libre
- **Teselas Dark Matter (CartoDB)**: Mapa en modo oscuro de alto rendimiento sin consumo de cuotas ni API keys.
- **Navegación Pan / Drag**: Arrastre fluido haciendo clic y moviendo el cursor en cualquier dirección.
- **Zoom Out Ilimitado**:
  - Escala desde nivel bar/calle (`Z-19`), nivel ciudad (`Z-14`), nivel V Región (`Z-10`), nivel Chile/Sudamérica (`Z-6`) hasta nivel continental/mundial (`Z-2`).
- **Controles de Vuelo Rápido**:
  - `🎯`: Centra la cámara en la posición GPS del usuario o en el centro urbano activo.
  - `+` / `−`: Zoom incremental de precisión.
  - `🇨🇱`: Conmutador para alejar la cámara a vista país (Chile continental) o retornar a la V Región.
- **Badge Dinámico de Escala**: Informa visualmente el contexto actual (*Nivel Calle*, *Nivel Ciudad*, *Nivel Región*, *Nivel País*, *Nivel Continental*).

### 2. ⚙️ Exploración Territorial y Radio de Búsqueda Configurable
- Menú emergente de configuración territorial que permite definir el límite geográfico deseado:
  - Presets rápidos: `3 km`, `8 km`, `15 km`, `30 km`, `50 km`.
  - Modo `🌐 Sin Límite / Global`: Permite explorar todas las ciudades y territorios sin restricciones de distancia.
  - Ajuste manual por deslizador (1 a 50 km).
  - Representación visual del radio con un anillo geodésico proyectado sobre el mapa.

### 3. 🔍 Búsqueda Multi-Entidad Conectada a la Base de Datos
- Entrada de texto conectada en tiempo real al backend (`GET /api/search?q=...`) con *debouncing* de 250 ms.
- Soporta consultas sobre:
  - 📍 **Localidades**: *Cerro Alegre, Cerro Concepción, Reñaca, Barrio Puerto, 1 Poniente, 3 Poniente, Población Vergara, Casino Enjoy, etc.*
  - 🎶 **Eventos**: *Techno, Rock, Sunset, Boleros, Cueca Brava, Mechona, Acústicos, etc.* (126 eventos registrados).
  - 🍸 **Recintos y Pubs**: *Club OVO, Fauna Bar, Living Club, El Huevo, Bar La Playa, Cinzano, etc.* (42 locales).

### 4. 📲 Despliegue de Resultados en la Ventana Inferior (Bottom Sheet)
- **Elevación Automática**: Al buscar o seleccionar una localidad, la ventana inferior se eleva a pantalla cómoda (78% de altura).
- **Pestañas de Filtro**: `Todos`, `📍 Localidades`, `🎶 Eventos`, `🍸 Locales`.
- **Navegación a Localidades (`flyTo`)**:
  - Al hacer clic en una localidad encontrada, el mapa vuela suavemente a sus coordenadas GPS, traza un marcador luminoso con halo territorial de 650 m y la ventana inferior despliega todos los eventos y pubs asociados a ese barrio.
- **Ficha y Reserva Directa de Eventos**:
  - Cada evento muestra su portada, estilo musical, aforo disponible, fecha, precio y botones de acción rápida:
    - `📍 Ver en Mapa`: Desplaza la cámara al recinto anfitrión.
    - `🎟️ Reservar`: Abre el flujo transaccional con control anti-sobreventa y QR.
    - `ℹ️ Ver ficha completa`: Muestra lineup de artistas, productora y descripción detallada.

### 5. 💳 Redirección Segura a Boleterías Externas y Retorno a DondeE (UCE02)
- **Asignación Oficial de Boletería**: Cada evento y recinto opera con su distribuidor autorizado de entradas en Chile:
  - 🎟️ **Passline Chile** (`passline.com`): Discotecas y eventos electrónicos masivos.
  - 🎟️ **Puntoticket** (`puntoticket.com`): Eventos de gala y espectáculos en Casino Enjoy Viña del Mar.
  - 🎟️ **Ticketmaster Chile** (`ticketmaster.cl`): Grandes escenarios, producciones y conciertos.
  - 🎟️ **Ticketek Chile** (`ticketek.cl`): Bares de rock, bandas en vivo y tocatas.
  - 🎟️ **Toliv Pay** (`toliv.com`): Cervecerías artesanales, bistrós culturales y gastronomía nocturna.
- **Flujo de Redirección y Retorno**:
  1. Elección de entradas (máximo 5 por usuario según restricción `CHECK`).
  2. Túnel de redirección segura con protocolo TLS 1.3 hacia los servidores oficiales del proveedor.
  3. Simulación de pasarela de pago con medios chilenos (**Webpay Plus / Transbank**, **BancoEstado CuentaRUT**, **Mercado Pago**).
  4. Callback automático de éxito a DondeE (`status=approved`).
  5. Emisión instantánea de entrada digital con código QR criptográfico y guardado en billetera.

### 6. 👥 Perfiles de Clientes y Billetera de Entradas
- 8 perfiles de demostración en vivo (*Valentina Morales, Diego Silva, Camila Rojas, Ignacio Valenzuela, Francisca Soto, etc.*).
- Billetera digital con visualización de entradas adquiridas y estado de validación.

---

## 💻 Ejecución del Proyecto

```bash
# 1. Navegar a la carpeta frontend
cd "DondeE - FE"

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

La aplicación abrirá en **`http://localhost:5173/`**.  
Las peticiones a `/api/*` son canalizadas automáticamente hacia el backend en el puerto `3001` mediante el proxy integrado de Vite.

---

## 🗄️ Sincronización con Base de Datos Relacional y Espacial

Todos los recintos, coordenadas PostGIS (SRID 4326), clientes y eventos se encuentran debidamente sincronizados con el esquema y dataset SQL:
- `DondeE - BD/database/init.sql`
- `DondeE - BD/database/07_mock_valparaiso_vina.sql`
