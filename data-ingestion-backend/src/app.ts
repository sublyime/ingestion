import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv'; // Add this import
import { getPool } from './db';

// Load environment variables from .env file
dotenv.config(); // Add this line

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('API is up and running');
});

// Health check with database connection test
app.get('/health', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 as status');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      status: 'degraded', 
      database: 'disconnected',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Source Types endpoint with improved error handling
app.get('/source-types', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT id, name, description FROM source_types');
    res.json(result.recordset);
  } catch (error) {
    console.error('Failed to fetch source types:', error);
    
    // Type-safe error handling
    if (error instanceof Error) {
      // Provide a more specific error message
      if ('code' in error && (error.code === 'EINSTLOOKUP' || error.code === 'ELOGIN')) {
        res.status(503).json({ 
          error: 'Database connection unavailable',
          message: 'Please check database configuration and ensure SQL Server is running'
        });
      } else {
        res.status(500).json({ 
          error: 'Internal server error',
          message: 'Failed to retrieve source types'
        });
      }
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unknown error occurred'
      });
    }
  }
});

// Data Sources endpoint with improved error handling
app.get('/data-sources', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT id, name, source_type_id, is_active FROM data_sources');
    res.json(result.recordset);
  } catch (error) {
    console.error('Failed to fetch data sources:', error);
    
    // Type-safe error handling
    if (error instanceof Error) {
      if ('code' in error && (error.code === 'EINSTLOOKUP' || error.code === 'ELOGIN')) {
        res.status(503).json({ 
          error: 'Database connection unavailable',
          message: 'Please check database configuration and ensure SQL Server is running'
        });
      } else {
        res.status(500).json({ 
          error: 'Internal server error',
          message: 'Failed to retrieve data sources'
        });
      }
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unknown error occurred'
      });
    }
  }
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(port, () => {
  console.log(`Server started and listening on port ${port}`);
});