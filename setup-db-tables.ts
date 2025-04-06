import 'dotenv/config';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

async function main() {
  // Make sure DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log('Connecting to database...');
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Create tables one by one
  console.log('Creating tables...');
  
  try {
    // Users table
    console.log('Creating users table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "full_name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Deceased patients table
    console.log('Creating deceased_patients table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "deceased_patients" (
        "id" SERIAL PRIMARY KEY,
        "mr_number" VARCHAR(20) NOT NULL UNIQUE,
        "full_name" TEXT NOT NULL,
        "age" INTEGER NOT NULL,
        "gender" TEXT NOT NULL,
        "date_of_death" TIMESTAMP NOT NULL,
        "cause_of_death" TEXT NOT NULL,
        "ward_from" TEXT NOT NULL,
        "attending_physician" TEXT NOT NULL,
        "registration_date" TIMESTAMP NOT NULL DEFAULT NOW(),
        "registered_by_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "notes" TEXT,
        "status" TEXT NOT NULL,
        "documents" JSONB
      );
    `);
    
    // Storage units table
    console.log('Creating storage_units table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "storage_units" (
        "id" SERIAL PRIMARY KEY,
        "unit_number" VARCHAR(10) NOT NULL UNIQUE,
        "section" VARCHAR(5) NOT NULL,
        "temperature" INTEGER,
        "status" TEXT NOT NULL,
        "last_maintenance" TIMESTAMP,
        "notes" TEXT
      );
    `);
    
    // Storage assignments table
    console.log('Creating storage_assignments table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "storage_assignments" (
        "id" SERIAL PRIMARY KEY,
        "deceased_id" INTEGER NOT NULL UNIQUE REFERENCES "deceased_patients"("id") ON DELETE CASCADE,
        "storage_unit_id" INTEGER NOT NULL REFERENCES "storage_units"("id") ON DELETE RESTRICT,
        "assigned_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "assigned_by_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "release_date" TIMESTAMP,
        "status" TEXT NOT NULL
      );
    `);
    
    // Postmortems table
    console.log('Creating postmortems table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "postmortems" (
        "id" SERIAL PRIMARY KEY,
        "deceased_id" INTEGER NOT NULL UNIQUE REFERENCES "deceased_patients"("id") ON DELETE CASCADE,
        "scheduled_date" TIMESTAMP,
        "completed_date" TIMESTAMP,
        "assigned_to_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "findings" TEXT,
        "images" JSONB,
        "status" TEXT NOT NULL,
        "is_forensic" BOOLEAN NOT NULL DEFAULT FALSE,
        "notes" TEXT
      );
    `);
    
    // Body release requests table
    console.log('Creating body_release_requests table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "body_release_requests" (
        "id" SERIAL PRIMARY KEY,
        "deceased_id" INTEGER NOT NULL UNIQUE REFERENCES "deceased_patients"("id") ON DELETE CASCADE,
        "request_date" TIMESTAMP NOT NULL DEFAULT NOW(),
        "requested_by_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "next_of_kin_name" TEXT NOT NULL,
        "next_of_kin_relation" TEXT NOT NULL,
        "next_of_kin_contact" TEXT NOT NULL,
        "identity_verified" BOOLEAN NOT NULL DEFAULT FALSE,
        "approval_status" TEXT NOT NULL,
        "approved_by_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "approval_date" TIMESTAMP,
        "release_date" TIMESTAMP,
        "transferred_to" TEXT,
        "documents" JSONB,
        "notes" TEXT
      );
    `);
    
    // Tasks table
    console.log('Creating tasks table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "assigned_to_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "priority" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "due_date" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "completed_at" TIMESTAMP,
        "notes" TEXT,
        "related_entity_type" TEXT,
        "related_entity_id" INTEGER
      );
    `);
    
    // System alerts table
    console.log('Creating system_alerts table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "system_alerts" (
        "id" SERIAL PRIMARY KEY,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "severity" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "acknowledged_by_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "acknowledged_at" TIMESTAMP,
        "resolved_by_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
        "resolved_at" TIMESTAMP,
        "related_entity_type" TEXT,
        "related_entity_id" INTEGER
      );
    `);
    
    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

main().catch(err => {
  console.error('Error setting up database tables:', err);
  process.exit(1);
});