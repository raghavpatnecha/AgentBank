/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.623Z
 * Endpoints: /v1/issuing/personalization_designs, /v1/issuing/personalization_designs/{personalization_design}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/issuing/personalization_designs: <p>Returns a list of personalization design objects. The objects are sorted in descending order by creation date, with the most recently created object appearing first.</p>
  test('GET /v1/issuing/personalization_designs - List all personalization designs', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs';

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
    expect(body.url).toMatch(/^/v1/issuing/personalization_designs/);
  });

  // Happy path test for POST /v1/issuing/personalization_designs: <p>Creates a personalization design object.</p>
  test('POST /v1/issuing/personalization_designs - Create a personalization design', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/issuing/personalization_designs/{personalization_design}: <p>Retrieves a personalization design object.</p>
  test('GET /v1/issuing/personalization_designs/{personalization_design} - Retrieve a personalization design', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs/Xiphias aliquam censura conatus caveo sponte accusantium degenero cura.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/issuing/personalization_designs/{personalization_design}: <p>Updates a card personalization object.</p>
  test('POST /v1/issuing/personalization_designs/{personalization_design} - Update a personalization design', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs/Amoveo volaticus creo solum delectus turpis aegrotatio.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/issuing/personalization_designs - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/issuing/personalization_designs - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/issuing/personalization_designs - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/issuing/personalization_designs - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/issuing/personalization_designs - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/issuing/personalization_designs - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'personalization_design' returns 400
  test('GET /v1/issuing/personalization_designs/{personalization_design} - missing required parameter 'personalization_design' (400)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs/{personalization_design}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/issuing/personalization_designs/{personalization_design} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs/{personalization_design}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/issuing/personalization_designs/{personalization_design} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs/{personalization_design}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/issuing/personalization_designs/{personalization_design} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs/{personalization_design}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent personalization_design returns 404
  test('GET /v1/issuing/personalization_designs/{personalization_design} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'personalization_design' returns 400
  test('POST /v1/issuing/personalization_designs/{personalization_design} - missing required parameter 'personalization_design' (400)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs/{personalization_design}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/issuing/personalization_designs/{personalization_design} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs/{personalization_design}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/issuing/personalization_designs/{personalization_design} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs/{personalization_design}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/issuing/personalization_designs/{personalization_design} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs/{personalization_design}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent personalization_design returns 404
  test('POST /v1/issuing/personalization_designs/{personalization_design} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/issuing/personalization_designs/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});