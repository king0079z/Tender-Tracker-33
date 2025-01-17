import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Get port from environment or use default
const port = process.env.PORT || 8080;

// Validate required environment variables
const requiredEnvVars = ['PGHOST', 'PGUSER', 'PGPORT', 'PGDATABASE', 'PGPASSWORD'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false // Required for Azure PostgreSQL
  }
});

// Health check endpoint for Azure
app.get('/health', (req, res) => {
  res.status(200).send('Healthy');
});

app.post('/api/init', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        overtime_hours INTEGER DEFAULT 0
      );
    `);
    res.json({ message: 'Database initialized' });
  } catch (err) {
    console.error('Database initialization error:', err);
    res.status(500).json({ error: 'Failed to initialize database' });
  } finally {
    client.release();
  }
});

app.get('/api/employees', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM employees');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  } finally {
    client.release();
  }
});

app.post('/api/employees', async (req, res) => {
  const { id, name, position, department, overtimeHours } = req.body;
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO employees (id, name, position, department, overtime_hours) VALUES ($1, $2, $3, $4, $5)',
      [id, name, position, department, overtimeHours]
    );
    res.json({ message: 'Employee added successfully' });
  } catch (err) {
    console.error('Error adding employee:', err);
    res.status(500).json({ error: 'Failed to add employee' });
  } finally {
    client.release();
  }
});

app.put('/api/employees/:id/overtime', async (req, res) => {
  const { id } = req.params;
  const { hours } = req.body;
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE employees SET overtime_hours = overtime_hours + $1 WHERE id = $2',
      [hours, id]
    );
    res.json({ message: 'Overtime hours updated successfully' });
  } catch (err) {
    console.error('Error updating overtime:', err);
    res.status(500).json({ error: 'Failed to update overtime hours' });
  } finally {
    client.release();
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});