/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.619Z
 * Endpoints: /v1/financial_connections/transactions, /v1/financial_connections/transactions/{transaction}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 11
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/financial_connections/transactions: <p>Returns a list of Financial Connections <code>Transaction</code> objects.</p>
  test('GET /v1/financial_connections/transactions - List Transactions', async ({ request }) => {
    const endpoint = '/v1/financial_connections/transactions';

    const response = await request.get(endpoint, {
      params: {,
          account: "Cernuus argentum aeternus.",
      }
    });

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
    expect(body.url).toMatch(/^/v1/financial_connections/transactions/);
  });

  // Happy path test for GET /v1/financial_connections/transactions/{transaction}: <p>Retrieves the details of a Financial Connections <code>Transaction</code></p>
  test('GET /v1/financial_connections/transactions/{transaction} - Retrieve a Transaction', async ({ request }) => {
    const endpoint = '/v1/financial_connections/transactions/Adsum bene titulus sto.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'account' returns 400
  test('GET /v1/financial_connections/transactions - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/financial_connections/transactions';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/financial_connections/transactions - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/financial_connections/transactions';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/financial_connections/transactions - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/financial_connections/transactions';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/financial_connections/transactions - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/financial_connections/transactions';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'transaction' returns 400
  test('GET /v1/financial_connections/transactions/{transaction} - missing required parameter 'transaction' (400)', async ({ request }) => {
    const endpoint = '/v1/financial_connections/transactions/{transaction}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/financial_connections/transactions/{transaction} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/financial_connections/transactions/{transaction}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/financial_connections/transactions/{transaction} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/financial_connections/transactions/{transaction}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/financial_connections/transactions/{transaction} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/financial_connections/transactions/{transaction}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent transaction returns 404
  test('GET /v1/financial_connections/transactions/{transaction} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/financial_connections/transactions/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});