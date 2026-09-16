CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- PROYECTO: DondeE - Plataforma Geo-Social para Economía Nocturna
-- ASIGNATURA: ICI 324 - Bases de Datos y Programación Web (2026-2)
-- SCRIPT: 01_schema.sql - Esquema Relacional y Geo-Espacial Inicial
-- MOTOR: PostgreSQL 14+ con Extensión Espacial PostGIS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABLA: USUARIO
-- Almacena asistentes (CLIENTE), administradores y dueños de locales (HOST).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('CLIENTE', 'HOST', 'ADMIN')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. TABLA: RECINTO
-- Entidad física de los locales/bares nocturnos con coordenadas PostGIS (SRID 4326).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recinto (
    id_recinto BIGSERIAL PRIMARY KEY,
    nombre_local VARCHAR(120) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    ubicacion_geom GEOMETRY(POINT, 4326) NOT NULL,
    patente_municipal VARCHAR(50) NOT NULL,
    estado_validacion VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado_validacion IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
    id_host BIGINT NOT NULL,
    CONSTRAINT fk_recinto_host FOREIGN KEY (id_host) 
        REFERENCES usuario(id_usuario) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- Índice geoespacial GiST para consultas de radio y distancia rápida (ST_DWithin, KNN)
CREATE INDEX IF NOT EXISTS idx_recinto_ubicacion_geom ON recinto USING GIST (ubicacion_geom);

-- -----------------------------------------------------------------------------
-- 3. TABLA: EVENTO
-- Eventos nocturnos asociados a un recinto con control transaccional de aforo.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evento (
    id_evento BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    fecha_hora TIMESTAMP NOT NULL,
    precio_entrada NUMERIC(10, 2) DEFAULT 0.00 CHECK (precio_entrada >= 0),
    categoria_musical VARCHAR(50) NOT NULL,
    aforo_total INT NOT NULL CHECK (aforo_total > 0),
    aforo_disponible INT NOT NULL CHECK (aforo_disponible >= 0),
    id_recinto BIGINT NOT NULL,
    CONSTRAINT fk_evento_recinto FOREIGN KEY (id_recinto) 
        REFERENCES recinto(id_recinto) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT chk_aforo_consistente CHECK (aforo_disponible <= aforo_total)
);

-- -----------------------------------------------------------------------------
-- 4. TABLA: RESERVA
-- Transacciones de reserva y compra de tickets por parte de los usuarios.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reserva (
    id_reserva BIGSERIAL PRIMARY KEY,
    fecha_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_pago VARCHAR(20) NOT NULL CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'CANCELADO')),
    cantidad_entradas INT DEFAULT 1 CHECK (cantidad_entradas > 0 AND cantidad_entradas <= 5),
    total_pagado NUMERIC(10, 2) NOT NULL CHECK (total_pagado >= 0),
    id_usuario BIGINT NOT NULL,
    id_evento BIGINT NOT NULL,
    CONSTRAINT fk_reserva_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuario(id_usuario) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_reserva_evento FOREIGN KEY (id_evento) 
        REFERENCES evento(id_evento) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- -----------------------------------------------------------------------------
-- 5. TABLA: RESEÑA (resena)
-- Valoraciones de experiencia social y ambiente dejadas por los usuarios.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resena (
    id_resena BIGSERIAL PRIMARY KEY,
    calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT NULL,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario BIGINT NOT NULL,
    id_recinto BIGINT NOT NULL,
    CONSTRAINT fk_resena_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuario(id_usuario) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_resena_recinto FOREIGN KEY (id_recinto) 
        REFERENCES recinto(id_recinto) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Índices B-Tree en Foreign Keys para optimización de JOINs y performance de consultas
CREATE INDEX IF NOT EXISTS idx_recinto_host ON recinto(id_host);
CREATE INDEX IF NOT EXISTS idx_evento_recinto ON evento(id_recinto);
CREATE INDEX IF NOT EXISTS idx_reserva_usuario ON reserva(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reserva_evento ON reserva(id_evento);
CREATE INDEX IF NOT EXISTS idx_resena_usuario ON resena(id_usuario);
CREATE INDEX IF NOT EXISTS idx_resena_recinto ON resena(id_recinto);
