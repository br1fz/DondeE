# Proyecto: DondeE 🪩📍

**DondeE** es una plataforma web full-stack de última generación con enfoque geo-social diseñada para dinamizar la vida nocturna formal y la economía nocturna local. Permite a los usuarios descubrir locales, pubs, clubs y eventos cercanos en tiempo real mediante geolocalización y bases de datos espaciales (PostGIS), con navegación interactiva en mapas cartográficos, exploración territorial por localidades, gestión transaccional de aforo en vivo y reservas con boleterías oficiales.

---

## 📖 Contexto Académico

- **Asignatura:** ICI 324 - Bases de Datos y Programación Web
- **Carrera:** Ingeniería Civil Informática
- **Grupo:** 2
  - Martín Araya
  - Jorge Bahamondes
  - Bruno Díaz
- **Periodo:** Segundo Semestre 2026

---

## 🚀 Características Principales y Diseño Actual

### 1. 🗺️ Mapa Cartográfico Interactivo y Navegación Mundial
- **Teselas Dark Matter (CartoDB)**: Interfaz cyberpunk de alto contraste sin necesidad de credenciales ni API keys de terceros.
- **Navegación Táctil y con Cursor**: Arrastre fluido (*drag & pan*) con clic sostenido en cualquier dirección.
- **Zoom Out Sin Restricciones**: Permite alejarse desde vista a nivel calle/local (`Z-19`) hasta nivel metropolitano (`Z-14`), regional (`Z-10`), nacional (`Z-6`, Chile y Sudamérica) y continental/mundial (`Z-2`).
- **Controles de Vuelo Flotantes**:
  - `🎯`: Recentrado inmediato en la ubicación GPS del usuario o centro urbano.
  - `+` / `−`: Zoom incremental de precisión.
  - `🇨🇱`: Conmutador rápido para alejar la cámara a vista país (Chile continental) o volver a la V Región.
- **Badge Dinámico de Escala Territorial**: Muestra en tiempo real el contexto de visualización (*Nivel Calle*, *Nivel Ciudad*, *Nivel Región*, *Nivel País*, *Nivel Continental*).

### 2. 🛰️ Radio Territorial y Límite de Búsqueda Configurable
- Menú emergente de configuración territorial que permite al usuario definir el alcance de exploración según su necesidad:
  - Rangos prefijados: `3 km`, `8 km`, `15 km`, `30 km`, `50 km`.
  - Modo `🌐 Sin Límite / Global`: Elimina cualquier barrera geográfica para explorar recintos y eventos en cualquier ciudad o país.
  - Deslizador manual de precisión kilométrica.
  - Representación visual del rango con un anillo geodésico proyectado sobre el mapa.

### 3. 🔍 Búsqueda Multi-Entidad Conectada a la Base de Datos
La barra de búsqueda superior está conectada en tiempo real al backend y motor de base de datos relacional/PostGIS mediante el endpoint `GET /api/search?q=...`, con *debouncing* (250 ms) y soporte para tres tipos de entidades:
1. **📍 Localidades y Sectores Urbanos**:
   - Permite buscar barrios emblemáticos: *Cerro Alegre*, *Cerro Concepción*, *Barrio Puerto*, *Reñaca*, *1 Poniente*, *3 Poniente*, *Población Vergara*, *Plaza Aníbal Pinto*, *Subida Ecuador*, *Casino Enjoy*, *Valparaíso*, *Viña del Mar*, etc.
   - **Vuelo Automático (`flyTo`)**: Al seleccionar una localidad, la cámara del mapa se desplaza suavemente hacia sus coordenadas geográficas exactas, coloca un marcador luminoso con pulso y traza un halo territorial de cobertura.
2. **🎶 Eventos y Cartelera Nocturna**:
   - Catálogo de **126 eventos nocturnos reales** (3 por local) que abarcan múltiples géneros: *Techno Industrial, Indie Rock, Sunset Afro House, Noche de Boleros, Cueca Brava, Jazz Fusión, Hits & Cumbia Universitaria*.
3. **🍸 Recintos, Pubs y Clubs**:
   - **42 locales validados** distribuidos equitativamente entre Valparaíso (21) y Viña del Mar (21), con tipo de local (*Club*, *Pub*, *Bar*), dirección, patente comercial y valoración de clientes.

### 4. 📲 Despliegue de Resultados en la Ventana Inferior (Bottom Sheet)
- **Despliegue Automático**: Al escribir en el buscador o enfocar una localidad, la ventana inferior se eleva a pantalla cómoda (78% de altura) para presentar la información estructurada.
- **Filtros por Categoría**:
  - `Todos`: Resumen integral agrupado por localidades, eventos y locales.
  - `📍 Localidades`: Tarjetas de sectores con recintos disponibles y botón de vuelo al sector.
  - `🎶 Eventos`: Listado de eventos con imagen, cupos disponibles, fecha, precio y botón de reserva directa.
  - `🍸 Locales`: Ficha de recintos con aforo en tiempo real y valoración en estrellas.
- **Foco de Localidad**: Cuando se enfoca un sector, la ventana muestra un banner destacado con:
  - Nombre del sector y ciudad.
  - Conteo de locales y eventos asociados.
  - Botón de recentrado `🎯 Centrar` y botón `✕ Quitar` para volver a la vista global.
  - Cartelera exclusiva de todos los eventos que se celebran en esa localidad.
- **Ficha Extendida de Evento**:
  - Título, estilo musical, lineup de DJs/artistas, productora a cargo, boletería autorizada y cupos disponibles en vivo.
  - Botón `📍 Ver en Mapa` para centrar la cámara en el recinto anfitrión.
  - Botón `🎟️ Reservar Cupo` para iniciar el flujo transaccional.

### 5. 🎟️ Gestión Transaccional de Aforo y Boleterías Oficiales
- **Control Anti-Sobreventa**: Aforo en vivo (`aforo_disponible / aforo_total`) con alerta cromática (verde >40%, amarillo >15%, rojo crítico).
- **Alianzas con Boleterías Oficiales**: Integración con los principales operadores de ticketing en Chile:
  - 🎟️ **Passline Chile** (Clubs y festivales masivos: *El Huevo, Pagano, Living Reñaca, Murano*)
  - 🎟️ **Puntoticket** (Casino Enjoy Viña del Mar)
  - 🎟️ **Ticketmaster Chile** (Escenarios de gran envergadura y teatro bar)
  - 🎟️ **Ticketek Chile** (Tocatas de rock y música en vivo: *La Piedra Feliz, Journal*)
  - 🎟️ **Toliv Pay** (Bistrós culturales y cervecerías artesanales: *Altamira, El Internado*)
- **Emisión de Ticket Digital**: Tras completar la reserva se genera un código QR criptográfico único que descuenta cupos en la base de datos y se almacena en la billetera del cliente.

### 6. 💬 Reseñas Sociales y Perfiles de Clientes
- Sistema de comentarios con calificación (1 a 5 estrellas) para conocer el ambiente nocturno antes de asistir.
- Selector de perfiles de clientes demostrativos (*Valentina Morales*, *Diego Silva*, *Camila Rojas*, etc.) con billetera de entradas activas.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Vite 8, Leaflet 1.9, CartoDB Dark Matter Tiles |
| **Backend** | Node.js v20+, Express 5, TypeScript, pg (node-postgres), CORS, dotenv |
| **Base de Datos** | PostgreSQL 14+ con extensión espacial **PostGIS 3.4** (SRID 4326) |
| **Motor Fallback** | Motor SQL Relacional en memoria integrado (autónomo ante ausencia de servicio local) |

---

## 💻 Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js** (versión 20 o superior recomendada).
- **npm** (incluido con Node.js).
- **Git**.
- *(Opcional)* **PostgreSQL** con extensión **PostGIS** para ejecución con servidor de base de datos nativo.

## 🛠️ Instalación y Puesta en Marcha

Tienes dos alternativas para ejecutar el sistema completo:
1. **Método 1: Docker Compose (Recomendado / Cero Fricción)**: Despliega PostgreSQL 16 + PostGIS 3.4, Backend y Frontend orquestados con un solo comando.
2. **Método 2: Ejecución Local Nativa (Node.js)**: Para desarrollo independiente módulo por módulo.

---

### Método 1: Despliegue con Docker Compose 🐳 (Recomendado)

El proyecto incluye orquestación multinivel en `docker-compose.yml`:
* **`dondee_db`**: Contenedor oficial `postgis/postgis:16-3.4-alpine` que inicializa automáticamente extensiones PostGIS, esquemas DDL y el mock completo de 42 locales y 126 eventos en Valparaíso y Viña del Mar.
* **`dondee_backend`**: API Express / TypeScript compilada conectada a PostgreSQL mediante la red interna de Docker.
* **`dondee_frontend`**: React + Vite empaquetado y servido por un servidor web Nginx de alto rendimiento con proxy inverso para llamadas `/api/*`.

```bash
# 1. Clonar el repositorio
git clone https://github.com/br1fz/DondeE.git
cd DondeE

# 2. Levantar los 3 contenedores
docker compose up -d --build

# 3. Verificar estado de los servicios
docker compose ps
```

* **Acceso Web:** [http://localhost:5173/](http://localhost:5173/)
* **Estado de la BD / API:** [http://localhost:5173/api/health](http://localhost:5173/api/health)
* **Ver logs del sistema:** `docker compose logs -f`
* **Detener servicios:** `docker compose down`

---

### Método 2: Ejecución Local Nativa (Sin Docker)

#### Paso 1: Configurar la Base de Datos
##### Opción A: PostgreSQL + PostGIS Local
Si dispones de un servidor PostgreSQL local en el puerto 5432:
```bash
createdb dondee_db
psql -d dondee_db -f "DondeE - BD/database/init.sql"
psql -d dondee_db -f "DondeE - BD/database/07_mock_valparaiso_vina.sql"
```
##### Opción B: Motor Relacional Fallback
Si PostgreSQL está apagado, el backend activa automáticamente su motor relacional en memoria sin requerir configuración alguna.

#### Paso 2: Iniciar el Backend
En una terminal:
```bash
cd "DondeE - BE"
npm install
npm run build
npm start
```
> API escuchando en `http://localhost:3001`

#### Paso 3: Iniciar el Frontend
En una segunda terminal:
```bash
cd "DondeE - FE"
npm install
npm run dev
```
```bash
cd "DondeE - FE"
npm install
npm run dev
```
> La aplicación web abrirá en **`http://localhost:5173/`**.  
> El proxy de Vite canalizará de forma transparente todas las consultas `/api/*` hacia el backend en el puerto 3001.

---

## 🧪 Guía Rápida de Pruebas de Demostración

Una vez iniciada la plataforma en `http://localhost:5173`:

1. **Prueba de Mapa Libre y Zoom**:
   - Haz clic sostenido sobre el mapa y arrastra hacia cualquier dirección para navegar entre cerros y borde costero.
   - Usa los botones `+` y `−` para acercarte a nivel calle o alejarte hasta ver el mapa completo de Chile y el continente.
   - Haz clic en el botón `🇨🇱` para alternar entre la vista nacional y la V Región.
2. **Prueba de Límite de Búsqueda Territorial**:
   - En la barra superior, haz clic en el botón `Límite: 5km`.
   - Selecciona `15 km`, `50 km` o `🌐 Sin Límite` para ajustar el radio de exploración en tiempo real.
3. **Prueba de Búsqueda de Localidades con Vuelo (`flyTo`)**:
   - En el buscador superior escribe `Cerro Alegre` o `Reñaca`.
   - En la ventana inferior desplegada, haz clic en **`Volar al sector ↗`**.
   - Observa cómo el mapa se traslada suavemente al sector con un pin y radio luminosos, y la ventana inferior despliega exclusivamente los eventos y pubs pertenecientes a esa localidad.
4. **Prueba de Búsqueda de Eventos y Reserva Directa**:
   - Escribe en el buscador términos como `Techno`, `Rock`, `Boleros` o `Mechona`.
   - En los resultados de la ventana inferior, haz clic en **`🎟️ Reservar`** para abrir el flujo de reserva con QR y cupos en vivo.
5. **Prueba de Búsqueda de Locales / Pubs**:
   - Busca `OVO`, `Fauna`, `Living Club` o `Bar La Playa`.
   - Haz clic en **`Ver Recinto ↗`** para centrar la cámara en el local y desplegar su aforo en vivo y cartelera de 3 eventos.
6. **Prueba de Esquema SQL y PostGIS**:
   - Haz clic en el botón `🗄️ PostGIS` en la barra superior para visualizar la arquitectura de tablas relacionales, índices espaciales GiST y estado de conexión de la base de datos.

---

## 📁 Estructura del Repositorio

```text
DondeE/
├── docker-compose.yml          # Orquestador maestro Docker (db, backend, frontend)
├── docker/
│   └── postgres/
│       └── 01_init.sql         # Script consolidado DDL PostGIS + Mock 42 locales
├── Documentos/
│   ├── README.md               # Documentación maestra del proyecto
│   ├── proximas API.md         # Especificación de álgebra relacional y nuevos endpoints
│   ├── Informe_DondeE.pdf      # Informe académico detallado
│   └── Presentación 1.pptx     # Diapositivas de presentación del proyecto
├── DondeE - BD/
│   └── database/
│       ├── init.sql            # Definición DDL, tablas, llaves foráneas y tipos
│       └── 07_mock_valparaiso_vina.sql # Datos mock reales de Valparaíso y Viña
├── DondeE - BE/
│   ├── Dockerfile              # Contenedor Node.js 20 Alpine multi-stage
│   ├── .dockerignore
│   ├── src/
│   │   ├── database.ts         # Conexión PostgreSQL/PostGIS + motor relacional fallback
│   │   ├── eventsData.ts       # Dataset de 126 eventos estructurados
│   │   └── server.ts           # API Express (endpoints /api/search, /api/health, etc.)
│   ├── package.json
│   └── tsconfig.json
└── DondeE - FE/
    ├── Dockerfile              # Contenedor Nginx Alpine multi-stage
    ├── nginx.conf              # Reverse proxy Nginx para /api/ y assets SPA
    ├── .dockerignore
    ├── src/
    │   ├── api.ts              # Cliente API para consumo de endpoints del backend
    │   ├── screens/
    │   │   └── MapScreen.tsx   # Mapa Leaflet, buscador multi-entidad y ventana inferior
    │   ├── components/         # Modales de reserva, pasarela checkout, reseñas y GPS
    │   ├── data/               # Catálogos mock estructurados (locales, eventos, clientes)
    │   └── types/              # Tipos TypeScript para venues, eventos y reservas
    ├── package.json
    └── vite.config.ts          # Configuración de Vite con proxy hacia puerto 3001
```

---

## 👥 Equipo de Desarrollo

Proyecto desarrollado para la asignatura **ICI 324 - Bases de Datos y Programación Web**:
- **Martín Araya**
- **Jorge Bahamondes**
- **Bruno Díaz**

*Universidad Técnica Federico Santa María / Escuela de Ingeniería Informática — 2026.*
