-- =============================================================================
-- PROYECTO: DondeE - Plataforma Geo-Social Nocturna
-- ARCHIVO: 07_mock_valparaiso_vina.sql
-- DESCRIPCIÓN: MockUp de datos de prueba para Valparaíso y Viña del Mar
--              - 8 Clientes Asistentes ficticios (sin miembros evaluados)
--              - 42 Locales Reales (21 en Valparaíso y 21 en Viña del Mar) con PostGIS SRID 4326
--              - 126 Eventos Nocturnos (3 eventos por cada local, propios y con productoras)
--              - Reservas con tope transaccional y Reseñas de ambiente
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. USUARIOS (CLIENTES Y HOSTS COMERCIALES)
-- -----------------------------------------------------------------------------
INSERT INTO usuario (nombre, email, password_hash, rol) VALUES
    -- Clientes Asistentes
    ('Valentina Morales', 'valen.morales@gmail.com', '$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I', 'CLIENTE'),
    ('Diego Silva', 'diego.silva@alumnos.usm.cl', '$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I', 'CLIENTE'),
    ('Camila Rojas', 'camila.rojas@gmail.com', '$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I', 'CLIENTE'),
    ('Ignacio Valenzuela', 'ignacio.valenzuela@gmail.com', '$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I', 'CLIENTE'),
    ('Sofía Henríquez', 'sofia.henriquez@outlook.com', '$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I', 'CLIENTE'),
    ('Matías Tapia', 'matias.tapia@alumnos.uv.cl', '$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I', 'CLIENTE'),
    ('Francisca Contreras', 'fran.contreras@gmail.com', '$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I', 'CLIENTE'),
    ('Lucas Sepúlveda', 'lucas.sepulveda@gmail.com', '$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I', 'CLIENTE'),

    -- Hosts de Locales Comerciales
    ('Host Valparaíso Puerto SpA', 'contacto@valpopuerto.cl', '$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I', 'HOST'),
    ('Host Cerros Alegre & Concepción', 'administracion@cerroalegre.cl', '$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I', 'HOST'),
    ('Host Viña Poniente & Casino', 'contacto@vinaponiente.cl', '$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I', 'HOST'),
    ('Host Reñaca Beach Clubs', 'contacto@renacabeach.cl', '$2b$12$e8Y6bF0ZzLkW6v3nK0gM5.U3X8P2v8J9fK2A7B6C5D4E3F2G1H0I', 'HOST')
ON CONFLICT (email) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. RECINTOS (42 LOCALES REALES CON POSTGIS SRID 4326)
-- -----------------------------------------------------------------------------
INSERT INTO recinto (nombre_local, direccion, ubicacion_geom, patente_municipal, estado_validacion, id_host) VALUES
    -- VALPARAÍSO (21 LOCALES)
    ('Club El Huevo', 'Blanco 1386, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6245, -33.0425), 4326), 'PAT-VALP-001', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('Bar La Playa', 'Serrano 568, Barrio Puerto, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6310, -33.0375), 4326), 'PAT-VALP-002', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('Bar Cinzano', 'Plaza Aníbal Pinto 1182, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6248, -33.0445), 4326), 'PAT-VALP-003', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('Terraza Bellavista Valpo', 'Blanco 1240, Bellavista, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6220, -33.0440), 4326), 'PAT-VALP-004', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('El Gato en la Ventana', 'Cumming 113, Subida Ecuador, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6272, -33.0448), 4326), 'PAT-VALP-005', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('El Internado Resto-Cultural', 'Pasaje Dimalow 167, Cerro Alegre, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6288, -33.0412), 4326), 'PAT-VALP-006', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'administracion@cerroalegre.cl')),
    ('Cervecería Altamira', 'Av. Elías 122, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6265, -33.0438), 4326), 'PAT-VALP-007', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'administracion@cerroalegre.cl')),
    ('Mascara Pub & Club', 'Plaza Aníbal Pinto 1178, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6247, -33.0442), 4326), 'PAT-VALP-008', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('La Piedra Feliz', 'Av. Errázuriz 1054, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6212, -33.0418), 4326), 'PAT-VALP-009', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('Bar Liberty', 'Cochrane 115, Plaza Echaurren, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6325, -33.0365), 4326), 'PAT-VALP-010', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('Páramo Bar', 'Condell 1395, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6235, -33.0458), 4326), 'PAT-VALP-011', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('El Rincón de las Guitarras', 'Freire 631, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6185, -33.0478), 4326), 'PAT-VALP-012', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('Bar Proa Valparaíso', 'Cochrane 451, Plaza Sotomayor, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6280, -33.0390), 4326), 'PAT-VALP-013', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('Pagano Club', 'Av. Errázuriz 1080, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6210, -33.0415), 4326), 'PAT-VALP-014', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('Waddington Bar & Resto', 'Av. Gran Bretaña 437, Playa Ancha, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6395, -33.0315), 4326), 'PAT-VALP-015', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('Bar Flamingo', 'Urriola 560, Cerro Alegre, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6268, -33.0428), 4326), 'PAT-VALP-016', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'administracion@cerroalegre.cl')),
    ('House Rock Bar', 'Cumming 98, Subida Ecuador, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6268, -33.0442), 4326), 'PAT-VALP-017', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('Fauna Restaurant & Bar', 'Pasaje Dimalow 166, Cerro Alegre, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6285, -33.0415), 4326), 'PAT-VALP-018', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'administracion@cerroalegre.cl')),
    ('Trolebús Bar', 'Condell 1450, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6225, -33.0465), 4326), 'PAT-VALP-019', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('Restobar El Cielo', 'San Juan de Dios 555, Subida Ecuador, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6280, -33.0460), 4326), 'PAT-VALP-020', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),
    ('Club Subterráneo Valpo', 'Cochrane 560, Valparaíso', ST_SetSRID(ST_MakePoint(-71.6295, -33.0385), 4326), 'PAT-VALP-021', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@valpopuerto.cl')),

    -- VIÑA DEL MAR (21 LOCALES)
    ('Club OVO (Enjoy Viña)', 'Av. San Martín 199, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5582, -33.0185), 4326), 'PAT-VINA-101', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Journal Bar & Resto', '3 Poniente 422, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5550, -33.0195), 4326), 'PAT-VINA-102', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Stylo Sunset & Lounge', 'Av. San Martín 540, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5540, -33.0150), 4326), 'PAT-VINA-103', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Living Club Reñaca', 'Av. Borgoño 14555, Reñaca, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5435, -32.9730), 4326), 'PAT-VINA-104', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@renacabeach.cl')),
    ('La Tertulia Cervecería', '1 Poniente 542, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5532, -33.0210), 4326), 'PAT-VINA-105', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Bar Hollywood Viña', 'Av. San Martín 501, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5545, -33.0160), 4326), 'PAT-VINA-106', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Del Barrio Pub', '3 Poniente 431, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5552, -33.0198), 4326), 'PAT-VINA-107', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Club de la Cerveza Viña', '4 Norte 191, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5528, -33.0175), 4326), 'PAT-VINA-108', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Boca de Pez Restobar', '2 Poniente 342, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5540, -33.0205), 4326), 'PAT-VINA-109', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Valpo Bier Viña', '5 Norte 145, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5520, -33.0168), 4326), 'PAT-VINA-110', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('El Irlandés Pub Viña', 'Blanco Encalada 150, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5570, -33.0190), 4326), 'PAT-VINA-111', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Sunset Lounge Reñaca', 'Av. Borgoño 12300, Reñaca, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5450, -32.9780), 4326), 'PAT-VINA-112', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@renacabeach.cl')),
    ('Terraza 8 Norte', '8 Norte 365, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5515, -33.0145), 4326), 'PAT-VINA-113', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Murano Viña Club', 'Quillota 798, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5450, -33.0245), 4326), 'PAT-VINA-114', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Deck 00 Reñaca', 'Av. Borgoño 14850, Reñaca, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5420, -32.9715), 4326), 'PAT-VINA-115', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@renacabeach.cl')),
    ('Pub Scratch Viña', '1 Poniente 410, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5538, -33.0205), 4326), 'PAT-VINA-116', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Tromba Bar & Kitchen', '3 Poniente 320, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5555, -33.0188), 4326), 'PAT-VINA-117', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Cervecería Taverna Viña', '1 Norte 1420, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5385, -33.0260), 4326), 'PAT-VINA-118', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Gatsby Lounge Viña', 'Av. San Martín 380, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5555, -33.0170), 4326), 'PAT-VINA-119', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl')),
    ('Reñaca Sunset Club', 'Av. Borgoño 13900, Sector 4, Reñaca', ST_SetSRID(ST_MakePoint(-71.5440, -32.9750), 4326), 'PAT-VINA-120', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@renacabeach.cl')),
    ('Club Soho Viña', '7 Norte 445, Viña del Mar', ST_SetSRID(ST_MakePoint(-71.5480, -33.0155), 4326), 'PAT-VINA-121', 'APROBADO', (SELECT id_usuario FROM usuario WHERE email = 'contacto@vinaponiente.cl'))
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3. EVENTOS (3 EVENTOS POR LOCAL = 126 EVENTOS)
-- -----------------------------------------------------------------------------
-- Inserción automatizada de eventos por recinto
DO $$
DECLARE
    rec RECORD;
    v_id BIGINT;
BEGIN
    FOR rec IN SELECT id_recinto, nombre_local FROM recinto LOOP
        -- Evento 1: Evento Propio del Local
        INSERT INTO evento (titulo, descripcion, fecha_hora, precio_entrada, categoria_musical, aforo_total, aforo_disponible, id_recinto)
        VALUES (
            'Noche Estelar en ' || rec.nombre_local,
            'Evento principal de fin de semana con producción especial de ' || rec.nombre_local,
            '2026-10-10 22:30:00',
            8000.00,
            'Hits & Bailable',
            250,
            35,
            rec.id_recinto
        );

        -- Evento 2: Productora Aliada (Transistor / Fauna / Sundeck)
        INSERT INTO evento (titulo, descripcion, fecha_hora, precio_entrada, categoria_musical, aforo_total, aforo_disponible, id_recinto)
        VALUES (
            'Productora Transistor & Fauna presentan: Live Session en ' || rec.nombre_local,
            'Gira de DJs y bandas invitadas con alta fidelidad y ambientación de productora externa.',
            '2026-10-17 21:00:00',
            12000.00,
            'Indie · Electrónica',
            200,
            24,
            rec.id_recinto
        );

        -- Evento 3: Sesión Acústica o Fiestas Universitarias
        INSERT INTO evento (titulo, descripcion, fecha_hora, precio_entrada, categoria_musical, aforo_total, aforo_disponible, id_recinto)
        VALUES (
            'Fiesta Universitaria & Sunset en ' || rec.nombre_local,
            'Ambiente juvenil con promociones en barra para universitarios de la V Región.',
            '2026-10-24 20:00:00',
            5000.00,
            'Ultrabailable · Pop Latino',
            180,
            40,
            rec.id_recinto
        );
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 4. RESERVAS (MOCK TRANSACCIONAL CON CLIENTES FICTICIOS)
-- -----------------------------------------------------------------------------
INSERT INTO reserva (fecha_reserva, estado_pago, cantidad_entradas, total_pagado, id_usuario, id_evento) VALUES
    (
        CURRENT_TIMESTAMP - INTERVAL '2 hours',
        'PAGADO',
        2,
        20000.00,
        (SELECT id_usuario FROM usuario WHERE email = 'valen.morales@gmail.com'),
        1
    ),
    (
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        'PAGADO',
        1,
        15000.00,
        (SELECT id_usuario FROM usuario WHERE email = 'diego.silva@alumnos.usm.cl'),
        2
    ),
    (
        CURRENT_TIMESTAMP - INTERVAL '5 hours',
        'PAGADO',
        2,
        12000.00,
        (SELECT id_usuario FROM usuario WHERE email = 'camila.rojas@gmail.com'),
        3
    ),
    (
        CURRENT_TIMESTAMP - INTERVAL '30 minutes',
        'PAGADO',
        3,
        24000.00,
        (SELECT id_usuario FROM usuario WHERE email = 'ignacio.valenzuela@gmail.com'),
        4
    )
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. RESEÑAS SOCIALES DEL AMBIENTE NOCTURNO
-- -----------------------------------------------------------------------------
INSERT INTO resena (calificacion, comentario, fecha_publicacion, id_usuario, id_recinto) VALUES
    (5, 'Los 3 ambientes de El Huevo estuvieron increíbles. La pista subterránea de techno estuvo a otro nivel.', CURRENT_TIMESTAMP - INTERVAL '2 days', (SELECT id_usuario FROM usuario WHERE email = 'diego.silva@alumnos.usm.cl'), 1),
    (5, 'Excelente bohemia y tradición centenaria en pleno Barrio Puerto.', CURRENT_TIMESTAMP - INTERVAL '1 day', (SELECT id_usuario FROM usuario WHERE email = 'ignacio.valenzuela@gmail.com'), 2),
    (5, 'La vista panorámica a los barcos de la bahía iluminada es impagable.', CURRENT_TIMESTAMP - INTERVAL '12 hours', (SELECT id_usuario FROM usuario WHERE email = 'camila.rojas@gmail.com'), 4),
    (5, 'El mejor club nocturno de Viña del Mar por lejos. La infraestructura en Enjoy es insuperable.', CURRENT_TIMESTAMP - INTERVAL '6 hours', (SELECT id_usuario FROM usuario WHERE email = 'fran.contreras@gmail.com'), 22),
    (5, '¡La fiesta en Reñaca frente a las olas no tiene comparación! El sistema de reserva nos evitó la fila.', CURRENT_TIMESTAMP - INTERVAL '4 hours', (SELECT id_usuario FROM usuario WHERE email = 'diego.silva@alumnos.usm.cl'), 25)
ON CONFLICT DO NOTHING;
