/**
 * Script de Carga Automática / Seed para MongoDB Atlas o Local
 * Proyecto: DondeE - Plataforma Geo-Social Nocturna (Entrega 2)
 * 
 * Uso:
 *   node seed_mongodb.js [MONGODB_URI]
 *   Ejemplo:
 *   node seed_mongodb.js "mongodb+srv://user:pass@cluster.mongodb.net/dondee_db"
 */

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const uri = process.argv[2] || process.env.MONGODB_URI || "mongodb://localhost:27017/dondee_db";
const dbName = process.env.MONGODB_DBNAME || "dondee_db";

const datasetsDir = path.join(__dirname, "datasets_json");

async function runSeed() {
  console.log("========================================================");
  console.log("  INICIALIZADOR Y SEEDER DE MONGODB - PROYECTO DONDEE");
  console.log("========================================================");
  console.log(`Conectando a: ${uri.replace(/:([^:@]+)@/, ":****@")}`);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✓ Conexión establecida exitosamente con el cluster.\n");

    const db = client.db(dbName);

    const collections = [
      { name: "recintos", file: "recintos.json" },
      { name: "eventos", file: "eventos.json" },
      { name: "usuarios", file: "usuarios.json" },
      { name: "reservas", file: "reservas.json" },
      { name: "resenas", file: "resenas.json" },
    ];

    for (const col of collections) {
      const filePath = path.join(datasetsDir, col.file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Archivo ${col.file} no encontrado en ${datasetsDir}`);
        continue;
      }

      const raw = fs.readFileSync(filePath, "utf-8");
      const docs = JSON.parse(raw);

      // Limpiar colección previa para evitar duplicados
      const collection = db.collection(col.name);
      await collection.deleteMany({});

      // Insertar documentos
      if (docs.length > 0) {
        // Normalizar _id si viene en formato Extended JSON { $oid: "..." }
        const cleanDocs = docs.map((doc) => {
          if (doc._id && doc._id.$oid) {
            return { ...doc, _id: doc._id.$oid };
          }
          return doc;
        });

        const res = await collection.insertMany(cleanDocs);
        console.log(`✓ Colección '${col.name.padEnd(10)}': ${res.insertedCount} documentos insertados.`);
      }
    }

    // Configuración de Índices
    console.log("\nConfigurando Índices de Rendimiento y Geoespaciales...");
    await db.collection("recintos").createIndex({ ubicacion: "2dsphere" });
    await db.collection("eventos").createIndex({ ubicacion: "2dsphere" });
    await db.collection("usuarios").createIndex({ email: 1 }, { unique: true });
    await db.collection("recintos").createIndex({ id_recinto: 1 }, { unique: true });
    await db.collection("eventos").createIndex({ id_evento: 1 }, { unique: true });
    await db.collection("recintos").createIndex({ nombre_local: "text", direccion: "text", sector: "text" });
    await db.collection("eventos").createIndex({ titulo: "text", descripcion: "text", categoria_musical: "text" });

    console.log("✓ Índices 2dsphere, unique y text creados exitosamente.\n");
    console.log("========================================================");
    console.log("  ¡Base de datos MongoDB lista y poblada al 100%!");
    console.log("========================================================");
  } catch (err) {
    console.error("❌ Error durante el seed de MongoDB:", err.message);
  } finally {
    await client.close();
  }
}

runSeed();
