/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.614Z
 * Endpoints: /v1/customers/{customer}/sources, /v1/customers/{customer}/sources/{id}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 30
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/customers/{customer}/sources: <p>List sources for a specified customer.</p>
  test('GET /v1/customers/{customer}/sources - sources', async ({ request }) => {
    const endpoint = '/v1/customers/Universe condico cibus coepi ver confido./sources';

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

  // Happy path test for POST /v1/customers/{customer}/sources: <p>When you create a new credit card, you must specify a customer or recipient on which to create it.</p>

  <p>If the card’s owner has no default card, then the new card will become the default.
  However, if the owner already has a default, then it will not change.
  To change the default, you should <a href="/docs/api#update_customer">update the customer</a> to have a new <code>default_source</code>.</p>
  test('POST /v1/customers/{customer}/sources - Create a card', async ({ request }) => {
    const endpoint = '/v1/customers/Dens communis admitto./sources';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/customers/{customer}/sources/{id}: <p>Retrieve a specified source for a given customer.</p>
  test('GET /v1/customers/{customer}/sources/{id} - sources by ID', async ({ request }) => {
    const endpoint = '/v1/customers/Textus cognatus earum./sources/Templum tandem abstergo suggero vulgaris chirographum spiculum tener desparatus vaco.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/customers/{customer}/sources/{id}: <p>Update a specified source for a given customer.</p>
  test('POST /v1/customers/{customer}/sources/{id} - sources by ID', async ({ request }) => {
    const endpoint = '/v1/customers/Pecto astrum tibi cohibeo patrocinor administratio sollicito stella cohibeo patruus./sources/Assumenda umbra condico voluntarius asper.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/customers/{customer}/sources/{id}: <p>Delete a specified source for a given customer.</p>
  test('DELETE /v1/customers/{customer}/sources/{id} - Delete a customer source', async ({ request }) => {
    const endpoint = '/v1/customers/Accusator angustus tardus catena trucido itaque thermae vix spoliatio vinco./sources/Adfero viriliter arbustum curatio laboriosam quaer';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'customer' returns 400
  test('GET /v1/customers/{customer}/sources - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/customers/{customer}/sources - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/customers/{customer}/sources - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/customers/{customer}/sources - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('GET /v1/customers/{customer}/sources - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/sources';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('POST /v1/customers/{customer}/sources - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/customers/{customer}/sources - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/customers/{customer}/sources - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/customers/{customer}/sources - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('POST /v1/customers/{customer}/sources - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/sources';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('GET /v1/customers/{customer}/sources/{id} - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/customers/{customer}/sources/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/customers/{customer}/sources/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/customers/{customer}/sources/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('GET /v1/customers/{customer}/sources/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/sources/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('POST /v1/customers/{customer}/sources/{id} - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/customers/{customer}/sources/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/customers/{customer}/sources/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/customers/{customer}/sources/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('POST /v1/customers/{customer}/sources/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/sources/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('DELETE /v1/customers/{customer}/sources/{id} - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/customers/{customer}/sources/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/customers/{customer}/sources/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources/{id}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/customers/{customer}/sources/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/sources/{id}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('DELETE /v1/customers/{customer}/sources/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/sources/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});