/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.640Z
 * Endpoints: /v1/webhook_endpoints, /v1/webhook_endpoints/{webhook_endpoint}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 26
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/webhook_endpoints: <p>Returns a list of your webhook endpoints.</p>
  test('GET /v1/webhook_endpoints - List all webhook endpoints', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints';

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
    expect(body.url).toMatch(/^/v1/webhook_endpoints/);
  });

  // Happy path test for POST /v1/webhook_endpoints: <p>A webhook endpoint must have a <code>url</code> and a list of <code>enabled_events</code>. You may optionally specify the Boolean <code>connect</code> parameter. If set to true, then a Connect webhook endpoint that notifies the specified <code>url</code> about events from all connected accounts is created; otherwise an account webhook endpoint that notifies the specified <code>url</code> only about events from your account is created. You can also create webhook endpoints in the <a href="https://dashboard.stripe.com/account/webhooks">webhooks settings</a> section of the Dashboard.</p>
  test('POST /v1/webhook_endpoints - Create a webhook endpoint', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/webhook_endpoints/{webhook_endpoint}: <p>Retrieves the webhook endpoint with the given ID.</p>
  test('GET /v1/webhook_endpoints/{webhook_endpoint} - Retrieve a webhook endpoint', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/Consequuntur bos confugo ex.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/webhook_endpoints/{webhook_endpoint}: <p>Updates the webhook endpoint. You may edit the <code>url</code>, the list of <code>enabled_events</code>, and the status of your endpoint.</p>
  test('POST /v1/webhook_endpoints/{webhook_endpoint} - Update a webhook endpoint', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/Ciminatio bellicus amet ducimus.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/webhook_endpoints/{webhook_endpoint}: <p>You can also delete webhook endpoints via the <a href="https://dashboard.stripe.com/account/webhooks">webhook endpoint management</a> page of the Stripe dashboard.</p>
  test('DELETE /v1/webhook_endpoints/{webhook_endpoint} - Delete a webhook endpoint', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/Repudiandae cupiditate tener.';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/webhook_endpoints - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/webhook_endpoints - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/webhook_endpoints - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/webhook_endpoints - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/webhook_endpoints - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/webhook_endpoints - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'webhook_endpoint' returns 400
  test('GET /v1/webhook_endpoints/{webhook_endpoint} - missing required parameter 'webhook_endpoint' (400)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/{webhook_endpoint}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/webhook_endpoints/{webhook_endpoint} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/{webhook_endpoint}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/webhook_endpoints/{webhook_endpoint} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/{webhook_endpoint}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/webhook_endpoints/{webhook_endpoint} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/{webhook_endpoint}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent webhook_endpoint returns 404
  test('GET /v1/webhook_endpoints/{webhook_endpoint} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'webhook_endpoint' returns 400
  test('POST /v1/webhook_endpoints/{webhook_endpoint} - missing required parameter 'webhook_endpoint' (400)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/{webhook_endpoint}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/webhook_endpoints/{webhook_endpoint} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/{webhook_endpoint}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/webhook_endpoints/{webhook_endpoint} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/{webhook_endpoint}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/webhook_endpoints/{webhook_endpoint} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/{webhook_endpoint}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent webhook_endpoint returns 404
  test('POST /v1/webhook_endpoints/{webhook_endpoint} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'webhook_endpoint' returns 400
  test('DELETE /v1/webhook_endpoints/{webhook_endpoint} - missing required parameter 'webhook_endpoint' (400)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/{webhook_endpoint}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/webhook_endpoints/{webhook_endpoint} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/{webhook_endpoint}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/webhook_endpoints/{webhook_endpoint} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/{webhook_endpoint}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/webhook_endpoints/{webhook_endpoint} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/{webhook_endpoint}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent webhook_endpoint returns 404
  test('DELETE /v1/webhook_endpoints/{webhook_endpoint} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/webhook_endpoints/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});