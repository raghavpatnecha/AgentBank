/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.619Z
 * Endpoints: /v1/file_links, /v1/file_links/{link}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/file_links: <p>Returns a list of file links.</p>
  test('GET /v1/file_links - List all file links', async ({ request }) => {
    const endpoint = '/v1/file_links';

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
    expect(body.url).toMatch(/^/v1/file_links/);
  });

  // Happy path test for POST /v1/file_links: <p>Creates a new file link object.</p>
  test('POST /v1/file_links - Create a file link', async ({ request }) => {
    const endpoint = '/v1/file_links';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/file_links/{link}: <p>Retrieves the file link with the given ID.</p>
  test('GET /v1/file_links/{link} - Retrieve a file link', async ({ request }) => {
    const endpoint = '/v1/file_links/Conspergo turpis spargo corroboro solvo vel apposi';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/file_links/{link}: <p>Updates an existing file link object. Expired links can no longer be updated.</p>
  test('POST /v1/file_links/{link} - Update a file link', async ({ request }) => {
    const endpoint = '/v1/file_links/Decretum subseco illo cavus tero officia alveus.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/file_links - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/file_links';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/file_links - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/file_links';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/file_links - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/file_links';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/file_links - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/file_links';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/file_links - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/file_links';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/file_links - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/file_links';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'link' returns 400
  test('GET /v1/file_links/{link} - missing required parameter 'link' (400)', async ({ request }) => {
    const endpoint = '/v1/file_links/{link}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/file_links/{link} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/file_links/{link}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/file_links/{link} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/file_links/{link}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/file_links/{link} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/file_links/{link}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent link returns 404
  test('GET /v1/file_links/{link} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/file_links/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'link' returns 400
  test('POST /v1/file_links/{link} - missing required parameter 'link' (400)', async ({ request }) => {
    const endpoint = '/v1/file_links/{link}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/file_links/{link} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/file_links/{link}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/file_links/{link} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/file_links/{link}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/file_links/{link} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/file_links/{link}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent link returns 404
  test('POST /v1/file_links/{link} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/file_links/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});