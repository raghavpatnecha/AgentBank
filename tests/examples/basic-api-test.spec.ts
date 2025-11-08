/**
 * Example: Basic API Testing with Playwright
 *
 * This file demonstrates how to use Playwright for API testing.
 * It shows:
 * - Using the request fixture for HTTP requests
 * - Making GET/POST/PUT/DELETE requests
 * - Assertions on response status, headers, and body
 * - Using environment variables for base URL
 * - Organizing tests with describe blocks
 *
 * Run with: npx playwright test tests/examples/basic-api-test.spec.ts
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable no-console */

import { test, expect } from '@playwright/test';

/**
 * Example API Tests
 *
 * These tests demonstrate best practices for API testing with Playwright.
 * In a real scenario, these would test actual API endpoints.
 */
test.describe('Basic API Testing Examples', () => {
  /**
   * Example 1: Simple GET request
   *
   * Demonstrates:
   * - Making a GET request
   * - Checking response status
   * - Validating response body structure
   */
  test('should make a successful GET request', async ({ request }) => {
    // Make GET request using the baseURL from playwright.config.ts
    const response = await request.get('/api/health');

    // Verify response status
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Verify response headers
    expect(response.headers()['content-type']).toContain('application/json');

    // Parse and verify response body
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('ok');
  });

  /**
   * Example 2: POST request with body
   *
   * Demonstrates:
   * - Sending JSON data in POST request
   * - Setting custom headers
   * - Validating created resource
   */
  test('should create a resource with POST', async ({ request }) => {
    const newResource = {
      name: 'Test Resource',
      description: 'Created by Playwright test',
      active: true,
    };

    const response = await request.post('/api/resources', {
      data: newResource,
      headers: {
        'Content-Type': 'application/json',
        // Add authentication header if needed
        // 'Authorization': `Bearer ${process.env.API_TOKEN}`,
      },
    });

    expect(response.status()).toBe(201); // Created

    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body.name).toBe(newResource.name);
  });

  /**
   * Example 3: Request with query parameters
   *
   * Demonstrates:
   * - Adding query parameters to requests
   * - Validating filtered/paginated responses
   */
  test('should filter resources with query parameters', async ({ request }) => {
    const response = await request.get('/api/resources', {
      params: {
        status: 'active',
        limit: 10,
        offset: 0,
      },
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(Array.isArray(body.items)).toBeTruthy();
    expect(body.items.length).toBeLessThanOrEqual(10);
  });

  /**
   * Example 4: Testing error responses
   *
   * Demonstrates:
   * - Validating error status codes
   * - Checking error response structure
   */
  test('should return 404 for non-existent resource', async ({ request }) => {
    const response = await request.get('/api/resources/non-existent-id');

    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(body.error).toContain('not found');
  });

  /**
   * Example 5: Testing authentication
   *
   * Demonstrates:
   * - Testing protected endpoints
   * - Using authentication tokens
   * - Validating unauthorized access
   */
  test('should require authentication for protected endpoints', async ({ request }) => {
    // Request without authentication
    const unauthResponse = await request.get('/api/admin/users');
    expect(unauthResponse.status()).toBe(401); // Unauthorized

    // Request with authentication
    const authResponse = await request.get('/api/admin/users', {
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN || 'test-token'}`,
      },
    });

    // If token is valid, should succeed; otherwise still 401
    expect([200, 401]).toContain(authResponse.status());
  });

  /**
   * Example 6: Full CRUD workflow
   *
   * Demonstrates:
   * - Complete Create, Read, Update, Delete cycle
   * - Maintaining state between test steps
   */
  test('should complete full CRUD workflow', async ({ request }) => {
    // Create
    const createData = { name: 'CRUD Test Item', value: 42 };
    const createResponse = await request.post('/api/items', { data: createData });
    expect(createResponse.status()).toBe(201);

    const created = await createResponse.json();
    const itemId = created.id;

    // Read
    const readResponse = await request.get(`/api/items/${itemId}`);
    expect(readResponse.ok()).toBeTruthy();
    const read = await readResponse.json();
    expect(read.name).toBe(createData.name);

    // Update
    const updateData = { name: 'Updated Name', value: 84 };
    const updateResponse = await request.put(`/api/items/${itemId}`, { data: updateData });
    expect(updateResponse.ok()).toBeTruthy();

    // Delete
    const deleteResponse = await request.delete(`/api/items/${itemId}`);
    expect(deleteResponse.ok()).toBeTruthy();

    // Verify deletion
    const verifyResponse = await request.get(`/api/items/${itemId}`);
    expect(verifyResponse.status()).toBe(404);
  });

  /**
   * Example 7: Testing with environment variables
   *
   * Demonstrates:
   * - Using environment variables from .env file
   * - Dynamic configuration in tests
   */
  test('should use environment variables', async ({ request }) => {
    // Base URL comes from playwright.config.ts which reads from .env
    console.log('Testing against:', process.env.API_BASE_URL || 'default URL');

    // You can also use other environment variables
    const apiKey = process.env.API_KEY;
    const headers: Record<string, string> = {};

    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const response = await request.get('/api/info', { headers });

    // This test is flexible - works with or without API key
    expect([200, 401]).toContain(response.status());
  });
});

/**
 * Example: Validation Tests
 *
 * These tests show how to validate request/response schemas
 */
test.describe('Schema Validation Examples', () => {
  test('should validate response schema', async ({ request }) => {
    const response = await request.get('/api/user/profile');

    if (response.ok()) {
      const user = await response.json();

      // Validate expected properties exist
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');

      // Validate property types
      expect(typeof user.id).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/); // Email format
    }
  });

  test('should reject invalid request body', async ({ request }) => {
    const invalidData = {
      // Missing required fields
      name: 'Test',
      // Invalid email format
      email: 'not-an-email',
    };

    const response = await request.post('/api/users', { data: invalidData });

    // Should return validation error
    expect(response.status()).toBe(400); // Bad Request

    const error = await response.json();
    expect(error).toHaveProperty('validation_errors');
  });
});
