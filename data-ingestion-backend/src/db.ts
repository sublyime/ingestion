import sql, { ConnectionPool } from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE!,
  port: Number(process.env.DB_PORT),
  options: {
    encrypt: false,
    enableArithAbort: true,
  },
};

let pool: ConnectionPool | null = null;

export async function getPool(): Promise<ConnectionPool> {
  if (pool) {
    return pool;
  }
  pool = await sql.connect(config);
  return pool;
}

export { sql };
