# Plan de Próximas APIs y Consultas de Álgebra Relacional 🗄️📐
**Proyecto:** DondeE — Plataforma Geo-Social de Vida Nocturna  
**Asignatura:** ICI 324 - Bases de Datos y Programación Web (2026)  
**Grupo 2:** Martín Araya, Jorge Bahamondes, Bruno Díaz  

---

## 🎯 Objetivo Académico

En el marco de la asignatura **ICI 324**, esta entrega pone énfasis en la construcción de una **Base de Datos relacional y espacial plenamente funcional**, demostrando solvencia tanto en la implementación del motor (PostgreSQL / PostGIS) como en la formulación de consultas formales en **Álgebra Relacional clásica y extendida**:

- **Selección ($\sigma$)** y **Proyección ($\pi$)**
- **Reunión Natural y Theta-Join ($\bowtie, \bowtie_{\theta}$)**
- **Agrupación y Funciones de Agregación ($\gamma$)** con cláusulas `GROUP BY` y `HAVING`
- **Operaciones de Teoría de Conjuntos ($\cup, \cap, -$ / `UNION`, `INTERSECT`, `EXCEPT`)**
- **Predicados Geoespaciales PostGIS** (`ST_DWithin`, `ST_Distance`, elipsoide WGS84)

A continuación se detalla el catálogo de **6 APIs estratégicas recomendadas** para incorporar en el backend, con su álgebra relacional, código SQL y su impacto en la aplicación web.

---

## 1. API de Analítica Territorial y Ocupación por Sector

### 📋 Ficha Técnica
* **Endpoint:** `GET /api/analytics/sectors-summary`
* **Método HTTP:** `GET`
* **Parámetros:** Ninguno (opcionalmente `?ciudad=Valparaíso`)
* **Propósito en la Web:** Alimenta un panel de analítica municipal o *"Termómetro de la Bohemia"*, mostrando la concentración de aforo y precio promedio por barrio nocturno.

### 📐 Álgebra Relacional Formal
$$\gamma_{\text{ciudad}, \text{sector}, \text{COUNT}(id\_recinto) \to total\_locales, \text{SUM}(aforo\_total) \to cap\_total, \text{SUM}(aforo\_disponible) \to cupos\_disp, \text{AVG}(rating) \to prom\_rating, \text{MIN}(precio\_entrada) \to precio\_min}(\text{Recinto} \leftouterjoin_{Recinto.id\_recinto = Evento.id\_recinto} \text{Evento})$$

### 💻 Consulta SQL (PostgreSQL)
```sql
SELECT 
    r.ciudad,
    r.sector,
    COUNT(DISTINCT r.id_recinto) AS total_locales,
    SUM(r.aforo_total) AS capacidad_sector,
    SUM(r.aforo_disponible) AS cupos_disponibles,
    ROUND(AVG(r.rating)::numeric, 2) AS rating_promedio,
    COALESCE(MIN(e.precio_entrada), 0) AS precio_desde
FROM recinto r
LEFT JOIN evento e ON r.id_recinto = e.id_recinto
GROUP BY r.ciudad, r.sector
ORDER BY r.ciudad, total_locales DESC;
```

---

## 2. API de Ranking / Top Locales con Filtro Post-Agregación (`HAVING`)

### 📋 Ficha Técnica
* **Endpoint:** `GET /api/venues/top-rated`
* **Método HTTP:** `GET`
* **Parámetros Query:** `?minReviews=3&limit=5`
* **Propósito en la Web:** Despliega la sección *"Los 5 Favoritos de la Noche"* basada en el promedio de reseñas reales dejadas por la comunidad.

### 📐 Álgebra Relacional Formal
$$\pi_{id\_recinto, nombre\_local, ciudad, tipo, prom\_calif, cant\_resenas}(\sigma_{cant\_resenas \ge 3}(\gamma_{id\_recinto, nombre\_local, ciudad, tipo, \text{AVG}(calificacion) \to prom\_calif, \text{COUNT}(id\_resena) \to cant\_resenas}(\text{Recinto} \bowtie \text{Reseña})))$$

### 💻 Consulta SQL (PostgreSQL)
```sql
SELECT 
    r.id_recinto,
    r.nombre_local,
    r.ciudad,
    r.tipo,
    COUNT(res.id_resena) AS cantidad_resenas,
    ROUND(AVG(res.calificacion)::numeric, 1) AS promedio_real
FROM recinto r
INNER JOIN resena res ON r.id_recinto = res.id_recinto
GROUP BY r.id_recinto, r.nombre_local, r.ciudad, r.tipo
HAVING COUNT(res.id_resena) >= 3
ORDER BY promedio_real DESC, cantidad_resenas DESC
LIMIT 5;
```

---

## 3. API Geoespacial Nativa PostGIS (Vecinos Cercanos y Radio Geodésico)

### 📋 Ficha Técnica
* **Endpoint:** `GET /api/venues/nearby`
* **Método HTTP:** `GET`
* **Parámetros Query:** `?lat=-33.044&lng=-71.624&radiusMeters=1500`
* **Propósito en la Web:** Responde a la pregunta *"¿Qué locales tengo a distancia caminable ahora mismo?"*, calculando la distancia euclidiana esférica real en el motor espacial de PostgreSQL en vez de computarlo en JavaScript.

### 📐 Álgebra Relacional Formal
$$\pi_{id\_recinto, nombre\_local, direccion, tipo, lat, lng, distancia\_metros}(\sigma_{ST\_DWithin(ubicacion\_geom::geography, ST\_SetSRID(ST\_MakePoint(lng, lat), 4326)::geography, radio)}(\text{Recinto}))$$

### 💻 Consulta SQL (PostGIS 3.4 / SRID 4326)
```sql
SELECT 
    r.id_recinto,
    r.nombre_local,
    r.direccion,
    r.tipo,
    r.lat,
    r.lng,
    ROUND(ST_Distance(r.ubicacion_geom::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography)) AS distancia_metros
FROM recinto r
WHERE ST_DWithin(r.ubicacion_geom::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
ORDER BY distancia_metros ASC;
```

---

## 4. API de Detección de Asistencia Interurbana (Operación de Intersección)

### 📋 Ficha Técnica
* **Endpoint:** `GET /api/analytics/cross-city-clients`
* **Método HTTP:** `GET`
* **Propósito en la Web:** Métrica para promotores y administradores que identifica clientes interurbanos ("bohemia cruzada") que se movilizan entre Valparaíso y Viña del Mar.

### 📐 Álgebra Relacional Formal
$$(\pi_{id\_usuario, nombre}(\sigma_{ciudad='Valparaíso'}(\text{Usuario} \bowtie \text{Reserva} \bowtie \text{Evento} \bowtie \text{Recinto}))) \;\cap\; (\pi_{id\_usuario, nombre}(\sigma_{ciudad='Viña del Mar'}(\text{Usuario} \bowtie \text{Reserva} \bowtie \text{Evento} \bowtie \text{Recinto})))$$

### 💻 Consulta SQL (PostgreSQL con `INTERSECT`)
```sql
-- Clientes que han reservado en locales de Valparaíso INTERSECT Clientes que han reservado en Viña
(
    SELECT DISTINCT u.id_usuario, u.nombre, u.email
    FROM usuario u
    INNER JOIN reserva res ON u.id_usuario = res.id_usuario
    INNER JOIN evento e ON res.id_evento = e.id_evento
    INNER JOIN recinto r ON e.id_recinto = r.id_recinto
    WHERE r.ciudad = 'Valparaíso'
)
INTERSECT
(
    SELECT DISTINCT u.id_usuario, u.nombre, u.email
    FROM usuario u
    INNER JOIN reserva res ON u.id_usuario = res.id_usuario
    INNER JOIN evento e ON res.id_evento = e.id_evento
    INNER JOIN recinto r ON e.id_recinto = r.id_recinto
    WHERE r.ciudad = 'Viña del Mar'
);
```

---

## 5. API de Alerta de Aforo Crítico / Eventos por Agotarse

### 📋 Ficha Técnica
* **Endpoint:** `GET /api/events/almost-sold-out`
* **Método HTTP:** `GET`
* **Propósito en la Web:** Despliega alertas tipo FOMO (*"Últimos 15% de cupos disponibles"*) en la pantalla de inicio y mapa nocturno.

### 📐 Álgebra Relacional Formal
$$\pi_{id\_evento, titulo, nombre\_local, aforo\_disponible, aforo\_total, pct\_disp, precio}(\sigma_{aforo\_disponible > 0 \;\land\; (aforo\_disponible / aforo\_total) \le 0.20}(\text{Evento} \bowtie \text{Recinto}))$$

### 💻 Consulta SQL (PostgreSQL con cálculo dinámico)
```sql
SELECT 
    e.id_evento,
    e.titulo,
    r.nombre_local,
    r.ciudad,
    e.aforo_disponible,
    e.aforo_total,
    ROUND((e.aforo_disponible::numeric / e.aforo_total::numeric) * 100, 1) AS porcentaje_disponible,
    e.fecha_hora,
    e.precio_entrada
FROM evento e
INNER JOIN recinto r ON e.id_recinto = r.id_recinto
WHERE e.aforo_disponible > 0 
  AND (e.aforo_disponible::numeric / e.aforo_total::numeric) <= 0.20
ORDER BY porcentaje_disponible ASC;
```

---

## 6. API de Resumen Financiero y Fidelización por Cliente (Join Cuádruple)

### 📋 Ficha Técnica
* **Endpoint:** `GET /api/users/:id/metrics`
* **Método HTTP:** `GET`
* **Parámetros URL:** `:id` (ID del usuario activo)
* **Propósito en la Web:** Se integra en el cajón lateral (*Client Drawer*) para mostrar el gasto acumulado, total de entradas compradas y eventos asistidos.

### 📐 Álgebra Relacional Formal
$$\gamma_{id\_usuario, nombre, \text{COUNT}(id\_reserva) \to total\_reservas, \text{SUM}(total\_pagado) \to gasto\_acumulado, \text{SUM}(cantidad\_entradas) \to tickets\_totales}(\text{Usuario} \leftouterjoin (\sigma_{estado\_pago = 'PAGADO'}(\text{Reserva})))$$

### 💻 Consulta SQL (PostgreSQL)
```sql
SELECT 
    u.id_usuario,
    u.nombre,
    COUNT(res.id_reserva) AS total_reservas,
    COALESCE(SUM(res.total_pagado), 0) AS gasto_acumulado_clp,
    COALESCE(SUM(res.cantidad_entradas), 0) AS tickets_totales
FROM usuario u
LEFT JOIN reserva res ON u.id_usuario = res.id_usuario AND res.estado_pago = 'PAGADO'
WHERE u.id_usuario = $1
GROUP BY u.id_usuario, u.nombre;
```

---

## 📊 Matriz Resumen para Presentación e Informe ICI 324

| Endpoint | Operador Álgebra Relacional | Cláusulas SQL Destacadas | Componente Frontend Asociado |
| :--- | :--- | :--- | :--- |
| **`GET /api/search?q=...`** | $\sigma_{\text{ILIKE}} \land \pi$ | Búsqueda Relacional Multi-Entidad | Barra de búsqueda y Bottom Sheet |
| **`GET /api/analytics/sectors-summary`** | $\gamma_{\text{COUNT, SUM, AVG}}(\bowtie)$ | `GROUP BY`, `COUNT(DISTINCT)`, `SUM` | Modal de Estadísticas Territoriales |
| **`GET /api/venues/top-rated`** | $\sigma_{\text{COUNT}\ge N}(\gamma(\bowtie))$ | `HAVING COUNT(*) >= 3`, `ORDER BY` | Ranking Top 5 Locales Populares |
| **`GET /api/venues/nearby`** | $\sigma_{\text{ST\_DWithin}}$ | Índices `GiST`, `ST_DistanceSphere` | Radar de proximidad GPS (PostGIS) |
| **`GET /api/analytics/cross-city-clients`** | $\pi(\dots) \cap \pi(\dots)$ | Operación de Conjuntos `INTERSECT` | Métrica de público interurbano |
| **`GET /api/events/almost-sold-out`** | $\sigma_{\text{ratio} \le 0.20}(\bowtie)$ | Filtro condicional por porcentaje | Insignias de aforo crítico en vivo |
| **`GET /api/users/:id/metrics`** | $\gamma(\text{Usuario} \leftouterjoin \text{Reserva})$ | `LEFT JOIN`, `COALESCE(SUM())` | Billetera y Perfil del Cliente |
