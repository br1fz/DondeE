-- =============================================================================
-- PROYECTO: DondeE - Plataforma Geo-Social Nocturna
-- ARCHIVO: 06_consultas.sql
-- DESCRIPCIÓN: Set de 13 Consultas CRUD Obligatorias y Álgebra Relacional (Etapa 1)
-- MOTOR: PostgreSQL 14+ con extensión PostGIS
-- =============================================================================

-- =============================================================================
-- SECCIÓN 1: CONSULTAS DE INSERCIÓN (INSERT) [3 sentencias]
-- =============================================================================

-- 1.1 INSERT en USUARIO: Registro de un usuario con rol de Administrador ('ADMIN')
INSERT INTO usuario (nombre, email, password_hash, rol)
VALUES (
    'Administrador General DondeE',
    'admin@dondee.cl',
    '$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I',
    'ADMIN'
);

-- 1.2 INSERT en RECINTO: Registro de un local con geolocalización PostGIS (SRID 4326)
-- Nota: ST_MakePoint recibe (longitud, latitud) -> (-71.6245, -33.0472 en Valparaíso)
INSERT INTO recinto (nombre_local, direccion, ubicacion_geom, patente_municipal, estado_validacion, id_host)
VALUES (
    'Club Terraza Subterránea',
    'Av. Errázuriz 1234, Valparaíso',
    ST_SetSRID(ST_MakePoint(-71.6245, -33.0472), 4326),
    'PAT-VALP-2026-089',
    'PENDIENTE',
    1
);

-- 1.3 INSERT en EVENTO: Creación de un evento asociado al recinto recién registrado
INSERT INTO evento (titulo, descripcion, fecha_hora, precio_entrada, categoria_musical, aforo_total, aforo_disponible, id_recinto)
VALUES (
    'Noche de Synthwave & Indie',
    'Lanzamiento exclusivo con bandas emergentes y sesión de sintetizadores en vivo.',
    '2026-11-15 21:00:00',
    12500.00,
    'Indie / Electrónica',
    200,
    200,
    1
);


-- =============================================================================
-- SECCIÓN 2: CONSULTAS DE MODIFICACIÓN (UPDATE) [2 sentencias]
-- =============================================================================

-- 2.1 UPDATE en RECINTO: Cambiar el estado de validación a 'APROBADO' filtrando por ID
UPDATE recinto
SET estado_validacion = 'APROBADO'
WHERE id_recinto = 1;

-- 2.2 UPDATE en EVENTO: Descontar 2 cupos de aforo disponible filtrando por ID de evento
UPDATE evento
SET aforo_disponible = aforo_disponible - 2
WHERE id_evento = 1;


-- =============================================================================
-- SECCIÓN 3: CONSULTAS DE ELIMINACIÓN (DELETE) [2 sentencias]
-- =============================================================================

-- 3.1 DELETE en RESEÑA: Eliminar valoraciones deficientes con calificación menor o igual a 2
DELETE FROM resena
WHERE calificacion <= 2;

-- 3.2 DELETE en RESERVA: Depurar reservas que fueron canceladas
DELETE FROM reserva
WHERE estado_pago = 'CANCELADO';


-- =============================================================================
-- SECCIÓN 4: CONSULTAS DE ESTRUCTURA (ALTER TABLE) [2 sentencias]
-- =============================================================================

-- 4.1 ALTER TABLE en USUARIO: Agregar columna opcional 'telefono'
ALTER TABLE usuario
ADD COLUMN telefono VARCHAR(15) NULL;

-- 4.2 ALTER TABLE en RESEÑA: Agregar restricción CHECK para evitar comentarios vacíos
-- Asegura que si se ingresa un comentario, este posea contenido no trivial (longitud > 0 sin solo espacios)
ALTER TABLE resena
ADD CONSTRAINT chk_resena_comentario_no_vacio 
CHECK (comentario IS NULL OR LENGTH(TRIM(comentario)) > 0);


-- =============================================================================
-- SECCIÓN 5: CONSULTAS DE DESTRUCCIÓN DE ESTRUCTURA (DROP TABLE) [1 sentencia]
-- =============================================================================

-- 5.1 Creación y posterior eliminación de una tabla temporal de auditoría
CREATE TABLE tabla_auditoria_temp (
    id INT
);

DROP TABLE tabla_auditoria_temp;


-- =============================================================================
-- SECCIÓN 6: CONSULTAS DE RECUPERACIÓN (SELECT) CON ÁLGEBRA RELACIONAL [3 sentencias]
-- =============================================================================

/*
 * =============================================================================
 * ÁLGEBRA RELACIONAL - SELECT 1 (Sin JOIN):
 * =============================================================================
 * Expresión Matemática:
 *   π_{titulo, fecha_hora, precio_entrada} ( σ_{precio_entrada > 10000 ∧ aforo_disponible > 0} (EVENTO) )
 *
 * Desglose de Operadores:
 *   - σ (Sigma - Selección): Filtra las tuplas de EVENTO donde precio_entrada > 10000 
 *     y aforo_disponible > 0.
 *   - π (Pi - Proyección): Extrae únicamente los atributos 'titulo', 'fecha_hora' 
 *     y 'precio_entrada'.
 * =============================================================================
 */
-- 6.1 SELECT 1: Eventos con precio mayor a 10.000 y aforo disponible > 0
SELECT 
    titulo, 
    fecha_hora, 
    precio_entrada
FROM evento
WHERE precio_entrada > 10000
  AND aforo_disponible > 0;


/*
 * =============================================================================
 * ÁLGEBRA RELACIONAL - SELECT 2 (Con JOIN de 2 tablas):
 * =============================================================================
 * Expresión Matemática Canónica:
 *   π_{nombre_local, titulo} ( σ_{estado_validacion = 'APROBADO'} (RECINTO ⨝_{RECINTO.id_recinto = EVENTO.id_recinto} EVENTO) )
 *
 * Expresión Optimizada (Selección Temprana / Pushdown):
 *   π_{nombre_local, titulo} ( (σ_{estado_validacion = 'APROBADO'} (RECINTO)) ⨝_{RECINTO.id_recinto = EVENTO.id_recinto} EVENTO )
 *
 * Desglose de Operadores:
 *   - σ (Sigma - Selección): Restringe las tuplas al subconjunto con estado_validacion = 'APROBADO'.
 *   - ⨝ (Join Theta / Reunión): Une las relaciones RECINTO y EVENTO bajo la condición de igualdad de claves foráneas (RECINTO.id_recinto = EVENTO.id_recinto).
 *   - π (Pi - Proyección): Proyecta las columnas 'nombre_local' y 'titulo'.
 * =============================================================================
 */
-- 6.2 SELECT 2: Nombre de local y título de evento para recintos aprobados
SELECT 
    r.nombre_local, 
    e.titulo
FROM recinto r
INNER JOIN evento e ON r.id_recinto = e.id_recinto
WHERE r.estado_validacion = 'APROBADO';


/*
 * =============================================================================
 * ÁLGEBRA RELACIONAL - SELECT 3 (Con JOIN de 3 tablas):
 * =============================================================================
 * Expresión Matemática Canónica:
 *   π_{nombre, titulo, cantidad_entradas} (
 *       σ_{estado_pago = 'PAGADO'} (
 *           (USUARIO ⨝_{USUARIO.id_usuario = RESERVA.id_usuario} RESERVA) 
 *           ⨝_{RESERVA.id_evento = EVENTO.id_evento} EVENTO
 *       )
 *   )
 *
 * Expresión Optimizada (Selección Temprana / Pushdown sobre RESERVA):
 *   π_{nombre, titulo, cantidad_entradas} (
 *       USUARIO ⨝_{USUARIO.id_usuario = RESERVA.id_usuario} 
 *       (σ_{estado_pago = 'PAGADO'} (RESERVA)) 
 *       ⨝_{RESERVA.id_evento = EVENTO.id_evento} EVENTO
 *   )
 *
 * Desglose de Operadores:
 *   - σ (Sigma - Selección): Aplica el filtro para conservar solo reservas con estado_pago = 'PAGADO'.
 *   - ⨝ (Join Theta / Reunión): 
 *       1. Une USUARIO con RESERVA mediante (USUARIO.id_usuario = RESERVA.id_usuario).
 *       2. Une el resultado previo con EVENTO mediante (RESERVA.id_evento = EVENTO.id_evento).
 *   - π (Pi - Proyección): Conserva los atributos 'nombre' del usuario, 'titulo' del evento 
 *     y 'cantidad_entradas' de la reserva.
 * =============================================================================
 */
-- 6.3 SELECT 3: Nombre de usuario, título de evento y entradas de reservas pagadas
SELECT 
    u.nombre, 
    e.titulo, 
    r.cantidad_entradas
FROM usuario u
INNER JOIN reserva r ON u.id_usuario = r.id_usuario
INNER JOIN evento e ON r.id_evento = e.id_evento
WHERE r.estado_pago = 'PAGADO';
