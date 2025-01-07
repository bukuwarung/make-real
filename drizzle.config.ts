import type { Config } from "drizzle-kit";
import { env } from "./app/lib/env.mjs";

export default {
  schema: "./app/lib/db/schema",
  dialect: "postgresql",
  out: "./app/lib/db/migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
  }
} satisfies Config;