-- =============================================================================
-- PROYECTO: DondeE - Base de Datos
-- SCRIPT MAESTRO DE INICIALIZACIÓN: init.sql
-- =============================================================================
-- Permite levantar el esquema completo respetando el orden estricto de dependencias.
-- En psql, la directiva \ir (include relative) busca y ejecuta cada archivo 
-- de manera relativa a la ubicación de este script maestro.
--
-- Ejecución:
--   psql -U <usuario> -d dondee_db -f "DondeE - BD/database/init.sql"
-- =============================================================================

\ir 00_extensions.sql
\ir tables/01_usuario.sql
\ir tables/02_recinto.sql
\ir tables/03_evento.sql
\ir tables/04_reserva.sql
\ir tables/05_resena.sql
