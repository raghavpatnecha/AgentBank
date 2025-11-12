/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.627Z
 * Endpoints: /v1/promotion_codes, /v1/promotion_codes/{promotion_code}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/promotion_codes: <p>Returns a list of your promotion codes.</p>
  test('GET /v1/promotion_codes - List all promotion codes', async ({ request }) => {
    const endpoint = '/v1/promotion_codes';

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
    expect(body.url).toMatch(/^/v1/promotion_codes/);
  });

  // Happy path test for POST /v1/promotion_codes: <p>A promotion code points to an underlying promotion. You can optionally restrict the code to a specific customer, redemption limit, and expiration date.</p>
  test('POST /v1/promotion_codes - Create a promotion code', async ({ request }) => {
    const endpoint = '/v1/promotion_codes';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/promotion_codes/{promotion_code}: <p>Retrieves the promotion code with the given ID. In order to retrieve a promotion code by the customer-facing <code>code</code> use <a href="/docs/api/promotion_codes/list">list</a> with the desired <code>code</code>.</p>
  test('GET /v1/promotion_codes/{promotion_code} - Retrieve a promotion code', async ({ request }) => {
    const endpoint = '/v1/promotion_codes/Ago averto statua nulla aeneus tribuo atque avaritia acsi.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/promotion_codes/{promotion_code}: <p>Updates the specified promotion code by setting the values of the parameters passed. Most fields are, by design, not editable.</p>
  test('POST /v1/promotion_codes/{promotion_code} - Update a promotion code', async ({ request }) => {
    const endpoint = '/v1/promotion_codes/Tepesco amicitia tener odio ademptio peccatus angelus cognomen viridis antepono.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/promotion_codes - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/promotion_codes - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/promotion_codes - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/promotion_codes - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/promotion_codes - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/promotion_codes - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'promotion_code' returns 400
  test('GET /v1/promotion_codes/{promotion_code} - missing required parameter 'promotion_code' (400)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes/{promotion_code}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/promotion_codes/{promotion_code} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes/{promotion_code}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/promotion_codes/{promotion_code} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes/{promotion_code}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/promotion_codes/{promotion_code} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes/{promotion_code}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent promotion_code returns 404
  test('GET /v1/promotion_codes/{promotion_code} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'promotion_code' returns 400
  test('POST /v1/promotion_codes/{promotion_code} - missing required parameter 'promotion_code' (400)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes/{promotion_code}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/promotion_codes/{promotion_code} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes/{promotion_code}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/promotion_codes/{promotion_code} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes/{promotion_code}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/promotion_codes/{promotion_code} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes/{promotion_code}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent promotion_code returns 404
  test('POST /v1/promotion_codes/{promotion_code} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/promotion_codes/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});