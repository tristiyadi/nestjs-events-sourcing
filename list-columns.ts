import { Pool } from 'pg';
import 'dotenv/config';

async function listAllColumns() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/transaction_db',
  });

  try {
    console.log('Listing all columns in all tables...');
    const res = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, column_name;
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Error listing columns:', err);
  } finally {
    await pool.end();
  }
}

listAllColumns();
