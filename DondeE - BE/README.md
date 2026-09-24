# DondeE - Backend (BE) 🗄️⚡

API RESTful y motor relacional/espacial para **DondeE**, plataforma geo-social de vida nocturna. Desarrollada con **Node.js, Express 5, TypeScript y PostgreSQL con extensión PostGIS**.

---

## 🚀 Características Principales

1. **Búsqueda Multi-Entidad en Tiempo Real (`/api/search`)**:
   - Búsqueda simultánea sobre **localidades/sectores**, **eventos nocturnos** y **locales comerciales** (clubs, pubs, bares).
   - Soporte para filtros por nombre, dirección, género musical, ciudad, artistas y productoras.
2. **Conexión Dual PostgreSQL / Motor Relacional Autónomo**:
   - Conexión nativa mediante pool `pg` a PostgreSQL con funciones espaciales PostGIS (SRID 4326).
   - **Failover automático**: Si el servicio local de PostgreSQL no está activo, el backend conmuta instantáneamente a su motor relacional en memoria sin interrumpir las consultas ni requerir configuración manual.
3. **Control de Aforo y Reservas**:
   - Endpoints para verificación de aforo en vivo (`aforo_disponible`) y registro de transacciones de reserva.
4. **Reseñas y Calificaciones**:
   - Endpoint para consulta y creación de reseñas con puntuación de 1 a 5 estrellas.

---

## 🛠️ Endpoints de la API

| Método | Endpoint | Descripción | Parámetros / Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Estado del servicio y de la conexión a la base de datos | Ninguno |
| `GET` | `/api/search` | Búsqueda multi-entidad (sectores, eventos, locales) | `?q=texto` (ej: `?q=Reñaca` o `?q=Techno`) |
| `GET` | `/api/venues` | Listado completo de los 42 locales de Valparaíso y Viña | Ninguno |
| `GET` | `/api/events` | Listado completo de los 126 eventos nocturnos | Ninguno |
| `GET` | `/api/users` | Listado de usuarios del sistema | Ninguno |
| `GET` | `/api/reviews` | Listado de reseñas por recinto | `?venueId=1` |
| `POST` | `/api/reviews` | Registro de nueva reseña social | `{ rating, comment, userId, venueId }` |
| `POST` | `/api/reservations` | Registro de reserva de entradas | `{ userId, eventId, quantity, totalPaid }` |

---

## 💻 Instalación y Ejecución

```bash
# 1. Navegar a la carpeta backend
cd "DondeE - BE"

# 2. Instalar dependencias
npm install

# 3. Compilar TypeScript
npm run build

# 4. Iniciar el servidor
npm start
```

El servidor quedará disponible en **`http://localhost:3001`**.

---

## 🧪 Verificación Rápida

Puedes comprobar que el backend está respondiendo ejecutando:

```bash
# Comprobar salud y conexión de BD
curl http://localhost:3001/api/health

# Comprobar búsqueda de localidad
curl "http://localhost:3001/api/search?q=Cerro%20Alegre"

# Comprobar búsqueda de evento
curl "http://localhost:3001/api/search?q=Techno"
```
