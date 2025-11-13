/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.638Z
 * Endpoints: /v1/treasury/credit_reversals, /v1/treasury/credit_reversals/{credit_reversal}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 15
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/treasury/credit_reversals: <p>Returns a list of CreditReversals.</p>
  test('GET /v1/treasury/credit_reversals - List all CreditReversals', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals';

    const response = await request.get(endpoint, {
      params: {,
          financial_account: "Ciminatio temporibus cunctatio voluntarius termina",
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
  });

  // Happy path test for POST /v1/treasury/credit_reversals: <p>Reverses a ReceivedCredit and creates a CreditReversal object.</p>
  test('POST /v1/treasury/credit_reversals - Create a CreditReversal', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/treasury/credit_reversals/{credit_reversal}: <p>Retrieves the details of an existing CreditReversal by passing the unique CreditReversal ID from either the CreditReversal creation request or CreditReversal list</p>
  test('GET /v1/treasury/credit_reversals/{credit_reversal} - Retrieve a CreditReversal', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals/Curiositas vomica vir stella fuga altus accedo utrimque cattus.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'financial_account' returns 400
  test('GET /v1/treasury/credit_reversals - missing required parameter 'financial_account' (400)', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/treasury/credit_reversals - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/treasury/credit_reversals - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/treasury/credit_reversals - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/treasury/credit_reversals - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/treasury/credit_reversals - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/treasury/credit_reversals - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'credit_reversal' returns 400
  test('GET /v1/treasury/credit_reversals/{credit_reversal} - missing required parameter 'credit_reversal' (400)', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals/{credit_reversal}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/treasury/credit_reversals/{credit_reversal} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals/{credit_reversal}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/treasury/credit_reversals/{credit_reversal} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals/{credit_reversal}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/treasury/credit_reversals/{credit_reversal} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals/{credit_reversal}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent credit_reversal returns 404
  test('GET /v1/treasury/credit_reversals/{credit_reversal} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/treasury/credit_reversals/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});