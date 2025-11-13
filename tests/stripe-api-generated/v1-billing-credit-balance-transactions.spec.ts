/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.609Z
 * Endpoints: /v1/billing/credit_balance_transactions, /v1/billing/credit_balance_transactions/{id}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 11
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/billing/credit_balance_transactions: <p>Retrieve a list of credit balance transactions.</p>
  test('GET /v1/billing/credit_balance_transactions - List credit balance transactions', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_transactions';

    const response = await request.get(endpoint, {
      params: {,
          customer: "Accedo casus antea incidunt.",
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
    expect(body.url).toMatch(/^/v1/billing/credit_grants/);
  });

  // Happy path test for GET /v1/billing/credit_balance_transactions/{id}: <p>Retrieves a credit balance transaction.</p>
  test('GET /v1/billing/credit_balance_transactions/{id} - Retrieve a credit balance transaction', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_transactions/Theca curtus ullus.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'customer' returns 400
  test('GET /v1/billing/credit_balance_transactions - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_transactions';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/billing/credit_balance_transactions - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_transactions';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/billing/credit_balance_transactions - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_transactions';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/billing/credit_balance_transactions - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_transactions';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'id' returns 400
  test('GET /v1/billing/credit_balance_transactions/{id} - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_transactions/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/billing/credit_balance_transactions/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_transactions/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/billing/credit_balance_transactions/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_transactions/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/billing/credit_balance_transactions/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_transactions/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('GET /v1/billing/credit_balance_transactions/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_transactions/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});