const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

// Ensure connection string exists
if (!connectionString || connectionString.includes('password@localhost')) {
  console.error("WARNING: DATABASE_URL is not correctly set. Please update .env with your Supabase URI.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
