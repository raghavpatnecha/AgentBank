/**
 * Generated API Tests
 * Generated at: 2025-11-12T14:48:50.874Z
 * Endpoints: /users, /users/{userId}
 * Tags: users
 * Test count: 5
 */

import { test, expect } from '@playwright/test';

test.describe('users API', () => {

  // Happy path test for GET /users: Retrieve a paginated list of users
  test('GET /users - List all users', async ({ request }) => {
    const endpoint = '/users';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();

    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
    // Validate field types and formats
    if (body.users !== undefined) {
      expect(Array.isArray(body.users)).toBe(true);
      // Validate array response
      expect(Array.isArray(body.users)).toBe(true);
      // Validate array items
      if (body.users.length > 0) {
        expect(typeof body.users[0]).toBe('object');
        expect(body.users[0]).not.toBeNull();
        // Validate required fields
        expect(body.users[0]).toHaveProperty('id');
        expect(body.users[0]).toHaveProperty('email');
        expect(body.users[0]).toHaveProperty('name');
        // Validate field types and formats
        expect(typeof body.users[0].id).toBe('string');
        expect(body.users[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        expect(typeof body.users[0].email).toBe('string');
        expect(body.users[0].email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        expect(typeof body.users[0].name).toBe('string');
        expect(body.users[0].name.length).toBeGreaterThanOrEqual(1);
        expect(body.users[0].name.length).toBeLessThanOrEqual(100);
        if (body.users[0].age !== undefined) {
          expect(typeof body.users[0].age).toBe('number');
          expect(body.users[0].age).toBeGreaterThanOrEqual(0);
          expect(body.users[0].age).toBeLessThanOrEqual(150);
        }
        if (body.users[0].role !== undefined) {
          expect(typeof body.users[0].role).toBe('string');
          expect(["admin", "user", "guest"]).toContain(body.users[0].role);
        }
        if (body.users[0].createdAt !== undefined) {
          expect(typeof body.users[0].createdAt).toBe('string');
          expect(body.users[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        }
        if (body.users[0].updatedAt !== undefined) {
          expect(typeof body.users[0].updatedAt).toBe('string');
          expect(body.users[0].updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        }
      }
    }
    if (body.total !== undefined) {
      expect(typeof body.total).toBe('number');
    }
    if (body.limit !== undefined) {
      expect(typeof body.limit).toBe('number');
    }
    if (body.offset !== undefined) {
      expect(typeof body.offset).toBe('number');
    }
  });

  // Happy path test for POST /users: Create a new user
  test('POST /users - Create a new user', async ({ request }) => {
    const endpoint = '/users';

    const response = await request.post(endpoint, {
      data: {
        "email": "Estel.Altenwerth24@yahoo.com",
        "name": "Pecto corroboro timor arguo demonstro crustulum colo ager esse.",
        "age": 133
      }
    });

    // Validate response status
    expect(response.status()).toBe(201);

    // Validate response body
    const body = await response.json();

    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
    // Validate required fields
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email');
    expect(body).toHaveProperty('name');
    // Validate field types and formats
    expect(typeof body.id).toBe('string');
    expect(body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(typeof body.email).toBe('string');
    expect(body.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(typeof body.name).toBe('string');
    expect(body.name.length).toBeGreaterThanOrEqual(1);
    expect(body.name.length).toBeLessThanOrEqual(100);
    if (body.age !== undefined) {
      expect(typeof body.age).toBe('number');
      expect(body.age).toBeGreaterThanOrEqual(0);
      expect(body.age).toBeLessThanOrEqual(150);
    }
    if (body.role !== undefined) {
      expect(typeof body.role).toBe('string');
      expect(["admin", "user", "guest"]).toContain(body.role);
    }
    if (body.createdAt !== undefined) {
      expect(typeof body.createdAt).toBe('string');
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
    if (body.updatedAt !== undefined) {
      expect(typeof body.updatedAt).toBe('string');
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
  });

  // Happy path test for GET /users/{userId}: Get user by ID
  test('GET /users/{userId} - Get user by ID', async ({ request }) => {
    const endpoint = '/users/d28fa921-e37a-42b8-a3e3-56a7c41f2573';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();

    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
    // Validate required fields
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email');
    expect(body).toHaveProperty('name');
    // Validate field types and formats
    expect(typeof body.id).toBe('string');
    expect(body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(typeof body.email).toBe('string');
    expect(body.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(typeof body.name).toBe('string');
    expect(body.name.length).toBeGreaterThanOrEqual(1);
    expect(body.name.length).toBeLessThanOrEqual(100);
    if (body.age !== undefined) {
      expect(typeof body.age).toBe('number');
      expect(body.age).toBeGreaterThanOrEqual(0);
      expect(body.age).toBeLessThanOrEqual(150);
    }
    if (body.role !== undefined) {
      expect(typeof body.role).toBe('string');
      expect(["admin", "user", "guest"]).toContain(body.role);
    }
    if (body.createdAt !== undefined) {
      expect(typeof body.createdAt).toBe('string');
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
    if (body.updatedAt !== undefined) {
      expect(typeof body.updatedAt).toBe('string');
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
  });

  // Happy path test for PUT /users/{userId}: Update user
  test('PUT /users/{userId} - Update user', async ({ request }) => {
    const endpoint = '/users/cfac48df-8a56-4b51-b908-63ab00ee9579';

    const response = await request.put(endpoint, {
      data: {
        "email": "Armando.Miller87@gmail.com",
        "name": "Acquiro admitto enim ocer celer.",
        "age": 71,
        "role": "guest"
      }
    });

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();

    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
    // Validate required fields
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email');
    expect(body).toHaveProperty('name');
    // Validate field types and formats
    expect(typeof body.id).toBe('string');
    expect(body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(typeof body.email).toBe('string');
    expect(body.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(typeof body.name).toBe('string');
    expect(body.name.length).toBeGreaterThanOrEqual(1);
    expect(body.name.length).toBeLessThanOrEqual(100);
    if (body.age !== undefined) {
      expect(typeof body.age).toBe('number');
      expect(body.age).toBeGreaterThanOrEqual(0);
      expect(body.age).toBeLessThanOrEqual(150);
    }
    if (body.role !== undefined) {
      expect(typeof body.role).toBe('string');
      expect(["admin", "user", "guest"]).toContain(body.role);
    }
    if (body.createdAt !== undefined) {
      expect(typeof body.createdAt).toBe('string');
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
    if (body.updatedAt !== undefined) {
      expect(typeof body.updatedAt).toBe('string');
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
  });

  // Happy path test for DELETE /users/{userId}: Delete user
  test('DELETE /users/{userId} - Delete user', async ({ request }) => {
    const endpoint = '/users/d176275b-127b-4a1c-bce8-b999faaa7e2c';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(204);

  });
});