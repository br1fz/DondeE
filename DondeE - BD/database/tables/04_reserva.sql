-- -----------------------------------------------------------------------------
-- TABLA: RESERVA
-- Transacciones de reserva y venta de entradas con tope por usuario.
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

-- Índices de claves foráneas
CREATE INDEX IF NOT EXISTS idx_reserva_usuario ON reserva(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reserva_evento ON reserva(id_evento);
