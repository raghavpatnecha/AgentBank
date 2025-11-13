/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.626Z
 * Endpoints: /v1/plans, /v1/plans/{plan}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 26
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/plans: <p>Returns a list of your plans.</p>
  test('GET /v1/plans - List all plans', async ({ request }) => {
    const endpoint = '/v1/plans';

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
    expect(body.url).toMatch(/^/v1/plans/);
  });

  // Happy path test for POST /v1/plans: <p>You can now model subscriptions more flexibly using the <a href="#prices">Prices API</a>. It replaces the Plans API and is backwards compatible to simplify your migration.</p>
  test('POST /v1/plans - Create a plan', async ({ request }) => {
    const endpoint = '/v1/plans';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/plans/{plan}: <p>Retrieves the plan with the given ID.</p>
  test('GET /v1/plans/{plan} - Retrieve a plan', async ({ request }) => {
    const endpoint = '/v1/plans/Agnosco utroque aveho speculum claro modi audacia anser tabesco.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/plans/{plan}: <p>Updates the specified plan by setting the values of the parameters passed. Any parameters not provided are left unchanged. By design, you cannot change a plan’s ID, amount, currency, or billing cycle.</p>
  test('POST /v1/plans/{plan} - Update a plan', async ({ request }) => {
    const endpoint = '/v1/plans/Eligendi apparatus sulum distinctio.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/plans/{plan}: <p>Deleting plans means new subscribers can’t be added. Existing subscribers aren’t affected.</p>
  test('DELETE /v1/plans/{plan} - Delete a plan', async ({ request }) => {
    const endpoint = '/v1/plans/Votum victus vix ancilla balbus cado similique terra veritatis.';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/plans - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/plans';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/plans - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/plans';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/plans - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/plans';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/plans - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/plans';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/plans - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/plans';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/plans - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/plans';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'plan' returns 400
  test('GET /v1/plans/{plan} - missing required parameter 'plan' (400)', async ({ request }) => {
    const endpoint = '/v1/plans/{plan}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/plans/{plan} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/plans/{plan}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/plans/{plan} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/plans/{plan}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/plans/{plan} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/plans/{plan}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent plan returns 404
  test('GET /v1/plans/{plan} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/plans/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'plan' returns 400
  test('POST /v1/plans/{plan} - missing required parameter 'plan' (400)', async ({ request }) => {
    const endpoint = '/v1/plans/{plan}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/plans/{plan} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/plans/{plan}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/plans/{plan} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/plans/{plan}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/plans/{plan} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/plans/{plan}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent plan returns 404
  test('POST /v1/plans/{plan} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/plans/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'plan' returns 400
  test('DELETE /v1/plans/{plan} - missing required parameter 'plan' (400)', async ({ request }) => {
    const endpoint = '/v1/plans/{plan}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/plans/{plan} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/plans/{plan}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/plans/{plan} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/plans/{plan}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/plans/{plan} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/plans/{plan}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent plan returns 404
  test('DELETE /v1/plans/{plan} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/plans/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});