/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.610Z
 * Endpoints: /v1/charges, /v1/charges/{charge}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/charges: <p>Returns a list of charges you’ve previously created. The charges are returned in sorted order, with the most recent charges appearing first.</p>
  test('GET /v1/charges - List all charges', async ({ request }) => {
    const endpoint = '/v1/charges';

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
    expect(body.url).toMatch(/^/v1/charges/);
  });

  // Happy path test for POST /v1/charges: <p>This method is no longer recommended—use the <a href="/docs/api/payment_intents">Payment Intents API</a>
  to initiate a new payment instead. Confirmation of the PaymentIntent creates the <code>Charge</code>
  object used to request payment.</p>
  test('POST /v1/charges - charges', async ({ request }) => {
    const endpoint = '/v1/charges';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/charges/{charge}: <p>Retrieves the details of a charge that has previously been created. Supply the unique charge ID that was returned from your previous request, and Stripe will return the corresponding charge information. The same information is returned when creating or refunding the charge.</p>
  test('GET /v1/charges/{charge} - Retrieve a charge', async ({ request }) => {
    const endpoint = '/v1/charges/Perspiciatis ipsum usus deprecator sonitus.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/charges/{charge}: <p>Updates the specified charge by setting the values of the parameters passed. Any parameters not provided will be left unchanged.</p>
  test('POST /v1/charges/{charge} - Update a charge', async ({ request }) => {
    const endpoint = '/v1/charges/Tamisium arma laudantium coaegresco praesentium aqua.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/charges - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/charges';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/charges - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/charges';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/charges - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/charges';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/charges - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/charges';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/charges - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/charges';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/charges - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/charges';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'charge' returns 400
  test('GET /v1/charges/{charge} - missing required parameter 'charge' (400)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/charges/{charge} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/charges/{charge} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/charges/{charge} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent charge returns 404
  test('GET /v1/charges/{charge} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/charges/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'charge' returns 400
  test('POST /v1/charges/{charge} - missing required parameter 'charge' (400)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/charges/{charge} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/charges/{charge} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/charges/{charge} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent charge returns 404
  test('POST /v1/charges/{charge} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/charges/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});