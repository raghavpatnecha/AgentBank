/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.631Z
 * Endpoints: /v1/tax/registrations, /v1/tax/registrations/{id}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/tax/registrations: <p>Returns a list of Tax <code>Registration</code> objects.</p>
  test('GET /v1/tax/registrations - List registrations', async ({ request }) => {
    const endpoint = '/v1/tax/registrations';

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
    expect(body.url).toMatch(/^/v1/tax/registrations/);
  });

  // Happy path test for POST /v1/tax/registrations: <p>Creates a new Tax <code>Registration</code> object.</p>
  test('POST /v1/tax/registrations - Create a registration', async ({ request }) => {
    const endpoint = '/v1/tax/registrations';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/tax/registrations/{id}: <p>Returns a Tax <code>Registration</code> object.</p>
  test('GET /v1/tax/registrations/{id} - Retrieve a registration', async ({ request }) => {
    const endpoint = '/v1/tax/registrations/Vulpes theologus vulgus adamo.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/tax/registrations/{id}: <p>Updates an existing Tax <code>Registration</code> object.</p>

  <p>A registration cannot be deleted after it has been created. If you wish to end a registration you may do so by setting <code>expires_at</code>.</p>
  test('POST /v1/tax/registrations/{id} - Update a registration', async ({ request }) => {
    const endpoint = '/v1/tax/registrations/Tendo viduo video arceo.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/tax/registrations - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/tax/registrations - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/tax/registrations - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/tax/registrations - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/tax/registrations - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/tax/registrations - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'id' returns 400
  test('GET /v1/tax/registrations/{id} - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/tax/registrations/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/tax/registrations/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/tax/registrations/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('GET /v1/tax/registrations/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'id' returns 400
  test('POST /v1/tax/registrations/{id} - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/tax/registrations/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/tax/registrations/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/tax/registrations/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('POST /v1/tax/registrations/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/tax/registrations/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});