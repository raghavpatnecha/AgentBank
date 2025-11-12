/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.615Z
 * Endpoints: /v1/disputes, /v1/disputes/{dispute}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 16
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/disputes: <p>Returns a list of your disputes.</p>
  test('GET /v1/disputes - List all disputes', async ({ request }) => {
    const endpoint = '/v1/disputes';

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
    expect(body.url).toMatch(/^/v1/disputes/);
  });

  // Happy path test for GET /v1/disputes/{dispute}: <p>Retrieves the dispute with the given ID.</p>
  test('GET /v1/disputes/{dispute} - Retrieve a dispute', async ({ request }) => {
    const endpoint = '/v1/disputes/Vitium comminor dolorum.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/disputes/{dispute}: <p>When you get a dispute, contacting your customer is always the best first step. If that doesn’t work, you can submit evidence to help us resolve the dispute in your favor. You can do this in your <a href="https://dashboard.stripe.com/disputes">dashboard</a>, but if you prefer, you can use the API to submit evidence programmatically.</p>

  <p>Depending on your dispute type, different evidence fields will give you a better chance of winning your dispute. To figure out which evidence fields to provide, see our <a href="/docs/disputes/categories">guide to dispute types</a>.</p>
  test('POST /v1/disputes/{dispute} - Update a dispute', async ({ request }) => {
    const endpoint = '/v1/disputes/Totus celer vapulus talus arbor truculenter.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/disputes - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/disputes';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/disputes - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/disputes';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/disputes - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/disputes';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'dispute' returns 400
  test('GET /v1/disputes/{dispute} - missing required parameter 'dispute' (400)', async ({ request }) => {
    const endpoint = '/v1/disputes/{dispute}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/disputes/{dispute} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/disputes/{dispute}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/disputes/{dispute} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/disputes/{dispute}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/disputes/{dispute} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/disputes/{dispute}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent dispute returns 404
  test('GET /v1/disputes/{dispute} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/disputes/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'dispute' returns 400
  test('POST /v1/disputes/{dispute} - missing required parameter 'dispute' (400)', async ({ request }) => {
    const endpoint = '/v1/disputes/{dispute}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/disputes/{dispute} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/disputes/{dispute}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/disputes/{dispute} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/disputes/{dispute}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/disputes/{dispute} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/disputes/{dispute}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent dispute returns 404
  test('POST /v1/disputes/{dispute} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/disputes/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});