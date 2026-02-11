import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function resetDb() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/transaction_db',
  });

  try {
    console.log('--- Resetting Database ---');

    // Drop tables if they exist
    const tables = [
      'transaction_read',
      'organization_balance',
      'card',
      'organization',
      'event_store',
    ];
    for (const table of tables) {
      await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
    console.log('Dropped existing tables.');

    const migrationsDir = path.resolve('database/migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`Running schema: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await pool.query(sql);
      console.log(`✅ Success: ${file}`);
    }

    console.log('🎉 Database reset and recreated successfully');
  } catch (err) {
    console.error('❌ Error resetting database:', err);
  } finally {
    await pool.end();
  }
}

resetDb().catch((err) => {
  console.error(err);
  process.exit(1);
});
