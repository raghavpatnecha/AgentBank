/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.635Z
 * Endpoints: /v1/terminal/readers, /v1/terminal/readers/{reader}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 26
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/terminal/readers: <p>Returns a list of <code>Reader</code> objects.</p>
  test('GET /v1/terminal/readers - List all Readers', async ({ request }) => {
    const endpoint = '/v1/terminal/readers';

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
  });

  // Happy path test for POST /v1/terminal/readers: <p>Creates a new <code>Reader</code> object.</p>
  test('POST /v1/terminal/readers - Create a Reader', async ({ request }) => {
    const endpoint = '/v1/terminal/readers';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/terminal/readers/{reader}: <p>Retrieves a <code>Reader</code> object.</p>
  test('GET /v1/terminal/readers/{reader} - Retrieve a Reader', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/Thesis ab sunt verecundia dolorem solitudo.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/terminal/readers/{reader}: <p>Updates a <code>Reader</code> object by setting the values of the parameters passed. Any parameters not provided will be left unchanged.</p>
  test('POST /v1/terminal/readers/{reader} - Update a Reader', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/Argumentum ver accendo culpo crepusculum commodi voluptatibus patria trado.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/terminal/readers/{reader}: <p>Deletes a <code>Reader</code> object.</p>
  test('DELETE /v1/terminal/readers/{reader} - Delete a Reader', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/Carpo bellicus aperiam canto tabula victoria vos.';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/terminal/readers - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/terminal/readers - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/terminal/readers - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/terminal/readers - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/terminal/readers - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/terminal/readers - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'reader' returns 400
  test('GET /v1/terminal/readers/{reader} - missing required parameter 'reader' (400)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/terminal/readers/{reader} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/terminal/readers/{reader} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/terminal/readers/{reader} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent reader returns 404
  test('GET /v1/terminal/readers/{reader} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'reader' returns 400
  test('POST /v1/terminal/readers/{reader} - missing required parameter 'reader' (400)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/terminal/readers/{reader} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/terminal/readers/{reader} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/terminal/readers/{reader} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent reader returns 404
  test('POST /v1/terminal/readers/{reader} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'reader' returns 400
  test('DELETE /v1/terminal/readers/{reader} - missing required parameter 'reader' (400)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/terminal/readers/{reader} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/terminal/readers/{reader} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/terminal/readers/{reader} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent reader returns 404
  test('DELETE /v1/terminal/readers/{reader} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});