# Plan de Consultas SQL y Álgebra Relacional 🗄️📐
**Proyecto:** DondeE — Plataforma Geo-Social de Vida Nocturna  
**Asignatura:** ICI 324 - Bases de Datos y Programación Web (2026)  

---

## 🎯 Objetivo Académico

Catálogo de las **10 Consultas Obligatorias** integradas en el sistema para cumplir con la Rúbrica de Evaluación (Nivel Logrado). Estas consultas operan sobre el esquema DDL exacto del proyecto (ver `06_consultas.sql`) y demuestran el uso de operadores avanzados.

---

### 1. Selección Básica (Filtro Múltiple)
**Descripción:** Eventos con precio de entrada mayor a $10.000 y que aún tengan aforo disponible.
**Álgebra Relacional:**
$$\pi_{titulo, fecha\_hora, precio\_entrada}(\sigma_{precio\_entrada > 10000 \land aforo\_disponible > 0}(\text{Evento}))$$
```sql
SELECT titulo, fecha_hora, precio_entrada
FROM evento
WHERE precio_entrada > 10000 AND aforo_disponible > 0;
```

### 2. JOIN de 2 Tablas
**Descripción:** Locales y eventos asociados, pero solo para aquellos recintos cuyo estado de validación esté aprobado.
**Álgebra Relacional:**
$$\pi_{nombre\_local, titulo}(\sigma_{estado\_validacion = 'APROBADO'}(\text{Recinto}) \bowtie \text{Evento})$$
```sql
SELECT r.nombre_local, e.titulo
FROM recinto r
INNER JOIN evento e ON r.id_recinto = e.id_recinto
WHERE r.estado_validacion = 'APROBADO';
```

### 3. JOIN de 3 Tablas (Reservas Pagadas)
**Descripción:** Listado de usuarios, el evento al que asistirán y la cantidad de entradas, filtrando solo las reservas con pago completado.
**Álgebra Relacional:**
$$\pi_{nombre, titulo, cantidad\_entradas}(\text{Usuario} \bowtie \sigma_{estado\_pago = 'PAGADO'}(\text{Reserva}) \bowtie \text{Evento})$$
```sql
SELECT u.nombre, e.titulo, r.cantidad_entradas
FROM usuario u
INNER JOIN reserva r ON u.id_usuario = r.id_usuario
INNER JOIN evento e ON r.id_evento = e.id_evento
WHERE r.estado_pago = 'PAGADO';
```

### 4. Agrupación y Funciones de Agregación (`GROUP BY`)
**Descripción:** Resumen por recinto indicando cuántos eventos tiene, la capacidad total de los mismos y el precio promedio de las entradas.
**Álgebra Relacional:**
$$\gamma_{id\_recinto, nombre\_local, \text{COUNT}(id\_evento) \to total, \text{SUM}(aforo\_total) \to cap, \text{AVG}(precio\_entrada) \to prom}(\text{Recinto} \leftouterjoin \text{Evento})$$
```sql
SELECT r.id_recinto, r.nombre_local, COUNT(e.id_evento) AS total_eventos, COALESCE(SUM(e.aforo_total), 0) AS capacidad_total_eventos, ROUND(COALESCE(AVG(e.precio_entrada), 0), 2) AS precio_promedio
FROM recinto r
LEFT JOIN evento e ON r.id_recinto = e.id_recinto
GROUP BY r.id_recinto, r.nombre_local
ORDER BY total_eventos DESC;
```

### 5. Ranking con Filtro Post-Agregación (`HAVING`)
**Descripción:** Locales que poseen al menos 1 reseña, ordenados por su calificación promedio para destacar los favoritos del público.
**Álgebra Relacional:**
$$\pi_{nombre\_local, resenas, prom}(\sigma_{resenas \ge 1}(\gamma_{id\_recinto, nombre\_local, \text{COUNT}(id\_resena) \to resenas, \text{AVG}(calificacion) \to prom}(\text{Recinto} \bowtie \text{Reseña})))$$
```sql
SELECT r.nombre_local, COUNT(res.id_resena) AS cantidad_resenas, ROUND(AVG(res.calificacion), 1) AS promedio_real
FROM recinto r
INNER JOIN resena res ON r.id_recinto = res.id_recinto
GROUP BY r.id_recinto, r.nombre_local
HAVING COUNT(res.id_resena) >= 1
ORDER BY promedio_real DESC, cantidad_resenas DESC
LIMIT 5;
```

### 6. Búsqueda Geoespacial (`PostGIS`)
**Descripción:** Calcula la distancia real en metros desde un punto fijo y filtra recintos en un radio caminable de 1.5 kilómetros.
**Álgebra Relacional:**
$$\pi_{nombre\_local, direccion, lng, lat, ROUND(ST\_Distance(ubicacion\_geom::geography, ST\_SetSRID(ST\_MakePoint(-71.624, -33.044), 4326)::geography)) \to distancia\_metros}(\sigma_{ST\_DWithin(ubicacion\_geom::geography, ST\_SetSRID(ST\_MakePoint(-71.624, -33.044), 4326)::geography, 1500)}(\text{Recinto}))$$
```sql
SELECT r.nombre_local, r.direccion, ST_X(r.ubicacion_geom) AS lng, ST_Y(r.ubicacion_geom) AS lat, ROUND(ST_Distance(r.ubicacion_geom::geography, ST_SetSRID(ST_MakePoint(-71.624, -33.044), 4326)::geography)) AS distancia_metros
FROM recinto r
WHERE ST_DWithin(r.ubicacion_geom::geography, ST_SetSRID(ST_MakePoint(-71.624, -33.044), 4326)::geography, 1500)
ORDER BY distancia_metros ASC;
```

### 7. Teoría de Conjuntos (`INTERSECT`)
**Descripción:** Intersección para encontrar usuarios muy involucrados: tienen reservas pagadas Y además han dejado alguna reseña en la plataforma.
**Álgebra Relacional:**
$$(\pi_{id\_usuario, nombre, email}(\text{Usuario} \bowtie \sigma_{estado\_pago='PAGADO'}(\text{Reserva}))) \;\cap\; (\pi_{id\_usuario, nombre, email}(\text{Usuario} \bowtie \text{Reseña}))$$
```sql
SELECT u.id_usuario, u.nombre, u.email
FROM usuario u
INNER JOIN reserva r ON u.id_usuario = r.id_usuario
WHERE r.estado_pago = 'PAGADO'
INTERSECT
SELECT u.id_usuario, u.nombre, u.email
FROM usuario u
INNER JOIN resena res ON u.id_usuario = res.id_usuario;
```

### 8. Operación Matemática en Predicado (`WHERE`)
**Descripción:** Alerta de "Casi Agotado" (FOMO) detectando eventos donde la razón de aforo disponible respecto al aforo total es igual o inferior al 20%.
**Álgebra Relacional:**
$$\pi_{id\_evento, titulo, nombre\_local, disp, total, pct}(\sigma_{disp > 0 \land (disp / total) \le 0.20}(\text{Evento} \bowtie \text{Recinto}))$$
```sql
SELECT e.id_evento, e.titulo, r.nombre_local, e.aforo_disponible, e.aforo_total, ROUND((e.aforo_disponible::numeric / e.aforo_total::numeric) * 100, 1) AS porcentaje_disponible
FROM evento e
INNER JOIN recinto r ON e.id_recinto = r.id_recinto
WHERE e.aforo_disponible > 0 AND (e.aforo_disponible::numeric / e.aforo_total::numeric) <= 0.20
ORDER BY porcentaje_disponible ASC;
```

### 9. Filtro Temporal Dinámico (`CURRENT_TIMESTAMP`)
**Descripción:** Cartelera de próximos eventos. Omite fiestas pasadas comparando la fecha de la base de datos contra el reloj del sistema.
**Álgebra Relacional:**
$$\pi_{titulo, nombre\_local, fecha\_hora}(\sigma_{fecha\_hora \ge CURRENT\_TIMESTAMP}(\text{Evento} \bowtie \text{Recinto}))$$
```sql
SELECT e.titulo, r.nombre_local, e.fecha_hora
FROM evento e
INNER JOIN recinto r ON e.id_recinto = r.id_recinto
WHERE e.fecha_hora >= CURRENT_TIMESTAMP
ORDER BY e.fecha_hora ASC;
```

### 10. Teoría de Conjuntos (`EXCEPT`)
**Descripción:** Lista de usuarios inactivos que se registraron en la aplicación pero a los cuales no se les registra ninguna reserva pagada exitosamente.
**Álgebra Relacional:**
$$\pi_{id\_usuario, nombre, email}(\text{Usuario}) \;-\; \pi_{id\_usuario, nombre, email}(\text{Usuario} \bowtie \sigma_{estado\_pago='PAGADO'}(\text{Reserva}))$$
```sql
SELECT id_usuario, nombre, email
FROM usuario
EXCEPT
SELECT u.id_usuario, u.nombre, u.email
FROM usuario u
INNER JOIN reserva res ON u.id_usuario = res.id_usuario
WHERE res.estado_pago = 'PAGADO';
```
