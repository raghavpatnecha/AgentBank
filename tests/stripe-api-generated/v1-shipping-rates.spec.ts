/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.629Z
 * Endpoints: /v1/shipping_rates, /v1/shipping_rates/{shipping_rate_token}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/shipping_rates: <p>Returns a list of your shipping rates.</p>
  test('GET /v1/shipping_rates - List all shipping rates', async ({ request }) => {
    const endpoint = '/v1/shipping_rates';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();

    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
    // Validate required fields
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('has_more');
    expect(body).toHaveProperty('object');
    expect(body).toHaveProperty('url');
    // Validate field types and formats
    expect(Array.isArray(body.data)).toBe(true);
    // Validate array response
    expect(Array.isArray(body.data)).toBe(true);
    // Validate array items
    if (body.data.length > 0) {
    }
    expect(typeof body.has_more).toBe('boolean');
    expect(typeof body.object).toBe('string');
    expect(["list"]).toContain(body.object);
    expect(typeof body.url).toBe('string');
    expect(body.url.length).toBeLessThanOrEqual(5000);
    expect(body.url).toMatch(/^/v1/shipping_rates/);
  });

  // Happy path test for POST /v1/shipping_rates: <p>Creates a new shipping rate object.</p>
  test('POST /v1/shipping_rates - Create a shipping rate', async ({ request }) => {
    const endpoint = '/v1/shipping_rates';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/shipping_rates/{shipping_rate_token}: <p>Returns the shipping rate object with the given ID.</p>
  test('GET /v1/shipping_rates/{shipping_rate_token} - Retrieve a shipping rate', async ({ request }) => {
    const endpoint = '/v1/shipping_rates/Bellum conqueror tunc conitor supplanto.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/shipping_rates/{shipping_rate_token}: <p>Updates an existing shipping rate object.</p>
  test('POST /v1/shipping_rates/{shipping_rate_token} - Update a shipping rate', async ({ request }) => {
    const endpoint = '/v1/shipping_rates/Confido comis cohibeo.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/shipping_rates - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/shipping_rates - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/shipping_rates - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/shipping_rates - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/shipping_rates - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/shipping_rates - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'shipping_rate_token' returns 400
  test('GET /v1/shipping_rates/{shipping_rate_token} - missing required parameter 'shipping_rate_token' (400)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates/{shipping_rate_token}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/shipping_rates/{shipping_rate_token} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates/{shipping_rate_token}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/shipping_rates/{shipping_rate_token} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates/{shipping_rate_token}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/shipping_rates/{shipping_rate_token} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates/{shipping_rate_token}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent shipping_rate_token returns 404
  test('GET /v1/shipping_rates/{shipping_rate_token} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'shipping_rate_token' returns 400
  test('POST /v1/shipping_rates/{shipping_rate_token} - missing required parameter 'shipping_rate_token' (400)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates/{shipping_rate_token}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/shipping_rates/{shipping_rate_token} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates/{shipping_rate_token}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/shipping_rates/{shipping_rate_token} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates/{shipping_rate_token}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/shipping_rates/{shipping_rate_token} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates/{shipping_rate_token}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent shipping_rate_token returns 404
  test('POST /v1/shipping_rates/{shipping_rate_token} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/shipping_rates/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});