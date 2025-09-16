import sql from 'mssql';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use defaults if environment variables are not set
const config = {
    server: process.env.DB_SERVER || '.\\SQLEXPRESS',
    database: process.env.DB_DATABASE || 'data123',
    user: process.env.DB_USER || 'data',
    password: process.env.DB_PASSWORD || 'ala1nna',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
};

export async function getPool() {
    try {
        const pool = await sql.connect(config);
        console.log('Database connected successfully');
        return pool;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
}