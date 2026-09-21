# Proyecto: DondeE 🪩📍
**DondeE** es una plataforma web full-stack con enfoque geo-social diseñada para dinamizar la economía nocturna formal. Permite a los usuarios descubrir locales, bares y eventos nocturnos cercanos en tiempo real mediante geolocalización (PostGIS), además de gestionar la reserva de cupos y visualizar el ambiente del lugar a través de comentarios.

## 📖 Contexto Académico
- **Asignatura:** ICI 324 - Bases de Datos y Programación Web
- **Grupo:** 2 (Martín Araya, Jorge Bahamondes, Bruno Díaz)
- **Fecha:** Segundo semestre del 2026

## 🚀 Características Principales
1. **Búsqueda Geo-Espacial:** Filtros obligatorios (GPS y radio) para encontrar locales verificados.
2. **Gestión Transaccional de Aforo:** Reserva de entradas descontando cupos en tiempo real para evitar sobreventa.
3. **Módulos CRUD:** Mantenedores para perfiles de Locales (Host Comercial) y cuentas de Usuarios Asistentes.

## 🛠️ Stack Tecnológico
* **Frontend:** React, TypeScript, Leaflet.
* **Backend:** Node.js / Express (o framework equivalente).
* **Base de Datos:** PostgreSQL con extensión PostGIS.

## 💻 Instalación y Demostración en Vivo
1. Clonar repositorio: `git clone https://github.com/br1fz/DondeE.git`
2. Crear BD `dondee_db` e importar el esquema maestro y el set de datos mockup de Valparaíso y Viña del Mar:
   ```bash
   psql -d dondee_db -f "DondeE - BD/database/init.sql"
   psql -d dondee_db -f "DondeE - BD/database/07_mock_valparaiso_vina.sql"
   ```
3. Ejecutar el Frontend interactivo (MockUp UI Figma integrado):
   ```bash
   cd "DondeE - FE"
   npm install
   npm run dev
   ```
4. Abrir en el navegador (`http://localhost:5173`) para interactuar con la búsqueda geoespacial (Valparaíso y Viña del Mar), reserva transaccional de aforo en tiempo real con QR y comentarios sociales.

