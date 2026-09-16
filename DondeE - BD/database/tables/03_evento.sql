-- -----------------------------------------------------------------------------
-- TABLA: EVENTO
-- Eventos asociados a recintos con control transaccional de aforo.
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

-- Índice de clave foránea
CREATE INDEX IF NOT EXISTS idx_evento_recinto ON evento(id_recinto);
