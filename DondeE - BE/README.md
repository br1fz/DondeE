# DondeE - Backend (BE)

API RESTful y motor NoSQL orientado a documentos para **DondeE**, plataforma geo-social de vida nocturna. Desarrollada con **Node.js v20+, Express 5, TypeScript y MongoDB Atlas Cluster (con motor NoSQL GeoJSON hibrido)**.

---

## Caracteristicas Principales

1. **Busqueda Multi-Entidad en Tiempo Real (`/api/search`)**:
   - Busqueda simultanea sobre **localidades/sectores**, **eventos nocturnos** y **locales comerciales** (clubs, pubs, bares).
   - Soporte para filtros por nombre, direccion, genero musical, ciudad, artistas y productoras.
2. **Motor NoSQL Documental y Soporte GeoJSON (`2dsphere`)**:
   - Conexion nativa con MongoDB Atlas Cluster (`dondee_db`) para almacenamiento de documentos JSON desnormalizados y embebidos.
   - Busquedas geoespaciales por cercania (`/api/venues/near`) mediante coordenadas GeoJSON de formato `Point [longitud, latitud]`.
3. **Resiliencia y Modo Hibrido sin Caidas**:
   - Si MongoDB Atlas se encuentra offline o bajo restricciones de red locales, el backend conmuta de forma transparente al motor documental en memoria alimentado por los datasets canonicos en `DondeE - BD/nosql/`.
4. **Control de Aforo y Reservas Transaccionales**:
   - Endpoints para verificacion de aforo en vivo (`aforo_disponible`) y registro atomico de transacciones de reserva con decremento de cupos.
5. **Pipelines de Agregacion (MQL) para Metricas de Rubrica**:
   - Endpoints analiticos que implementan agrupaciones (`$group`), clasificaciones posagregacion (`$match` sobre promedios), alertas matematicas de stock critico (`$expr`) e identificacion de usuarios inactivos (`$lookup`).

---

## Catalogo de Endpoints de la API

| Metodo | Endpoint | Descripcion | Parametros / Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Estado del backend, salud de la conexion y estadisticas | Ninguno |
| `GET` | `/api/search` | Busqueda multi-entidad (sectores, eventos, locales) | `?q=texto` (ej: `?q=Renaca` o `?q=Techno`) |
| `GET` | `/api/venues` | Listado completo de los 42 locales de Valparaiso y Vina | Ninguno |
| `GET` | `/api/venues/near` | Busqueda geoespacial NoSQL por radio de proximidad | `?lng=-71.62&lat=-33.04&maxDistance=3000` |
| `GET` | `/api/events` | Listado completo de los 126 eventos nocturnos | Ninguno |
| `GET` | `/api/users` | Listado de usuarios (sin hashes de contrasennas) | Ninguno |
| `GET` | `/api/reviews` | Listado de resennas por recinto o globales | `?venueId=1` |
| `POST` | `/api/reviews` | Registro de nueva resenna social con calificacion | `{ rating, comment, userId, venueId, userName }` |
| `POST` | `/api/reservations` | Registro transaccional de reserva de entradas | `{ userId, eventId, quantity, totalPaid, userName }` |
| `GET` | `/api/analytics/venues-summary` | Resumen por recinto (eventos, aforo total, precio medio) | Ninguno |
| `GET` | `/api/venues/top-rated` | Ranking de los 5 locales mejor evaluados | Ninguno |
| `GET` | `/api/events/almost-sold-out` | Alerta de eventos con aforo critico (<= 20% disponible) | Ninguno |
| `GET` | `/api/users/inactive` | Usuarios registrados sin compras de entradas | Ninguno |
| `GET` | `/api/nosql/collections` | Metricas cuantitativas de documentos por coleccion NoSQL | Ninguno |

Para la documentacion completa con ejemplos detallados de peticiones y respuestas JSON, consultar:  
[Documentacion Oficial de la API REST](../Documentos/Documentacion_API_REST.md)

---

## Instalacion y Ejecucion

```bash
# 1. Navegar a la carpeta backend
cd "DondeE - BE"

# 2. Instalar dependencias
npm install

# 3. Exportar datasets canonicos NoSQL a JSON (opcional)
npm run export-json

# 4. Poblar cluster MongoDB Atlas con esquemas e indices (opcional)
npm run seed

# 5. Compilar TypeScript
npm run build

# 6. Iniciar el servidor
npm start
```

El servidor quedara disponible en **`http://localhost:3001`**.

---

## Verificacion Rapida

Comprobar el funcionamiento del backend ejecutando:

```bash
# Comprobar salud y conexion NoSQL
curl http://localhost:3001/api/health

# Comprobar busqueda multi-entidad
curl "http://localhost:3001/api/search?q=Alegre"

# Comprobar busqueda geoespacial por radio
curl "http://localhost:3001/api/venues/near?lng=-71.6245&lat=-33.0425&maxDistance=1500"

# Comprobar analitica de agrupacion NoSQL
curl http://localhost:3001/api/analytics/venues-summary
```
