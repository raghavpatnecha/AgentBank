/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.625Z
 * Endpoints: /v1/payment_method_configurations, /v1/payment_method_configurations/{configuration}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/payment_method_configurations: <p>List payment method configurations</p>
  test('GET /v1/payment_method_configurations - List payment method configurations', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations';

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
    expect(body.url).toMatch(/^/v1/payment_method_configurations/);
  });

  // Happy path test for POST /v1/payment_method_configurations: <p>Creates a payment method configuration</p>
  test('POST /v1/payment_method_configurations - Create a payment method configuration', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/payment_method_configurations/{configuration}: <p>Retrieve payment method configuration</p>
  test('GET /v1/payment_method_configurations/{configuration} - Retrieve payment method configuration', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations/Corrumpo summa acsi ratione cito quo stips sono.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/payment_method_configurations/{configuration}: <p>Update payment method configuration</p>
  test('POST /v1/payment_method_configurations/{configuration} - Update payment method configuration', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations/Vigilo necessitatibus termes.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/payment_method_configurations - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/payment_method_configurations - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/payment_method_configurations - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_method_configurations - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_method_configurations - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_method_configurations - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'configuration' returns 400
  test('GET /v1/payment_method_configurations/{configuration} - missing required parameter 'configuration' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations/{configuration}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/payment_method_configurations/{configuration} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations/{configuration}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/payment_method_configurations/{configuration} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations/{configuration}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/payment_method_configurations/{configuration} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations/{configuration}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent configuration returns 404
  test('GET /v1/payment_method_configurations/{configuration} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'configuration' returns 400
  test('POST /v1/payment_method_configurations/{configuration} - missing required parameter 'configuration' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations/{configuration}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_method_configurations/{configuration} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations/{configuration}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_method_configurations/{configuration} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations/{configuration}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_method_configurations/{configuration} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations/{configuration}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent configuration returns 404
  test('POST /v1/payment_method_configurations/{configuration} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_method_configurations/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});