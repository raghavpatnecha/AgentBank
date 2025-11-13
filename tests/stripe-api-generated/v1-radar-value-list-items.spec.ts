/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.627Z
 * Endpoints: /v1/radar/value_list_items, /v1/radar/value_list_items/{item}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 21
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/radar/value_list_items: <p>Returns a list of <code>ValueListItem</code> objects. The objects are sorted in descending order by creation date, with the most recently created object appearing first.</p>
  test('GET /v1/radar/value_list_items - List all value list items', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items';

    const response = await request.get(endpoint, {
      params: {,
          value_list: "Patrocinor antiquus creator vindico blandior suppellex altus.",
      }
    });

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
    expect(body.url).toMatch(/^/v1/radar/value_list_items/);
  });

  // Happy path test for POST /v1/radar/value_list_items: <p>Creates a new <code>ValueListItem</code> object, which is added to the specified parent value list.</p>
  test('POST /v1/radar/value_list_items - Create a value list item', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/radar/value_list_items/{item}: <p>Retrieves a <code>ValueListItem</code> object.</p>
  test('GET /v1/radar/value_list_items/{item} - Retrieve a value list item', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items/Aestas auctus spargo supra architecto cumque acervus.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/radar/value_list_items/{item}: <p>Deletes a <code>ValueListItem</code> object, removing it from its parent value list.</p>
  test('DELETE /v1/radar/value_list_items/{item} - Delete a value list item', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items/Ullus velut causa utor suscipio cenaculum coniecto.';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'value_list' returns 400
  test('GET /v1/radar/value_list_items - missing required parameter 'value_list' (400)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/radar/value_list_items - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/radar/value_list_items - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/radar/value_list_items - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/radar/value_list_items - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/radar/value_list_items - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/radar/value_list_items - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'item' returns 400
  test('GET /v1/radar/value_list_items/{item} - missing required parameter 'item' (400)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items/{item}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/radar/value_list_items/{item} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items/{item}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/radar/value_list_items/{item} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items/{item}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/radar/value_list_items/{item} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items/{item}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent item returns 404
  test('GET /v1/radar/value_list_items/{item} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'item' returns 400
  test('DELETE /v1/radar/value_list_items/{item} - missing required parameter 'item' (400)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items/{item}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/radar/value_list_items/{item} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items/{item}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/radar/value_list_items/{item} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items/{item}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/radar/value_list_items/{item} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items/{item}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent item returns 404
  test('DELETE /v1/radar/value_list_items/{item} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/radar/value_list_items/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});