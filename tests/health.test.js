/**
 * Health Check Tests
 * Example Jest tests for the API
 */

import request from 'supertest';
import app from '../src/app.js';

describe('Health Check Endpoint', () => {
  test('GET /api/health should return 200 OK', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('status');
    expect(response.body.data.status).toBe('healthy');
  });
  
  test('Health response should have required fields', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.body.data).toHaveProperty('status');
    expect(response.body.data).toHaveProperty('timestamp');
    expect(response.body.data).toHaveProperty('service');
    expect(response.body.data).toHaveProperty('uptime');
  });
  
  test('Should include correlation ID in response headers', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.headers).toHaveProperty('x-correlation-id');
  });
});

describe('404 Not Found', () => {
  test('GET /api/nonexistent should return 404', async () => {
    const response = await request(app).get('/api/nonexistent');
    
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});

// Note: For complete testing, you would add:
// - Authentication tests
// - Student registration/login tests
// - Counselor registration/login tests
// - Appointment creation tests
// - AI query tests
// - Integration tests with test database
// - Mock external dependencies (Azure OpenAI, Key Vault)
