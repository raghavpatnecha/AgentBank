/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.609Z
 * Endpoints: /v1/balance/history, /v1/balance/history/{id}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 10
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/balance/history: <p>Returns a list of transactions that have contributed to the Stripe account balance (e.g., charges, transfers, and so forth). The transactions are returned in sorted order, with the most recent transactions appearing first.</p>

  <p>Note that this endpoint was previously called “Balance history” and used the path <code>/v1/balance/history</code>.</p>
  test('GET /v1/balance/history - List all balance transactions', async ({ request }) => {
    const endpoint = '/v1/balance/history';

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
    expect(body.url).toMatch(/^/v1/balance_transactions/);
  });

  // Happy path test for GET /v1/balance/history/{id}: <p>Retrieves the balance transaction with the given ID.</p>

  <p>Note that this endpoint previously used the path <code>/v1/balance/history/:id</code>.</p>
  test('GET /v1/balance/history/{id} - Retrieve a balance transaction', async ({ request }) => {
    const endpoint = '/v1/balance/history/Crapula thesis temptatio fugiat votum vociferor dedico pectus cupressus.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/balance/history - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/balance/history';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/balance/history - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/balance/history';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/balance/history - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/balance/history';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'id' returns 400
  test('GET /v1/balance/history/{id} - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/balance/history/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/balance/history/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/balance/history/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/balance/history/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/balance/history/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/balance/history/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/balance/history/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('GET /v1/balance/history/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/balance/history/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});