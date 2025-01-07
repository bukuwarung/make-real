import { env } from "../lib/env.mjs";
import { postgresConnectionString } from "@vercel/postgres";
  
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";


const runMigrate = async () => {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  
const connection = postgresConnectionString(env.DATABASE_URL);

const db = drizzle(connection);
  console.log("⏳ Running migrations...");

  const start = Date.now();

  await migrate(db, { migrationsFolder: 'lib/db/migrations' });

  const end = Date.now();

  console.log("✅ Migrations completed in", end - start, "ms");

  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});