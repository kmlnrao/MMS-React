import 'dotenv/config';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from './server/auth';
import { users } from './shared/schema';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function main() {
  // Make sure DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log('Connecting to database...');
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Run the tables setup script first
  console.log('Setting up database tables...');
  try {
    await execPromise('npx tsx setup-db-tables.ts');
  } catch (error) {
    console.error('Error running setup-db-tables.ts:', error);
  }

  // Create demo users for each role
  console.log('Creating demo users...');
  
  // First check if users already exist
  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length === 0) {
    // Create admin user
    const adminPassword = await hashPassword('admin123');
    await db.insert(users).values({
      username: 'admin',
      password: adminPassword,
      fullName: 'System Administrator',
      email: 'admin@hospital.org',
      role: 'admin'
    });
    
    // Create medical staff user
    const medicalPassword = await hashPassword('medical123');
    await db.insert(users).values({
      username: 'doctor',
      password: medicalPassword,
      fullName: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@hospital.org',
      role: 'medical_staff'
    });
    
    // Create mortuary staff user
    const mortuaryPassword = await hashPassword('mortuary123');
    await db.insert(users).values({
      username: 'mortuary',
      password: mortuaryPassword,
      fullName: 'Robert Martinez',
      email: 'robert.martinez@hospital.org',
      role: 'mortuary_staff'
    });
    
    console.log('Demo users created successfully');
    console.log('\nUse these credentials to log in:');
    console.log('Admin: username=admin, password=admin123');
    console.log('Medical Staff: username=doctor, password=medical123');
    console.log('Mortuary Staff: username=mortuary, password=mortuary123');
  } else {
    console.log(`${existingUsers.length} users already exist in the database`);
  }

  console.log('\nDatabase setup complete!');
}

main().catch(err => {
  console.error('Error setting up database:', err);
  process.exit(1);
});