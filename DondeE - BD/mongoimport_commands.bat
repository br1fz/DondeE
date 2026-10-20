@echo off
chcp 65001 >nul
echo ========================================================
echo   Importación de Datasets JSON a MongoDB con mongoimport
echo ========================================================
echo.
set /p MONGODB_URI="Ingrese la URI de MongoDB (ej. mongodb://localhost:27017/dondee_db): "

if "%MONGODB_URI%"=="" (
    set MONGODB_URI=mongodb://localhost:27017/dondee_db
)

echo.
echo Importando recintos (42 documentos)...
mongoimport --uri "%MONGODB_URI%" --collection recintos --file datasets_json/recintos.json --jsonArray --drop

echo Importando eventos (126 documentos)...
mongoimport --uri "%MONGODB_URI%" --collection eventos --file datasets_json/eventos.json --jsonArray --drop

echo Importando usuarios (13 documentos)...
mongoimport --uri "%MONGODB_URI%" --collection usuarios --file datasets_json/usuarios.json --jsonArray --drop

echo Importando reservas (8 documentos)...
mongoimport --uri "%MONGODB_URI%" --collection reservas --file datasets_json/reservas.json --jsonArray --drop

echo Importando resenas (44 documentos)...
mongoimport --uri "%MONGODB_URI%" --collection resenas --file datasets_json/resenas.json --jsonArray --drop

echo.
echo ========================================================
echo   ¡Importación finalizada con éxito!
echo ========================================================
pause
