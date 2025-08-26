const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');

require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



// Database connection
let db;

async function connectDB() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4'
    });
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// API Routes

// Get all tables
app.get('/api/tables', async (req, res) => {
  try {
    const [rows] = await db.execute('SHOW TABLES');
    const tables = rows.map(row => Object.values(row)[0]);
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Get table structure
app.get('/api/tables/:tableName/structure', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }
    const [rows] = await db.execute(`DESCRIBE \`${tableName}\``);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching table structure:', error);
    res.status(500).json({ error: 'Failed to fetch table structure' });
  }
});

// Get records from a table with pagination
app.get('/api/tables/:tableName/records', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }
    const { page = 1, limit = 50, search = '', sortBy = 'ID', sortOrder = 'ASC' } = req.query;
    
    // Ensure we have valid numbers
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const offset = (pageNum - 1) * limitNum;
    
    // Build search condition
    let searchCondition = '';
    let searchParams = [];
    if (search && search.trim()) {
      try {
        // Get table structure to see what columns exist
        const [columns] = await db.execute(`DESCRIBE \`${tableName}\``);
        const columnNames = columns.map(col => col.Field);
        
        // Look for searchable columns
        const searchableColumns = columnNames.filter(name => 
          name.toLowerCase().includes('name') || 
          name.toLowerCase().includes('txt') ||
          name.toLowerCase().includes('title') ||
          name.toLowerCase().includes('description')
        );
        
        if (searchableColumns.length > 0) {
          const searchClauses = searchableColumns.map(col => `\`${col}\` LIKE ?`).join(' OR ');
          searchCondition = `WHERE ${searchClauses}`;
          searchParams = searchableColumns.map(() => `%${search}%`);
        } else {
          // If no searchable columns found, use a basic fallback
          searchCondition = `WHERE \`Name\` LIKE ? OR \`Txt\` LIKE ?`;
          searchParams = [`%${search}%`, `%${search}%`];
        }
      } catch (error) {
        console.error(`Error building search for ${tableName}:`, error);
        // Fallback to basic search
        searchCondition = `WHERE \`Name\` LIKE ? OR \`Txt\` LIKE ?`;
        searchParams = [`%${search}%`, `%${search}%`];
      }
    }
    
    // Get total count
    let countResult;
    if (searchParams.length > 0) {
      [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM \`${tableName}\` ${searchCondition}`,
        searchParams
      );
    } else {
      [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM \`${tableName}\` ${searchCondition}`
      );
    }
    const total = countResult[0].total;
    
    // Get records with proper parameterization
    let rows;
    if (searchParams.length > 0) {
      console.log('Search query:', `SELECT * FROM \`${tableName}\` ${searchCondition} ORDER BY \`${sortBy}\` ${sortOrder} LIMIT ${limitNum} OFFSET ${offset}`);
      console.log('Search params:', searchParams);
      [rows] = await db.execute(
        `SELECT * FROM \`${tableName}\` ${searchCondition} ORDER BY \`${sortBy}\` ${sortOrder} LIMIT ${limitNum} OFFSET ${offset}`,
        searchParams
      );
    } else {
      [rows] = await db.query(
        `SELECT * FROM \`${tableName}\` ${searchCondition} ORDER BY \`${sortBy}\` ${sortOrder} LIMIT ${limitNum} OFFSET ${offset}`
      );
    }
    
    res.json({
      records: rows,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        totalRecords: total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Get a single record by ID
app.get('/api/tables/:tableName/records/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params;
    
    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }
    const [rows] = await db.execute(
      `SELECT * FROM \`${tableName}\` WHERE ID = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// Update a record
app.put('/api/tables/:tableName/records/:id', async (req, res) => {
  try {
    const { tableName, id } = req.params;
    
    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }
    const updateData = req.body;
    
    // Remove ID from update data to prevent updating primary key
    delete updateData.ID;
    
    // Build dynamic UPDATE query
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const [result] = await db.execute(
      `UPDATE \`${tableName}\` SET ${setClause} WHERE ID = ?`,
      [...values, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    // Get updated record
    const [rows] = await db.execute(
      `SELECT * FROM \`${tableName}\` WHERE ID = ?`,
      [id]
    );
    
    res.json({
      message: 'Record updated successfully',
      record: rows[0]
    });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// Get table statistics
app.get('/api/tables/:tableName/stats', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }
    const [rows] = await db.execute(`SELECT COUNT(*) as total FROM \`${tableName}\``);
    const total = rows[0].total;
    
    // Get sample of unique values for key fields
    let nameSample = [];
    try {
      // First try to get the table structure to see what columns exist
              const [columns] = await db.execute(`DESCRIBE \`${tableName}\``);
      const columnNames = columns.map(col => col.Field);
      
      // Look for common name-like columns
      const nameColumns = columnNames.filter(name => 
        name.toLowerCase().includes('name') || 
        name.toLowerCase().includes('title') ||
        name.toLowerCase().includes('id')
      );
      
      if (nameColumns.length > 0) {
        const [sampleResult] = await db.execute(
          `SELECT DISTINCT \`${nameColumns[0]}\` FROM \`${tableName}\` WHERE \`${nameColumns[0]}\` IS NOT NULL LIMIT 10`
        );
        nameSample = sampleResult.map(row => row[nameColumns[0]]);
      }
    } catch (error) {
      console.error(`Error getting sample for ${tableName}:`, error);
      nameSample = [];
    }
    
    res.json({
      totalRecords: total,
      nameSample: nameSample
    });
  } catch (error) {
    console.error('Error fetching table stats:', error);
    res.status(500).json({ error: 'Failed to fetch table statistics' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Start server
async function startServer() {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

startServer().catch(console.error);
