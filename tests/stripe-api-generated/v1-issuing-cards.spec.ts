/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.622Z
 * Endpoints: /v1/issuing/cards, /v1/issuing/cards/{card}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/issuing/cards: <p>Returns a list of Issuing <code>Card</code> objects. The objects are sorted in descending order by creation date, with the most recently created object appearing first.</p>
  test('GET /v1/issuing/cards - List all cards', async ({ request }) => {
    const endpoint = '/v1/issuing/cards';

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
    expect(body.url).toMatch(/^/v1/issuing/cards/);
  });

  // Happy path test for POST /v1/issuing/cards: <p>Creates an Issuing <code>Card</code> object.</p>
  test('POST /v1/issuing/cards - Create a card', async ({ request }) => {
    const endpoint = '/v1/issuing/cards';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/issuing/cards/{card}: <p>Retrieves an Issuing <code>Card</code> object.</p>
  test('GET /v1/issuing/cards/{card} - Retrieve a card', async ({ request }) => {
    const endpoint = '/v1/issuing/cards/Aufero aptus nam volutabrum.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/issuing/cards/{card}: <p>Updates the specified Issuing <code>Card</code> object by setting the values of the parameters passed. Any parameters not provided will be left unchanged.</p>
  test('POST /v1/issuing/cards/{card} - Update a card', async ({ request }) => {
    const endpoint = '/v1/issuing/cards/Amissio coniuratio creptio tardus nam voveo utor.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/issuing/cards - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/issuing/cards - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/issuing/cards - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/issuing/cards - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/issuing/cards - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/issuing/cards - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'card' returns 400
  test('GET /v1/issuing/cards/{card} - missing required parameter 'card' (400)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards/{card}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/issuing/cards/{card} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards/{card}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/issuing/cards/{card} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards/{card}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/issuing/cards/{card} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards/{card}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent card returns 404
  test('GET /v1/issuing/cards/{card} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'card' returns 400
  test('POST /v1/issuing/cards/{card} - missing required parameter 'card' (400)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards/{card}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/issuing/cards/{card} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards/{card}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/issuing/cards/{card} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards/{card}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/issuing/cards/{card} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards/{card}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent card returns 404
  test('POST /v1/issuing/cards/{card} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/issuing/cards/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});