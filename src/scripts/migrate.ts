/* eslint-disable @typescript-eslint/no-unused-vars */
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

function log(message: string) {
  console.log(message);
  try {
    fs.appendFileSync(
      path.join(__dirname, '../../migration.log'),
      message + '\n',
    );
  } catch (e) {
    // ignore
  }
}

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    log('Connecting to database...');
    log(
      'DB URL: ' +
        (process.env.DATABASE_URL
          ? 'Defined: ' + process.env.DATABASE_URL
          : 'Undefined'),
    );
    const client = await pool.connect();
    log('Connected successfully.');

    const migrationsDir = path.join(__dirname, '../../database/migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      log(`Migrating: ${file}`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
      log(`✅ Success: ${file}`);
    }

    client.release();
    log('🎉 Migration completed successfully');
    process.exit(0);
  } catch (err) {
    log('❌ Migration failed: ' + err);
    process.exit(1);
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
