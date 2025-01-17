import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  host: process.env.PGHOST || 'tender-tracking-db2.postgres.database.azure.com',
  user: process.env.PGUSER || 'abouefletouhm',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'postgres',
  password: process.env.PGPASSWORD,
  ssl: true
});

export const initDb = async () => {
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
  } finally {
    client.release();
  }
};

export const addEmployee = async (employee: {
  id: string;
  name: string;
  position: string;
  department: string;
  overtimeHours: number;
}) => {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO employees (id, name, position, department, overtime_hours) VALUES ($1, $2, $3, $4, $5)',
      [employee.id, employee.name, employee.position, employee.department, employee.overtimeHours]
    );
  } finally {
    client.release();
  }
};

export const getEmployees = async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM employees');
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      position: row.position,
      department: row.department,
      overtimeHours: row.overtime_hours
    }));
  } finally {
    client.release();
  }
};

export const updateEmployeeOvertime = async (id: string, hours: number) => {
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE employees SET overtime_hours = overtime_hours + $1 WHERE id = $2',
      [hours, id]
    );
  } finally {
    client.release();
  }
};