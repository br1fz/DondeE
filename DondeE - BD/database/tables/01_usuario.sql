-- -----------------------------------------------------------------------------
-- TABLA: USUARIO
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
