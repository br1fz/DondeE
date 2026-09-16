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

## 💻 Instalación
1. Clonar: `git clone https://github.com/br1fz/DondeE.git`
2. Crear BD `dondee_db` e importar el esquema SQL desde la carpeta `DondeE - BD/`.
3. Instalar dependencias en frontend y backend (`npm install`).
4. Configurar variables de entorno `.env` y ejecutar servidores.
