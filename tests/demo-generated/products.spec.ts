/**
 * Generated API Tests
 * Generated at: 2025-11-12T14:48:50.875Z
 * Endpoints: /products
 * Tags: products
 * Test count: 1
 */

import { test, expect } from '@playwright/test';

test.describe('products API', () => {
  // Happy path test for GET /products: List all products
  test('GET /products - List all products', async ({ request }) => {
    const endpoint = '/products';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();

    // Validate array response
    expect(Array.isArray(body)).toBe(true);
    // Validate array items
    if (body.length > 0) {
      expect(typeof body[0]).toBe('object');
      expect(body[0]).not.toBeNull();
      // Validate required fields
      expect(body[0]).toHaveProperty('id');
      expect(body[0]).toHaveProperty('name');
      expect(body[0]).toHaveProperty('price');
      // Validate field types and formats
      expect(typeof body[0].id).toBe('string');
      expect(body[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(typeof body[0].name).toBe('string');
      if (body[0].description !== undefined) {
        expect(typeof body[0].description).toBe('string');
      }
      expect(typeof body[0].price).toBe('number');
      expect(body[0].price).toBeGreaterThanOrEqual(0);
      if (body[0].category !== undefined) {
        expect(typeof body[0].category).toBe('string');
      }
      if (body[0].inStock !== undefined) {
        expect(typeof body[0].inStock).toBe('boolean');
      }
    }
  });
});
