-- -----------------------------------------------------------------------------
-- TABLA: RESEÑA (resena)
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

-- Índices de claves foráneas
CREATE INDEX IF NOT EXISTS idx_resena_usuario ON resena(id_usuario);
CREATE INDEX IF NOT EXISTS idx_resena_recinto ON resena(id_recinto);
