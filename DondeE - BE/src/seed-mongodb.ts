import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

async function runSeed() {
  const uri = process.env.MONGODB_URI ?? "mongodb+srv://brunodiazfer1998_db_user:R13BtQy6J4KaW3Np@dondee.sw1bs6d.mongodb.net/dondee_db?retryWrites=true&w=majority";
  const dbName = process.env.MONGODB_DBNAME ?? "dondee_db";

  console.log("Conectando a MongoDB Atlas...");
  console.log("URI destino:", uri.replace(/:([^:@]+)@/, ":****@"));

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

  try {
    await client.connect();
    console.log("Conexion exitosa a MongoDB Atlas!");

    const db = client.db(dbName);

    // Load JSON datasets
    const baseDir = path.resolve(process.cwd(), "..", "DondeE - BD", "nosql");
    const usuarios = JSON.parse(fs.readFileSync(path.join(baseDir, "usuarios.json"), "utf-8"));
    const recintos = JSON.parse(fs.readFileSync(path.join(baseDir, "recintos.json"), "utf-8"));
    const eventos = JSON.parse(fs.readFileSync(path.join(baseDir, "eventos.json"), "utf-8"));
    const reservas = JSON.parse(fs.readFileSync(path.join(baseDir, "reservas.json"), "utf-8"));

    // 1. Usuarios
    console.log(`Poblando coleccion 'usuarios' (${usuarios.length} docs)...`);
    await db.collection("usuarios").deleteMany({});
    await db.collection("usuarios").insertMany(usuarios);
    await db.collection("usuarios").createIndex({ email: 1 }, { unique: true });
    await db.collection("usuarios").createIndex({ id_usuario: 1 }, { unique: true });

    // 2. Recintos
    console.log(`Poblando coleccion 'recintos' (${recintos.length} docs)...`);
    await db.collection("recintos").deleteMany({});
    await db.collection("recintos").insertMany(recintos);
    await db.collection("recintos").createIndex({ ubicacion: "2dsphere" });
    await db.collection("recintos").createIndex({ id_recinto: 1 }, { unique: true });
    await db.collection("recintos").createIndex({
      nombre_local: "text",
      direccion: "text",
      sector: "text",
      ciudad: "text"
    });

    // 3. Eventos
    console.log(`Poblando coleccion 'eventos' (${eventos.length} docs)...`);
    await db.collection("eventos").deleteMany({});
    await db.collection("eventos").insertMany(eventos);
    await db.collection("eventos").createIndex({ ubicacion: "2dsphere" });
    await db.collection("eventos").createIndex({ id_evento: 1 }, { unique: true });
    await db.collection("eventos").createIndex({ id_recinto: 1 });
    await db.collection("eventos").createIndex({
      titulo: "text",
      descripcion: "text",
      categoria_musical: "text"
    });

    // 4. Reservas
    console.log(`Poblando coleccion 'reservas' (${reservas.length} docs)...`);
    await db.collection("reservas").deleteMany({});
    await db.collection("reservas").insertMany(reservas);
    await db.collection("reservas").createIndex({ id_reserva: 1 }, { unique: true });

    console.log("Seed completado exitosamente en MongoDB Atlas (dondee_db)");
  } catch (error: any) {
    console.error("Error al ejecutar Seed en MongoDB Atlas:", error.message);
    console.log("Nota: Si el puerto 27017 esta bloqueado por la red wifi actual o la IP no esta en la whitelist de Atlas, el backend de DondeE utiliza automaticamente los datasets JSON locales sin interrumpir el funcionamiento.");
  } finally {
    await client.close();
  }
}

runSeed();
