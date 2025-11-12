/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.611Z
 * Endpoints: /v1/checkout/sessions, /v1/checkout/sessions/{session}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/checkout/sessions: <p>Returns a list of Checkout Sessions.</p>
  test('GET /v1/checkout/sessions - List all Checkout Sessions', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions';

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

  // Happy path test for POST /v1/checkout/sessions: <p>Creates a Checkout Session object.</p>
  test('POST /v1/checkout/sessions - Create a Checkout Session', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/checkout/sessions/{session}: <p>Retrieves a Checkout Session object.</p>
  test('GET /v1/checkout/sessions/{session} - Retrieve a Checkout Session', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/Vomito eius sapiente odit.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/checkout/sessions/{session}: <p>Updates a Checkout Session object.</p>

  <p>Related guide: <a href="/payments/checkout/dynamic-updates">Dynamically update Checkout</a></p>
  test('POST /v1/checkout/sessions/{session} - Update a Checkout Session', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/Admiratio vulgus ustilo aliquid.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/checkout/sessions - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/checkout/sessions - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/checkout/sessions - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/checkout/sessions - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/checkout/sessions - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/checkout/sessions - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'session' returns 400
  test('GET /v1/checkout/sessions/{session} - missing required parameter 'session' (400)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/{session}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/checkout/sessions/{session} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/{session}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/checkout/sessions/{session} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/{session}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/checkout/sessions/{session} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/{session}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent session returns 404
  test('GET /v1/checkout/sessions/{session} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'session' returns 400
  test('POST /v1/checkout/sessions/{session} - missing required parameter 'session' (400)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/{session}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/checkout/sessions/{session} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/{session}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/checkout/sessions/{session} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/{session}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/checkout/sessions/{session} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/{session}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent session returns 404
  test('POST /v1/checkout/sessions/{session} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});