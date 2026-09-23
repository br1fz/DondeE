# DondeE Backend

API REST de DondeE conectada a PostgreSQL y PostGIS.

## Configuración

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Completa `PGPASSWORD` en `.env`. La API queda disponible en `http://localhost:3001`.

## Endpoints principales

- `GET /api/health`
- `GET /api/venues?lat=-33.044&lng=-71.624&radiusKm=4`
- `GET /api/events`
- `GET /api/users`
- `GET /api/reviews?venueId=1`
- `POST /api/reviews`
- `GET /api/reservations?userId=1`
- `POST /api/reservations`
