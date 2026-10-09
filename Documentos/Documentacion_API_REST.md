# Documentacion Oficial de la API REST - DondeE (Entrega 2 NoSQL)

**Proyecto:** DondeE — Plataforma Geo-Social de Vida Nocturna  
**Asignatura:** ICI 324 - Bases de Datos y Programacion Web (2026)  
**Institucion:** Universidad de Valparaiso / Escuela de Ingenieria Informatica  
**Grupo de Desarrollo:** Grupo 2 (Martin Araya, Jorge Bahamondes, Bruno Diaz)  
**Motor de Base de Datos:** MongoDB Atlas Cluster 7.0+ / Motor NoSQL GeoJSON Hibrido  
**Servidor de Aplicaciones:** Node.js v20+, Express 5, TypeScript  
**Fecha:** Octubre 2026  

---

## 1. Introduccion y Proposito de la API

La API REST de **DondeE** es una interfaz de programacion orientada a recursos disennada para conectar de forma desacoplada la aplicacion cliente web (Frontend React 19 con Leaflet) con la capa de persistencia NoSQL basada en **MongoDB Atlas**.

### Proposito General:
- **Exploracion Urbana y Cartografica:** Proveer puntos de acceso de alto rendimiento para consultar recintos nocturnos (clubs, pubs, bares), eventos en vivo y sectores representativos de Valparaiso y Vinna del Mar.
- **Geolocalizacion NoSQL de Precision:** Ejecutar consultas espaciales sobre coordenadas GeoJSON de formato `Point [longitud, latitud]` utilizando indices espaciales `2dsphere` y operadores de proximidad (`$near`, `$geoNear`).
- **Gestion Transaccional de Aforo:** Garantizar la reserva atomica de entradas descontando cupos en tiempo real y evitando problemas de sobreventa (overselling).
- **Comunidad y Feedback Social:** Permitir la calificacion y resenna comunitaria de los locales nocturnos con recuento y promedio ponderado dinamico.
- **Analitica Avanzada en MongoDB:** Implementar mediante Pipelines de Agregacion (`Aggregation Pipelines`) y MQL (`MongoDB Query Language`) las metricas equivalentes a las consultas relacionales complejas de la rubrica academica (agrupaciones, rankings con filtros posagregacion, alertas de aforo critico y deteccion de inactividad).

---

## 2. Arquitectura de la API y Tecnologias Base

### 2.1 Stack Tecnologico
- **Entorno de Ejecucion:** Node.js version 20 o superior.
- **Framework Web:** Express 5.x con tipado TypeScript estricto.
- **Driver de Persistencia:** MongoDB Node.js Driver oficial version 7.x.
- **Middleware:** CORS (Cross-Origin Resource Sharing) habilitado para navegadores modernos, `express.json()` para serializacion y deserializacion automatica de payloads.
- **Estructura Modular:**
  - `DondeE - BE/src/server.ts`: Definicion de rutas, validacion de parametros y codigos de estado HTTP.
  - `DondeE - BE/src/database.ts`: Capa de persistencia, conexion a cluster MongoDB Atlas y motor de respaldo documental local.
  - `DondeE - BD/nosql/`: Datasets canonicos en formato JSON (`recintos.json`, `eventos.json`, `usuarios.json`, `reservas.json`).

### 2.2 Estrategia de Persistencia Dual y Resiliencia
La API implementa un patron de **Resiliencia Activa**:
1. **Modo Primario:** Conecta directamente a MongoDB Atlas Cluster (`dondee_db`) empleando una URI segura con protocolo `mongodb+srv`. Si el cluster responde, todas las operaciones de lectura, escritura y agregacion se delegan nativamente al motor de MongoDB.
2. **Modo Fallback / Desconectado:** Si la conexion al cluster remoto no se encuentra disponible (debido a limitaciones de red o politicas de firewall perimetral), el gestor de base de datos carga de forma transparente los datasets JSON locales ubicados en `DondeE - BD/nosql/` manteniendo el servicio 100% operativo sin interrupciones para el usuario ni para el frontend.

---

## 3. Catalogo de Endpoints

A continuacion se presenta la matriz completa de los 14 endpoints disponibles en la API REST:

| Metodo | Endpoint | Proposito Principal | Categoria |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Estado del backend, salud de la conexion y estadisticas de colecciones | Diagnostico |
| `GET` | `/api/search` | Busqueda multi-entidad (sectores, eventos, recintos) con debouncing | Busqueda |
| `GET` | `/api/venues` | Catalogo completo de recintos con subdocumentos embebidos | Recintos |
| `GET` | `/api/venues/near` | Busqueda geoespacial NoSQL por radio de proximidad (GeoJSON 2dsphere) | Geoespacial |
| `GET` | `/api/events` | Cartelera completa de eventos con estado de aforo en vivo | Eventos |
| `GET` | `/api/users` | Directorio de usuarios registrados (proyeccion segura sin passwords) | Usuarios |
| `GET` | `/api/reviews` | Listado de resennas sociales globales o filtradas por recinto | Resennas |
| `POST` | `/api/reviews` | Creacion y persistencia de una nueva resenna con calificacion | Resennas |
| `POST` | `/api/reservations` | Registro transaccional de reserva y decremento atomico de aforo | Transaccional |
| `GET` | `/api/analytics/venues-summary` | Agregacion NoSQL ($group): Total eventos, aforo acumulado y precio promedio | Analitica Rubrica |
| `GET` | `/api/venues/top-rated` | Agregacion NoSQL ($match, $project, $sort): Ranking de los mejores 5 recintos | Analitica Rubrica |
| `GET` | `/api/events/almost-sold-out` | Expresion MQL ($expr, $divide, $lte): Alerta de eventos con aforo critico <= 20% | Analitica Rubrica |
| `GET` | `/api/users/inactive` | Agregacion NoSQL ($lookup, $match con size 0): Usuarios sin compras registradas | Analitica Rubrica |
| `GET` | `/api/nosql/collections` | Metricas y conteo de documentos por coleccion NoSQL | Diagnostico |

---

## 4. Detalle y Especificacion Tecnica por Endpoint

### 4.1 `GET /api/health`
- **Descripcion:** Informa la condicion operativa del servidor Express, el motor de base de datos activo (MongoDB Atlas o motor local JSON), la hora del sistema y el volumen de documentos cargados.
- **Parametros:** Ninguno.
- **Codigos de Respuesta:** `200 OK`.

#### Ejemplo de Solicitud:
```http
GET /api/health HTTP/1.1
Host: localhost:3001
Accept: application/json
```

#### Ejemplo de Respuesta (`200 OK`):
```json
{
  "ok": true,
  "database": "connected",
  "engine": "MongoDB Atlas 7.0+ (NoSQL Cluster dondee_db / GeoJSON 2dsphere)",
  "now": "2026-10-09T18:45:00.000Z",
  "driver": "mongodb native driver",
  "venues_count": 42,
  "events_count": 126,
  "collections": [
    "recintos",
    "eventos",
    "usuarios",
    "reservas"
  ]
}
```

---

### 4.2 `GET /api/search`
- **Descripcion:** Realiza busquedas full-text y difusas sobre tres entidades simultaneamente: sectores/localidades urbanas, eventos nocturnos y recintos validados.
- **Parametros Query:**
  - `q` (string, opcional): Cadena de texto a buscar (ej: `cerro`, `techno`, `viña`, `rock`).
- **Codigos de Respuesta:** `200 OK`.

#### Ejemplo de Solicitud:
```http
GET /api/search?q=Alegre HTTP/1.1
Host: localhost:3001
Accept: application/json
```

#### Ejemplo de Respuesta (`200 OK`):
```json
{
  "venues": [
    {
      "id_recinto": 2,
      "nombre_local": "Cerveceria Altamira",
      "direccion": "Av. Elias 126, Cerro Alegre",
      "sector": "Cerro Alegre",
      "ciudad": "Valparaiso",
      "tipo": "pub",
      "lat": -33.0412,
      "lng": -71.6288,
      "patente_municipal": "VAL-PUB-2024-002",
      "estado_validacion": "APROBADO",
      "rating": 4.8,
      "reviews_count": 94,
      "aforo_total": 140,
      "aforo_disponible": 60,
      "precio_entrada": 5000
    }
  ],
  "events": [
    {
      "id_evento": 4,
      "titulo": "Degustacion Cerveza Artesanal y Jazz Manouche",
      "descripcion": "Cata guiada de 4 variedades Altamira maridadas con musica en vivo.",
      "fecha_hora": "2026-10-18T20:00:00.000Z",
      "precio_entrada": 12000,
      "categoria_musical": "Jazz / Acustico",
      "aforo_total": 90,
      "aforo_disponible": 35,
      "id_recinto": 2,
      "nombre_local": "Cerveceria Altamira",
      "direccion": "Av. Elias 126, Cerro Alegre",
      "ciudad": "Valparaiso",
      "sector": "Cerro Alegre",
      "artistas": ["Quinteto Gypsy Porteno"]
    }
  ],
  "sectors": [
    {
      "name": "Cerro Alegre",
      "city": "Valparaiso",
      "lat": -33.0412,
      "lng": -71.6288,
      "venuesCount": 3
    }
  ]
}
```

---

### 4.3 `GET /api/venues`
- **Descripcion:** Retorna la coleccion completa de los 42 recintos comerciales nocturnos distribuidos entre Valparaiso y Vinna del Mar, conteniendo las coordenadas GeoJSON, datos del host y resennas embebidas.
- **Parametros:** Ninguno.
- **Codigos de Respuesta:** `200 OK`.

#### Ejemplo de Solicitud:
```http
GET /api/venues HTTP/1.1
Host: localhost:3001
Accept: application/json
```

#### Ejemplo de Respuesta (`200 OK` - Fragmento):
```json
[
  {
    "id_recinto": 1,
    "nombre_local": "El Huevo Club",
    "direccion": "Blanco 1386, Bellavista",
    "sector": "Bellavista / Av. Errazuriz",
    "ciudad": "Valparaiso",
    "tipo": "club",
    "lat": -33.0418,
    "lng": -71.6212,
    "patente_municipal": "VAL-ALC-2024-001",
    "estado_validacion": "APROBADO",
    "rating": 4.6,
    "reviews_count": 128,
    "aforo_total": 1200,
    "aforo_disponible": 450,
    "precio_entrada": 8000,
    "ubicacion": {
      "type": "Point",
      "coordinates": [-71.6212, -33.0418]
    },
    "host": {
      "id_usuario": 11,
      "nombre": "Administracion El Huevo SpA",
      "email": "contacto@elhuevo.cl"
    }
  }
]
```

---

### 4.4 `GET /api/venues/near`
- **Descripcion:** Consulta geoespacial NoSQL que localiza y ordena recintos por distancia utilizando el operador `$near` sobre el indice espacial `2dsphere` de MongoDB. En modo desconectado, calcula distancias geodesicas exactas mediante la formula de Haversine.
- **Parametros Query:**
  - `lng` (number, opcional, por defecto `-71.6245`): Longitud del punto de referencia.
  - `lat` (number, opcional, por defecto `-33.0425`): Latitud del punto de referencia.
  - `maxDistance` (number, opcional, por defecto `3000`): Radio maximo de busqueda en metros.
- **Codigos de Respuesta:** `200 OK`.

#### Ejemplo de Solicitud:
```http
GET /api/venues/near?lng=-71.6245&lat=-33.0425&maxDistance=1500 HTTP/1.1
Host: localhost:3001
Accept: application/json
```

#### Ejemplo de Respuesta (`200 OK`):
```json
[
  {
    "id_recinto": 6,
    "nombre_local": "El Internado Bar & Arte",
    "direccion": "Pasaje Dimalow 167, Cerro Alegre",
    "sector": "Cerro Alegre",
    "ciudad": "Valparaiso",
    "distancia_metros": 210,
    "rating": 4.7,
    "ubicacion": {
      "type": "Point",
      "coordinates": [-71.6265, -33.0425]
    }
  },
  {
    "id_recinto": 2,
    "nombre_local": "Cerveceria Altamira",
    "direccion": "Av. Elias 126, Cerro Alegre",
    "sector": "Cerro Alegre",
    "ciudad": "Valparaiso",
    "distancia_metros": 435,
    "rating": 4.8,
    "ubicacion": {
      "type": "Point",
      "coordinates": [-71.6288, -33.0412]
    }
  }
]
```

---

### 4.5 `GET /api/events`
- **Descripcion:** Obtiene los 126 eventos nocturnos del catalogo, incluyendo el estado de aforo en vivo (`aforo_disponible / aforo_total`), categorizacion musical, productora organizadora y proveedor de boletos.
- **Parametros:** Ninguno.
- **Codigos de Respuesta:** `200 OK`.

#### Ejemplo de Solicitud:
```http
GET /api/events HTTP/1.1
Host: localhost:3001
Accept: application/json
```

#### Ejemplo de Respuesta (`200 OK` - Fragmento):
```json
[
  {
    "id_evento": 1,
    "titulo": "Noche de Techno Industrial Subterraneo",
    "descripcion": "Cuatro ambientes con DJs internacionales de Berlin y Santiago.",
    "fecha_hora": "2026-10-17T23:00:00.000Z",
    "precio_entrada": 12000,
    "categoria_musical": "Techno / Underground",
    "aforo_total": 600,
    "aforo_disponible": 140,
    "id_recinto": 1,
    "nombre_local": "El Huevo Club",
    "direccion": "Blanco 1386, Bellavista",
    "ciudad": "Valparaiso",
    "sector": "Bellavista / Av. Errazuriz",
    "ticket_provider": "Passline Chile",
    "hot": true,
    "artistas": ["DJ Klang", "Vortex Live", "Sara Valenzuela"]
  }
]
```

---

### 4.6 `GET /api/users`
- **Descripcion:** Entrega el listado de usuarios de la plataforma (Administradores, Clientes y Hosts/Organizadores). Por directriz de seguridad de datos, omite de forma estricta los campos sensibles como hashes de contrasennas (`password_hash`).
- **Parametros:** Ninguno.
- **Codigos de Respuesta:** `200 OK`.

#### Ejemplo de Solicitud:
```http
GET /api/users HTTP/1.1
Host: localhost:3001
Accept: application/json
```

#### Ejemplo de Respuesta (`200 OK`):
```json
[
  {
    "id_usuario": 1,
    "nombre": "Administrador General DondeE",
    "email": "admin@dondee.cl",
    "rol": "ADMIN",
    "fecha_registro": "2026-09-01T10:00:00.000Z"
  },
  {
    "id_usuario": 2,
    "nombre": "Valentina Morales",
    "email": "valen.morales@gmail.com",
    "rol": "CLIENTE",
    "fecha_registro": "2026-09-10T14:30:00.000Z"
  }
]
```

---

### 4.7 `GET /api/reviews`
- **Descripcion:** Consulta las opiniones sociales emitidas por los usuarios. Puede obtener todas las resennas globales o filtrar exclusivamente por el identificador del recinto anfitrion.
- **Parametros Query:**
  - `venueId` (number, opcional): Identificador del recinto (ej: `?venueId=1`).
- **Codigos de Respuesta:** `200 OK`.

#### Ejemplo de Solicitud:
```http
GET /api/reviews?venueId=1 HTTP/1.1
Host: localhost:3001
Accept: application/json
```

#### Ejemplo de Respuesta (`200 OK`):
```json
[
  {
    "id_resena": 101,
    "calificacion": 5,
    "comentario": "Excelente ambiente en el subterraneo, la musica y el sonido estuvieron de nivel internacional.",
    "fecha": "2026-09-20T03:15:00.000Z",
    "usuario": {
      "id_usuario": 2,
      "nombre": "Valentina Morales"
    }
  }
]
```

---

### 4.8 `POST /api/reviews`
- **Descripcion:** Crea una nueva resenna con valoracion numerica de 1 a 5 estrellas. En MongoDB, realiza un operador `$push` al arreglo embebido `resenas` dentro del documento del recinto e incrementa el contador `reviews_count` con `$inc`.
- **Cuerpo de Solicitud (JSON):**
  - `rating` (number, obligatorio): Entero de 1 a 5.
  - `comment` (string, opcional): Texto explicativo de la experiencia.
  - `userId` (number, obligatorio): Identificador del usuario que publica.
  - `venueId` (number, obligatorio): Identificador del recinto calificado.
  - `userName` (string, opcional): Nombre legible del autor.
- **Codigos de Respuesta:** `201 Created` en exito; `400 Bad Request` si faltan campos obligatorios.

#### Ejemplo de Solicitud:
```http
POST /api/reviews HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "rating": 5,
  "comment": "La cocteleria y la vista panoramica son insuperables en Valparaiso.",
  "userId": 2,
  "venueId": 2,
  "userName": "Valentina Morales"
}
```

#### Ejemplo de Respuesta (`201 Created`):
```json
{
  "id_resena": 1728500200123,
  "calificacion": 5,
  "comentario": "La cocteleria y la vista panoramica son insuperables en Valparaiso.",
  "fecha": "2026-10-09T18:48:00.000Z",
  "usuario": {
    "id_usuario": 2,
    "nombre": "Valentina Morales"
  }
}
```

---

### 4.9 `POST /api/reservations`
- **Descripcion:** Registra una reserva formal de entradas. Realiza una operacion atomica que inserta el documento en la coleccion `reservas` y actualiza la coleccion `eventos` decrementando el campo `aforo_disponible` con `$inc: { aforo_disponible: -quantity }`.
- **Cuerpo de Solicitud (JSON):**
  - `userId` (number, obligatorio): ID del cliente que compra.
  - `eventId` (number, obligatorio): ID del evento a asistir.
  - `quantity` (number, obligatorio): Cantidad de entradas (ej: `1` a `10`).
  - `totalPaid` (number, opcional): Monto total pagado en CLP.
  - `userName` (string, opcional): Nombre del cliente.
- **Codigos de Respuesta:** `201 Created` en exito; `400 Bad Request` si los parametros requeridos no estan presentes.

#### Ejemplo de Solicitud:
```http
POST /api/reservations HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "userId": 3,
  "eventId": 1,
  "quantity": 2,
  "totalPaid": 24000,
  "userName": "Diego Silva"
}
```

#### Ejemplo de Respuesta (`201 Created`):
```json
{
  "id_reserva": 1728500350456,
  "fecha_reserva": "2026-10-09T18:50:00.000Z",
  "estado_pago": "PAGADO",
  "cantidad_entradas": 2,
  "total_pagado": 24000,
  "usuario": {
    "id_usuario": 3,
    "nombre": "Diego Silva"
  },
  "evento": {
    "id_evento": 1,
    "titulo": "Noche de Techno Industrial Subterraneo",
    "nombre_local": "El Huevo Club"
  }
}
```

---

### 4.10 `GET /api/analytics/venues-summary`
- **Descripcion:** Implementacion directa del **Requerimiento 4 de la Rubrica (Group By y Funciones de Agregacion)**. Ejecuta un Pipeline de Agregacion sobre la coleccion `eventos` agrupando por recinto para computar el conteo total de eventos, la capacidad acumulada y el precio promedio de entradas.
- **Pipeline MQL:**
  ```javascript
  db.eventos.aggregate([
    {
      $group: {
        _id: "$id_recinto",
        nombre_local: { $first: "$nombre_local" },
        total_eventos: { $sum: 1 },
        capacidad_total_eventos: { $sum: "$aforo_total" },
        precio_promedio: { $avg: "$precio_entrada" }
      }
    },
    {
      $project: {
        id_recinto: "$_id",
        nombre_local: 1,
        total_eventos: 1,
        capacidad_total_eventos: 1,
        precio_promedio: { $round: ["$precio_promedio", 2] }
      }
    },
    { $sort: { total_eventos: -1 } }
  ])
  ```
- **Parametros:** Ninguno.
- **Codigos de Respuesta:** `200 OK`.

#### Ejemplo de Respuesta (`200 OK`):
```json
[
  {
    "id_recinto": 1,
    "nombre_local": "El Huevo Club",
    "total_eventos": 3,
    "capacidad_total_eventos": 2200,
    "precio_promedio": 10666.67
  },
  {
    "id_recinto": 22,
    "nombre_local": "OVO Nightclub Enjoy",
    "total_eventos": 3,
    "capacidad_total_eventos": 2400,
    "precio_promedio": 18333.33
  }
]
```

---

### 4.11 `GET /api/venues/top-rated`
- **Descripcion:** Implementacion directa del **Requerimiento 5 de la Rubrica (Filtro Posagregacion / Having)**. Realiza una agregacion sobre la coleccion `recintos` filtrando mediante `$match` los locales con resennas existentes, proyectando el promedio real con `$avg` sobre el arreglo embebido y ordenando de forma descendente para retornar los 5 recintos con mayor calificacion.
- **Pipeline MQL:**
  ```javascript
  db.recintos.aggregate([
    { $match: { "resenas.0": { $exists: true } } },
    {
      $project: {
        id_recinto: 1,
        nombre_local: 1,
        cantidad_resenas: { $size: "$resenas" },
        promedio_real: { $round: [{ $avg: "$resenas.calificacion" }, 1] }
      }
    },
    { $sort: { promedio_real: -1, cantidad_resenas: -1 } },
    { $limit: 5 }
  ])
  ```
- **Parametros:** Ninguno.
- **Codigos de Respuesta:** `200 OK`.

#### Ejemplo de Respuesta (`200 OK`):
```json
[
  {
    "id_recinto": 2,
    "nombre_local": "Cerveceria Altamira",
    "cantidad_resenas": 1,
    "promedio_real": 5.0
  },
  {
    "id_recinto": 6,
    "nombre_local": "El Internado Bar & Arte",
    "cantidad_resenas": 1,
    "promedio_real": 4.8
  },
  {
    "id_recinto": 1,
    "nombre_local": "El Huevo Club",
    "cantidad_resenas": 1,
    "promedio_real": 4.6
  }
]
```

---

### 4.12 `GET /api/events/almost-sold-out`
- **Descripcion:** Implementacion directa del **Requerimiento 8 de la Rubrica (Operacion Matematica en Predicado)**. Ejecuta una consulta MQL con el operador `$expr` evaluando en tiempo real una division aritmetica entre campos (`aforo_disponible / aforo_total <= 0.20`), detectando eventos con aforo disponible menor o igual al 20% (alerta de cupos criticos o FOMO).
- **Consulta MQL:**
  ```javascript
  db.eventos.find({
    aforo_disponible: { $gt: 0 },
    $expr: {
      $lte: [{ $divide: ["$aforo_disponible", "$aforo_total"] }, 0.20]
    }
  }).sort({ aforo_disponible: 1 })
  ```
- **Parametros:** Ninguno.
- **Codigos de Respuesta:** `200 OK`.

#### Ejemplo de Respuesta (`200 OK`):
```json
[
  {
    "id_evento": 12,
    "titulo": "Sesion Vinilos Secretos en Mirador",
    "nombre_local": "Bar Cinzano",
    "aforo_disponible": 8,
    "aforo_total": 80,
    "porcentaje_disponible": 10.0
  },
  {
    "id_evento": 45,
    "titulo": "Sunset Rooftop Tropical House",
    "nombre_local": "Del Barrio Pub",
    "aforo_disponible": 18,
    "aforo_total": 120,
    "porcentaje_disponible": 15.0
  }
]
```

---

### 4.13 `GET /api/users/inactive`
- **Descripcion:** Implementacion directa del **Requerimiento 10 de la Rubrica (Teoria de Conjuntos / Operacion Except)**. Ejecuta una agregacion NoSQL con `$lookup` entre la coleccion `usuarios` y la coleccion `reservas`, aplicando un filtro `$match` sobre arreglos de compras vacios (`{ compras: { $size: 0 } }`), identificando usuarios registrados que jamas han realizado una transaccion de pago.
- **Pipeline MQL:**
  ```javascript
  db.usuarios.aggregate([
    {
      $lookup: {
        from: "reservas",
        localField: "id_usuario",
        foreignField: "usuario.id_usuario",
        as: "compras"
      }
    },
    { $match: { "compras": { $size: 0 } } },
    { $project: { _id: 0, id_usuario: 1, nombre: 1, email: 1, rol: 1 } }
  ])
  ```
- **Parametros:** Ninguno.
- **Codigos de Respuesta:** `200 OK`.

#### Ejemplo de Respuesta (`200 OK`):
```json
[
  {
    "id_usuario": 4,
    "nombre": "Camila Rojas",
    "email": "camila.rojas@gmail.com",
    "rol": "CLIENTE"
  },
  {
    "id_usuario": 5,
    "nombre": "Ignacio Valenzuela",
    "email": "ignacio.valenzuela@gmail.com",
    "rol": "CLIENTE"
  }
]
```

---

### 4.14 `GET /api/nosql/collections`
- **Descripcion:** Entrega el estado cuantitativo y conectividad de las cuatro colecciones principales de MongoDB en tiempo real.
- **Parametros:** Ninguno.
- **Codigos de Respuesta:** `200 OK`.

#### Ejemplo de Respuesta (`200 OK`):
```json
{
  "recintos": 42,
  "eventos": 126,
  "usuarios": 13,
  "reservas": 4,
  "isMongoAvailable": true
}
```

---

## 5. Autenticacion y Autorizacion

### 5.1 Jerarquia de Roles
La plataforma DondeE define tres niveles de acceso segun el modelo de Control de Acceso Basado en Roles (RBAC):

1. **`ADMIN` (Administrador de Plataforma):**
   - Acceso total a metricas de sistema, colecciones y modificacion de estados de validacion de locales (`APROBADO`, `PENDIENTE`, `RECHAZADO`).
2. **`ORGANIZADOR` / `HOST`:**
   - Propietarios y productores autorizados para crear eventos asociados a sus locales y verificar listas de reservas emitidas.
3. **`CLIENTE` (Consumidor Final):**
   - Perfil con autorizacion para emitir resennas, consultar cartelera y ejecutar reservas de cupos.

### 5.2 Mecanismo de Autenticacion
- **Formato de Contrasennas:** Las contrasennas de usuarios nunca se almacenan en texto plano; son procesadas con el algoritmo de derivacion criptografica **bcrypt** utilizando un factor de costo de 12 rondas de salting (`$2b$12$...`).
- **Encabezado de Autorizacion:** En entornos productivos, los endpoints restringidos reciben un token JWT (JSON Web Token) mediante la cabecera estandar:
  ```http
  Authorization: Bearer <token_jwt>
  ```
- **Proyeccion Segura:** En todas las consultas a la coleccion de usuarios, el driver excluye explicitamente el campo confidencial mediante `{ projection: { password_hash: 0 } }`.

---

## 6. Manejo y Formato de Errores

Todos los errores generados por la API responden con un cuerpo JSON normalizado y codigos de estado estandar RFC 9110:

```json
{
  "error": "Descripcion legible del error",
  "codigo": "ERR_CODIGO_IDENTIFICADOR"
}
```

### Tabla de Codigos HTTP Utilizados:

| Codigo HTTP | Nombre | Escenario de Activacion |
| :--- | :--- | :--- |
| `200 OK` | Exito | Peticion procesada correctamente con retorno de datos. |
| `201 Created` | Creado | Recurso generado exitosamente (ej: resenna o reserva registrada). |
| `400 Bad Request` | Solicitud Invalida | Faltan parametros requeridos o los tipos de datos no son validos. |
| `401 Unauthorized` | No Autorizado | El cliente no proporciono credenciales validas para el recurso. |
| `403 Forbidden` | Prohibido | El usuario carece de permisos de rol suficientes para la accion. |
| `404 Not Found` | No Encontrado | La ruta o el recurso solicitado no existe en el catalogo. |
| `409 Conflict` | Conflicto | El aforo solicitado supera los cupos disponibles en el evento. |
| `429 Too Many Requests` | Limite Excedido | Se supero la cuota permitida de solicitudes por ventana de tiempo. |
| `500 Internal Error` | Error Interno | Fallo no capturado en la ejecucion del servidor o persistencia. |

#### Ejemplo de Error `400 Bad Request` (Parametros incompletos):
```json
{
  "error": "Campos obligatorios: rating, venueId, userId"
}
```

#### Ejemplo de Error `404 Not Found` (Ruta inexistente):
```json
{
  "error": "Ruta no encontrada"
}
```

---

## 7. Limites y Cuotas de Solicitud (Rate Limiting)

Para proteger la disponibilidad del backend y prevenir ataques de denegacion de servicio (DoS) o scraping abusivo de la cartelera, se establecen las siguientes politicas recomendadas:

### 7.1 Politica por Tipo de Endpoint
- **Endpoints de Lectura Publica (`/api/search`, `/api/venues`, `/api/events`):**
  - Limite: **120 solicitudes por minuto por direccion IP**.
  - Ventana deslizante: 60 segundos.
- **Endpoints de Transaccion y Escritura (`/api/reservations`, `/api/reviews`):**
  - Limite: **15 solicitudes por minuto por usuario autenticado o IP**.
  - Proposito: Evitar spam en calificaciones y reservas masivas automatizadas (bots de reventa).

### 7.2 Cabeceras HTTP de Control de Cuota
Cuando se aplican limitadores de trafico, la API emite las cabeceras estandar en las respuestas:
- `RateLimit-Limit`: Numero maximo de peticiones permitidas en la ventana.
- `RateLimit-Remaining`: Peticiones restantes antes de aplicar bloqueo temporal.
- `RateLimit-Reset`: Tiempo en segundos restantes para el reinicio de la ventana de conteo.

En caso de superar el umbral, el servidor responde con codigo `429 Too Many Requests`:
```json
{
  "error": "Demasiadas solicitudes. Por favor intente nuevamente en 60 segundos.",
  "retryAfterSeconds": 60
}
```

---

## 8. Consideraciones de Seguridad y Buenas Practicas

1. **Prevencion de Inyecciones NoSQL:**
   - La API utiliza tipos estrictos en TypeScript y evita la ejecucion de cadenas arbitrarias o expresiones no sanitizadas en consultas a MongoDB. Se prohibe el uso de operadores evaluativos dinamicos como `$where` del lado de la base de datos.
2. **CORS Restrictivo:**
   - La API utiliza el middleware `cors()` configurado para responder exclusivamente a los origenes del frontend autorizados en produccion, evitando solicitudes cross-site no autorizadas.
3. **Cifrado de Comunicacion:**
   - Todas las conexiones salientes hacia MongoDB Atlas Cluster se realizan de manera forzosa bajo cifrado TLS/SSL criptografico con certificados actualizados.
4. **Proteccion de Red en Atlas:**
   - Acceso al cluster restringido mediante Network Access Whitelist (IP de conectividad local actual y gateways del servidor de produccion).
5. **No Exposicion de Claves en Versionamiento:**
   - Las variables sensibles se mantienen exclusivamente en el archivo de entorno `.env` (declarado en `.gitignore`), protegiendo cadenas de conexion y credenciales administrativas de subidas accidentales a repositorios publicos.

---

## 9. Instrucciones de Compilacion, Exportacion y Ejecucion

### 9.1 Instalacion de Dependencias
```bash
cd "DondeE - BE"
npm install
```

### 9.2 Generacion de Datasets NoSQL Canonicos (.json)
Para reconstruir y regenerar los cuatro archivos JSON estructurados a partir del catalogo maestro de la aplicacion:
```bash
npm run export-json
```
Los archivos quedaran exportados en la ruta relativa del proyecto: `DondeE - BD/nosql/`.

### 9.3 Poblado del Cluster MongoDB Atlas
Para sembrar las colecciones, aplicar los esquemas NoSQL y crear los indices (`2dsphere`, indices unicos y texto) en MongoDB Atlas:
```bash
npm run seed
```

### 9.4 Compilacion del Backend TypeScript
```bash
npm run build
```

### 9.5 Puesta en Marcha del Servidor API
```bash
npm start
```
El servicio quedara escuchando de manera continua en: **`http://localhost:3001`**.

---

## 10. Trazabilidad con el Repositorio

- **Codigo Fuente de Rutas:** `DondeE - BE/src/server.ts`
- **Gestor de Persistencia y Consultas MQL:** `DondeE - BE/src/database.ts`
- **Script de Sembrado en Atlas:** `DondeE - BE/src/seed-mongodb.ts`
- **Exportador a JSON NoSQL:** `DondeE - BE/src/export-nosql-json.ts`
- **Archivos de Persistencia Documental:**
  - `DondeE - BD/nosql/recintos.json`
  - `DondeE - BD/nosql/eventos.json`
  - `DondeE - BD/nosql/usuarios.json`
  - `DondeE - BD/nosql/reservas.json`
- **Plan Maestro de Migracion NoSQL:** `Documentos/Analisis_Migracion_NoSQL_MongoDB.md`
