import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',          // your PostgreSQL username
  host: 'localhost',         // usually localhost
  database: 'school_portal', // your database name
  password: 'ibrahim123', // password for postgres user
  port: 5432                 // default PostgreSQL port
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Connected to PostgreSQL successfully!');
  }
  release();
});

export default pool;
