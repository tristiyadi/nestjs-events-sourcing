/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Pool } from 'pg';
import 'dotenv/config';

async function verify() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/transaction_db',
  });

  try {
    console.log('--- Connecting to Database ---');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(
      'Tables found:',
      tables.rows.map((r) => r.table_name).join(', '),
    );

    console.log('\n--- Checking event_store ---');
    const events = await pool.query('SELECT count(*) FROM event_store');
    console.log('Event Store Row Count:', events.rows[0].count);

    if (events.rows[0].count > 0) {
      const lastEvents = await pool.query(
        'SELECT event_name, aggregate_id, version FROM event_store ORDER BY version DESC LIMIT 5',
      );
      console.log('Last 5 events:');
      console.table(lastEvents.rows);
    }

    console.log('\n--- Checking transaction_read ---');
    const readModel = await pool.query(
      'SELECT * FROM transaction_read LIMIT 0',
    );
    console.log(
      'Columns in transaction_read:',
      readModel.fields.map((f) => f.name).join(', '),
    );
    const readModelCount = await pool.query(
      'SELECT count(*) FROM transaction_read',
    );
    console.log('Transaction Read Row Count:', readModelCount.rows[0].count);

    if (parseInt(readModelCount.rows[0].count) > 0) {
      const lastReads = await pool.query(
        'SELECT transaction_id, card_id, amount, status, version, updated_at FROM transaction_read LIMIT 5',
      );
      console.log('Last 5 transaction_read rows:');
      console.table(lastReads.rows);
    }

    console.log('\n--- Checking organization_balance ---');
    const orgs = await pool.query('SELECT * FROM organization_balance');
    console.table(orgs.rows);
  } catch (err) {
    console.error('Error verifying database:', err);
  } finally {
    await pool.end();
  }
}

verify();
