/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.639Z
 * Endpoints: /v1/treasury/outbound_payments, /v1/treasury/outbound_payments/{id}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 15
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/treasury/outbound_payments: <p>Returns a list of OutboundPayments sent from the specified FinancialAccount.</p>
  test('GET /v1/treasury/outbound_payments - List all OutboundPayments', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments';

    const response = await request.get(endpoint, {
      params: {,
          financial_account: "Adaugeo appono voluptates.",
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
    expect(body.url).toMatch(/^/v1/treasury/outbound_payments/);
  });

  // Happy path test for POST /v1/treasury/outbound_payments: <p>Creates an OutboundPayment.</p>
  test('POST /v1/treasury/outbound_payments - Create an OutboundPayment', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/treasury/outbound_payments/{id}: <p>Retrieves the details of an existing OutboundPayment by passing the unique OutboundPayment ID from either the OutboundPayment creation request or OutboundPayment list.</p>
  test('GET /v1/treasury/outbound_payments/{id} - Retrieve an OutboundPayment', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments/Aro voluptatibus velum viriliter averto cenaculum absens vir adfectus sublime.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'financial_account' returns 400
  test('GET /v1/treasury/outbound_payments - missing required parameter 'financial_account' (400)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/treasury/outbound_payments - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/treasury/outbound_payments - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/treasury/outbound_payments - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/treasury/outbound_payments - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/treasury/outbound_payments - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/treasury/outbound_payments - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'id' returns 400
  test('GET /v1/treasury/outbound_payments/{id} - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/treasury/outbound_payments/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/treasury/outbound_payments/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/treasury/outbound_payments/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('GET /v1/treasury/outbound_payments/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_payments/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});