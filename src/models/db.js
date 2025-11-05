/**
 * Database Connection Pool
 * Azure SQL connection with retry logic and performance monitoring
 */

import sql from 'mssql';
import config from '../config.js';
import logger from '../utils/logger.js';
import { getSecret } from '../utils/keyVaultClient.js';

let pool = null;
let isConnected = false;

/**
 * Initialize database connection pool
 */
export async function initializeDatabase() {
  try {
    // Get SQL password from Key Vault or environment
    const sqlPassword = await getSecret('SQL-PASSWORD', 'SQL_PASSWORD');
    
    if (!sqlPassword) {
      throw new Error('SQL_PASSWORD not found in Key Vault or environment');
    }
    
    const dbConfig = {
      ...config.database,
      password: sqlPassword
    };
    
    logger.info('Connecting to database...', {
      server: dbConfig.server,
      database: dbConfig.database
    });
    
    pool = await sql.connect(dbConfig);
    isConnected = true;
    
    logger.info('✅ Database connected successfully');
    
    // Test connection
    await pool.request().query('SELECT 1 as test');
    logger.info('✅ Database connection verified');
    
    return pool;
  } catch (error) {
    logger.error('❌ Database connection failed', {
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

/**
 * Get database pool instance
 * @returns {Promise<sql.ConnectionPool>}
 */
export async function getPool() {
  if (!pool || !isConnected) {
    await initializeDatabase();
  }
  return pool;
}

/**
 * Execute query with performance monitoring
 * @param {string} query - SQL query
 * @param {object} params - Query parameters
 * @returns {Promise<object>} Query result
 */
export async function executeQuery(query, params = {}) {
  const startTime = Date.now();
  
  try {
    const dbPool = await getPool();
    const request = dbPool.request();
    
    // Add parameters
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        // Value is [type, value] tuple
        request.input(key, value[0], value[1]);
      } else {
        // Value is just the value, let mssql infer type
        request.input(key, value);
      }
    }
    
    const result = await request.query(query);
    const duration = Date.now() - startTime;
    
    // Log slow queries
    if (duration > 500) {
      logger.warn('Slow query detected', {
        query: query.substring(0, 100),
        duration,
        params: Object.keys(params)
      });
    }
    
    logger.debug('Query executed', { duration, rows: result.recordset?.length });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Query execution failed', {
      error: error.message,
      query: query.substring(0, 100),
      duration
    });
    throw error;
  }
}

/**
 * Execute stored procedure with performance monitoring
 * @param {string} procedureName - Stored procedure name
 * @param {object} params - Procedure parameters
 * @returns {Promise<object>} Procedure result
 */
export async function executeProcedure(procedureName, params = {}) {
  const startTime = Date.now();
  
  try {
    const dbPool = await getPool();
    const request = dbPool.request();
    
    // Add parameters
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        // Handle array type [sqlType, value]
        request.input(key, value[0], value[1]);
      } else {
        request.input(key, value);
      }
    }
    
    const result = await request.execute(procedureName);
    const duration = Date.now() - startTime;
    
    logger.debug('Stored procedure executed', {
      procedure: procedureName,
      duration,
      rows: result.recordset?.length
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Stored procedure execution failed', {
      error: error.message,
      procedure: procedureName,
      duration
    });
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (pool) {
    try {
      await pool.close();
      isConnected = false;
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection', { error: error.message });
    }
  }
}

/**
 * Check database connection status
 * @returns {boolean}
 */
export function isDbConnected() {
  return isConnected && pool && pool.connected;
}

// Export sql types for use in queries
export { sql };

export default {
  initializeDatabase,
  getPool,
  executeQuery,
  executeProcedure,
  closeDatabase,
  isDbConnected,
  sql
};
