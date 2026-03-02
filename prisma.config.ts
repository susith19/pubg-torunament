// prisma/prisma.config.ts
import "dotenv/config"; // loads .env automatically
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma", // or "./schema.prisma" if needed
  migrations: {
    path: "prisma/migrations",
    // seed: "ts-node prisma/seed.ts"   // uncomment if you have a seed script
  },
  datasource: {
    url: env("DATABASE_URL"), // pulls from your .env
    // shadowDatabaseUrl: env("SHADOW_DATABASE_URL"), // optional for migrate dev
  },
});