/**
 * Configuration Management
 * Centralized configuration using environment variables
 */

import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 8080,
  
  // Database
  database: {
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
      encrypt: process.env.SQL_ENCRYPT === 'true',
      trustServerCertificate: process.env.SQL_TRUST_SERVER_CERTIFICATE === 'true'
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // Azure OpenAI
  openai: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2023-05-15',
    cacheTTL: parseInt(process.env.AI_CACHE_TTL_MINUTES) || 10
  },
  
  // Azure Key Vault
  keyVault: {
    name: process.env.AZURE_KEY_VAULT_NAME,
    enabled: !!process.env.AZURE_KEY_VAULT_NAME
  },
  
  // Application Insights
  appInsights: {
    connectionString: process.env.APPINSIGHTS_CONNECTION_STRING,
    instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    ai: {
      windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MINUTES) * 60000 || 900000,
      max: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS) || 20
    }
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  },
  
  // Bcrypt
  bcrypt: {
    saltRounds: 10
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  }
};

// Validate required configuration
export function validateConfig() {
  const required = [
    'database.server',
    'database.database',
    'database.user',
    'jwt.secret'
  ];
  
  const missing = [];
  
  for (const key of required) {
    const keys = key.split('.');
    let value = config;
    for (const k of keys) {
      value = value?.[k];
    }
    if (!value) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
}

export default config;
