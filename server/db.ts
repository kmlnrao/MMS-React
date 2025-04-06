import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create a SQL connection
const sql = neon(process.env.DATABASE_URL);

// Create the database instance using drizzle
export const db = drizzle(sql);
