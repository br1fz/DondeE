# Proyecto: DondeE 🪩📍

**DondeE** es una plataforma web full-stack con enfoque geo-social diseñada para dinamizar la economía nocturna formal. Permite a los usuarios descubrir locales, bares y eventos nocturnos cercanos en tiempo real mediante geolocalización, además de gestionar la reserva de cupos y visualizar el ambiente del lugar a través de comentarios de la comunidad.

---

## 📖 Contexto Académico
- **Asignatura:** ICI 324 - Bases de Datos y Programación Web
- **Carrera:** Ingeniería Civil Informática
- **Grupo:** 2
- **Integrantes:** 
  - Martín Araya Riquelme
  - Jorge Bahamondes Amador
  - Bruno Díaz Fernández
- **Fecha:** Segundo semestre del 2026

---

## 🚀 Características Principales

1. **Búsqueda Geo-Espacial de Eventos:** Filtros obligatorios (GPS y radio de búsqueda) y opcionales (precio, categoría) para encontrar locales verificados en un mapa interactivo.
2. **Gestión de Reservas y Aforo:** Sistema transaccional que permite a los usuarios reservar su entrada, descontando automáticamente el cupo del aforo del local para evitar sobreventa.
3. **Panel de Administración para Locales:** Módulo CRUD donde los dueños de locales verificados pueden crear eventos, modificar especificaciones y gestionar su perfil.
4. **Gestión de Perfil y Reseñas:** Módulo CRUD para que los asistentes administren sus datos, revisen su historial y publiquen reseñas.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React, TypeScript, HTML5/CSS3 (Integración de mapas con Leaflet).
* **Backend:** Python (FastAPI/Flask) o Node.js (Express).
* **Base de Datos:** Motor SQL (PostgreSQL / MySQL).
* **Control de Versiones:** Git & GitHub.

---

## ⚙️ Requisitos Previos

Asegúrate de tener instalado el siguiente software en tu entorno local antes de comenzar:
- [Node.js](https://nodejs.org/) (v16 o superior) para el frontend.
- Python 3.10+ o Node.js (dependiendo de tu entorno de backend).
- Motor de Base de Datos SQL (MySQL o PostgreSQL) ejecutándose localmente.
- [Git](https://git-scm.com/).

---

## 💻 Instalación y Configuración Local (Paso a Paso)

Sigue estas instrucciones para levantar el proyecto sin problemas en tu máquina local.

### 1. Clonar el repositorio
Abre tu terminal y descarga el proyecto:
```bash
git clone [https://github.com/tu-usuario/DondeE.git](https://github.com/tu-usuario/DondeE.git)
cd DondeE