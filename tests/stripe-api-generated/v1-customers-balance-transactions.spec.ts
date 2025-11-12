/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.613Z
 * Endpoints: /v1/customers/{customer}/balance_transactions, /v1/customers/{customer}/balance_transactions/{transaction}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 24
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/customers/{customer}/balance_transactions: <p>Returns a list of transactions that updated the customer’s <a href="/docs/billing/customer/balance">balances</a>.</p>
  test('GET /v1/customers/{customer}/balance_transactions - List customer balance transactions', async ({ request }) => {
    const endpoint = '/v1/customers/Cariosus antea accusamus vos ratione arceo solio./balance_transactions';

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
  });

  // Happy path test for POST /v1/customers/{customer}/balance_transactions: <p>Creates an immutable transaction that updates the customer’s credit <a href="/docs/billing/customer/balance">balance</a>.</p>
  test('POST /v1/customers/{customer}/balance_transactions - Create a customer balance transaction', async ({ request }) => {
    const endpoint = '/v1/customers/Termes id clamo vulgo subseco illo addo./balance_transactions';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/customers/{customer}/balance_transactions/{transaction}: <p>Retrieves a specific customer balance transaction that updated the customer’s <a href="/docs/billing/customer/balance">balances</a>.</p>
  test('GET /v1/customers/{customer}/balance_transactions/{transaction} - Retrieve a customer balance transaction', async ({ request }) => {
    const endpoint = '/v1/customers/Candidus bene similique inflammatio./balance_transactions/Candidus adsidue aer esse desidero aspicio attonbi';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/customers/{customer}/balance_transactions/{transaction}: <p>Most credit balance transaction fields are immutable, but you may update its <code>description</code> and <code>metadata</code>.</p>
  test('POST /v1/customers/{customer}/balance_transactions/{transaction} - Update a customer credit balance transaction', async ({ request }) => {
    const endpoint = '/v1/customers/Cinis tutis canonicus cenaculum accendo./balance_transactions/Cometes turbo comes centum inflammatio.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'customer' returns 400
  test('GET /v1/customers/{customer}/balance_transactions - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/customers/{customer}/balance_transactions - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/customers/{customer}/balance_transactions - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/customers/{customer}/balance_transactions - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('GET /v1/customers/{customer}/balance_transactions - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/balance_transactions';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('POST /v1/customers/{customer}/balance_transactions - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/customers/{customer}/balance_transactions - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/customers/{customer}/balance_transactions - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/customers/{customer}/balance_transactions - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('POST /v1/customers/{customer}/balance_transactions - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/balance_transactions';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('GET /v1/customers/{customer}/balance_transactions/{transaction} - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions/{transaction}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/customers/{customer}/balance_transactions/{transaction} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions/{transaction}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/customers/{customer}/balance_transactions/{transaction} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions/{transaction}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/customers/{customer}/balance_transactions/{transaction} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions/{transaction}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('GET /v1/customers/{customer}/balance_transactions/{transaction} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/balance_transactions/{transaction}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('POST /v1/customers/{customer}/balance_transactions/{transaction} - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions/{transaction}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/customers/{customer}/balance_transactions/{transaction} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions/{transaction}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/customers/{customer}/balance_transactions/{transaction} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions/{transaction}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/customers/{customer}/balance_transactions/{transaction} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/balance_transactions/{transaction}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('POST /v1/customers/{customer}/balance_transactions/{transaction} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/balance_transactions/{transaction}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});