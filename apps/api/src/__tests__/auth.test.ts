import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { config } from '../config/env'; // Import config to load env vars

// Generate a random email to avoid "User already exists" errors
const randomEmail = `test${Math.floor(Math.random() * 100000)}@example.com`;

describe('Auth API Integration Tests', () => {
  
  // ✅ FIX: Connect to the DB before running tests
  beforeAll(async () => {
    try {
      await mongoose.connect(config.mongoUri);
    } catch (error) {
      console.error("Test DB Connection Failed:", error);
      process.exit(1);
    }
  });

  // ✅ Clean up: Close connection after tests to prevent Jest from hanging
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('POST /api/v1/auth/register - Should register a new user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: randomEmail,
      password: 'password123',
    });

    // If this fails, it prints the error message from the backend
    if (res.statusCode !== 201) {
      console.error('Register Failed:', res.body);
    }

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });

  it('POST /api/v1/auth/login - Should login the user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: randomEmail,
      password: 'password123',
    });

    if (res.statusCode !== 200) {
      console.error('Login Failed:', res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});