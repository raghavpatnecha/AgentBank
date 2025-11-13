/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.635Z
 * Endpoints: /v1/terminal/locations, /v1/terminal/locations/{location}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 26
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/terminal/locations: <p>Returns a list of <code>Location</code> objects.</p>
  test('GET /v1/terminal/locations - List all Locations', async ({ request }) => {
    const endpoint = '/v1/terminal/locations';

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
    expect(body.url).toMatch(/^/v1/terminal/locations/);
  });

  // Happy path test for POST /v1/terminal/locations: <p>Creates a new <code>Location</code> object.
  For further details, including which address fields are required in each country, see the <a href="/docs/terminal/fleet/locations">Manage locations</a> guide.</p>
  test('POST /v1/terminal/locations - Create a Location', async ({ request }) => {
    const endpoint = '/v1/terminal/locations';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/terminal/locations/{location}: <p>Retrieves a <code>Location</code> object.</p>
  test('GET /v1/terminal/locations/{location} - Retrieve a Location', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/Contra audacia tristis clibanus dolore.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/terminal/locations/{location}: <p>Updates a <code>Location</code> object by setting the values of the parameters passed. Any parameters not provided will be left unchanged.</p>
  test('POST /v1/terminal/locations/{location} - Update a Location', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/Vita ea cunabula ipsum quo ipsa ciminatio clarus.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/terminal/locations/{location}: <p>Deletes a <code>Location</code> object.</p>
  test('DELETE /v1/terminal/locations/{location} - Delete a Location', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/Decumbo utroque crapula cogito quaerat conscendo.';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/terminal/locations - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/terminal/locations - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/terminal/locations - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/terminal/locations - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/terminal/locations - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/terminal/locations - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'location' returns 400
  test('GET /v1/terminal/locations/{location} - missing required parameter 'location' (400)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/{location}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/terminal/locations/{location} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/{location}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/terminal/locations/{location} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/{location}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/terminal/locations/{location} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/{location}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent location returns 404
  test('GET /v1/terminal/locations/{location} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'location' returns 400
  test('POST /v1/terminal/locations/{location} - missing required parameter 'location' (400)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/{location}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/terminal/locations/{location} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/{location}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/terminal/locations/{location} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/{location}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/terminal/locations/{location} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/{location}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent location returns 404
  test('POST /v1/terminal/locations/{location} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'location' returns 400
  test('DELETE /v1/terminal/locations/{location} - missing required parameter 'location' (400)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/{location}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/terminal/locations/{location} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/{location}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/terminal/locations/{location} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/{location}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/terminal/locations/{location} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/{location}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent location returns 404
  test('DELETE /v1/terminal/locations/{location} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/terminal/locations/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});