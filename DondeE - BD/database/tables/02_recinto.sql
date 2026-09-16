-- -----------------------------------------------------------------------------
-- TABLA: RECINTO
-- Locales/bares nocturnos con coordenadas PostGIS (SRID 4326) y validación de host.
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

-- Índice geoespacial GiST para optimizar búsquedas de radio y cercanía (ST_DWithin, KNN)
CREATE INDEX IF NOT EXISTS idx_recinto_ubicacion_geom ON recinto USING GIST (ubicacion_geom);

-- Índice de clave foránea
CREATE INDEX IF NOT EXISTS idx_recinto_host ON recinto(id_host);
