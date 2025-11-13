/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.628Z
 * Endpoints: /v1/radar/value_lists, /v1/radar/value_lists/{value_list}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 26
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/radar/value_lists: <p>Returns a list of <code>ValueList</code> objects. The objects are sorted in descending order by creation date, with the most recently created object appearing first.</p>
  test('GET /v1/radar/value_lists - List all value lists', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists';

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
    expect(body.url).toMatch(/^/v1/radar/value_lists/);
  });

  // Happy path test for POST /v1/radar/value_lists: <p>Creates a new <code>ValueList</code> object, which can then be referenced in rules.</p>
  test('POST /v1/radar/value_lists - Create a value list', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/radar/value_lists/{value_list}: <p>Retrieves a <code>ValueList</code> object.</p>
  test('GET /v1/radar/value_lists/{value_list} - Retrieve a value list', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/Thema ipsa adsidue accusamus virgo vitium maxime benevolentia spectaculum.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/radar/value_lists/{value_list}: <p>Updates a <code>ValueList</code> object by setting the values of the parameters passed. Any parameters not provided will be left unchanged. Note that <code>item_type</code> is immutable.</p>
  test('POST /v1/radar/value_lists/{value_list} - Update a value list', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/Curia acies delego thermae contego attollo capio.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/radar/value_lists/{value_list}: <p>Deletes a <code>ValueList</code> object, also deleting any items contained within the value list. To be deleted, a value list must not be referenced in any rules.</p>
  test('DELETE /v1/radar/value_lists/{value_list} - Delete a value list', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/Somniculosus validus suscipit succedo alius cupressus.';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/radar/value_lists - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/radar/value_lists - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/radar/value_lists - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/radar/value_lists - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/radar/value_lists - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/radar/value_lists - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'value_list' returns 400
  test('GET /v1/radar/value_lists/{value_list} - missing required parameter 'value_list' (400)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/{value_list}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/radar/value_lists/{value_list} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/{value_list}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/radar/value_lists/{value_list} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/{value_list}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/radar/value_lists/{value_list} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/{value_list}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent value_list returns 404
  test('GET /v1/radar/value_lists/{value_list} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'value_list' returns 400
  test('POST /v1/radar/value_lists/{value_list} - missing required parameter 'value_list' (400)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/{value_list}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/radar/value_lists/{value_list} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/{value_list}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/radar/value_lists/{value_list} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/{value_list}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/radar/value_lists/{value_list} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/{value_list}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent value_list returns 404
  test('POST /v1/radar/value_lists/{value_list} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'value_list' returns 400
  test('DELETE /v1/radar/value_lists/{value_list} - missing required parameter 'value_list' (400)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/{value_list}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/radar/value_lists/{value_list} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/{value_list}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/radar/value_lists/{value_list} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/{value_list}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/radar/value_lists/{value_list} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/{value_list}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent value_list returns 404
  test('DELETE /v1/radar/value_lists/{value_list} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/radar/value_lists/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});