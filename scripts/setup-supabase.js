/**
 * Supabase Migration Script
 * 
 * Usage:
 * When you get your Supabase database connection string, run:
 * node scripts/setup-supabase.js "postgresql://postgres.xxxx:yourpassword@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const supabaseUrl = process.argv[2];

if (!supabaseUrl) {
  console.log("==========================================");
  console.log("⚠️ Supabase PostgreSQL Connection Setup Guide");
  console.log("==========================================");
  console.log("To connect your Supabase database, run:");
  console.log('node scripts/setup-supabase.js "<YOUR_SUPABASE_DATABASE_URL>"');
  console.log("\nExample:");
  console.log('node scripts/setup-supabase.js "postgresql://postgres.abcde:mypassword@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"');
  process.exit(0);
}

console.log("Connecting to Supabase PostgreSQL...");

// 1. Update .env
const envPath = path.join(__dirname, "../.env");
fs.writeFileSync(envPath, `DATABASE_URL="${supabaseUrl}"\nNODE_ENV="production"\n`);

// 2. Update schema.prisma provider to postgresql
const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
let schemaContent = fs.readFileSync(schemaPath, "utf-8");
schemaContent = schemaContent.replace('provider = "sqlite"', 'provider = "postgresql"');
schemaContent = schemaContent.replace('url      = "file:./dev.db"', 'url      = env("DATABASE_URL")');
fs.writeFileSync(schemaPath, schemaContent);

console.log("✓ Updated prisma/schema.prisma to PostgreSQL provider.");
console.log("✓ Updated .env with your Supabase URL.");

// 3. Push schema to Supabase & Run Seeder
try {
  console.log("Pushing database schema to Supabase...");
  execSync("cmd.exe /c npx prisma db push", {
    stdio: "inherit",
    env: { ...process.env, PATH: `C:\\Program Files\\nodejs;${process.env.PATH}` },
  });

  console.log("Seeding all 342 students, 29 batches, and 7,700+ attendance records to Supabase...");
  execSync("node scripts/seed-database.js", {
    stdio: "inherit",
    env: { ...process.env, PATH: `C:\\Program Files\\nodejs;${process.env.PATH}` },
  });

  console.log("==========================================");
  console.log("🎉 Successfully migrated to Supabase PostgreSQL!");
  console.log("==========================================");
} catch (error) {
  console.error("Migration error:", error.message);
}
