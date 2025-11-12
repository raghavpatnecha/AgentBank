/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.622Z
 * Endpoints: /v1/issuing/authorizations, /v1/issuing/authorizations/{authorization}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 16
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/issuing/authorizations: <p>Returns a list of Issuing <code>Authorization</code> objects. The objects are sorted in descending order by creation date, with the most recently created object appearing first.</p>
  test('GET /v1/issuing/authorizations - List all authorizations', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations';

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
    expect(body.url).toMatch(/^/v1/issuing/authorizations/);
  });

  // Happy path test for GET /v1/issuing/authorizations/{authorization}: <p>Retrieves an Issuing <code>Authorization</code> object.</p>
  test('GET /v1/issuing/authorizations/{authorization} - Retrieve an authorization', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/Ex solus commodi titulus velociter cogito dedecor viriliter.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/issuing/authorizations/{authorization}: <p>Updates the specified Issuing <code>Authorization</code> object by setting the values of the parameters passed. Any parameters not provided will be left unchanged.</p>
  test('POST /v1/issuing/authorizations/{authorization} - Update an authorization', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/Torqueo accusantium reprehenderit sortitus.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/issuing/authorizations - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/issuing/authorizations - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/issuing/authorizations - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'authorization' returns 400
  test('GET /v1/issuing/authorizations/{authorization} - missing required parameter 'authorization' (400)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/{authorization}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/issuing/authorizations/{authorization} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/{authorization}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/issuing/authorizations/{authorization} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/{authorization}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/issuing/authorizations/{authorization} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/{authorization}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent authorization returns 404
  test('GET /v1/issuing/authorizations/{authorization} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'authorization' returns 400
  test('POST /v1/issuing/authorizations/{authorization} - missing required parameter 'authorization' (400)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/{authorization}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/issuing/authorizations/{authorization} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/{authorization}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/issuing/authorizations/{authorization} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/{authorization}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/issuing/authorizations/{authorization} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/{authorization}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent authorization returns 404
  test('POST /v1/issuing/authorizations/{authorization} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});