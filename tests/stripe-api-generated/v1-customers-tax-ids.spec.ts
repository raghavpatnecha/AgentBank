/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.614Z
 * Endpoints: /v1/customers/{customer}/tax_ids, /v1/customers/{customer}/tax_ids/{id}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 24
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/customers/{customer}/tax_ids: <p>Returns a list of tax IDs for a customer.</p>
  test('GET /v1/customers/{customer}/tax_ids - List all Customer tax IDs', async ({ request }) => {
    const endpoint = '/v1/customers/Tabesco tubineus attonbitus adficio./tax_ids';

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

  // Happy path test for POST /v1/customers/{customer}/tax_ids: <p>Creates a new <code>tax_id</code> object for a customer.</p>
  test('POST /v1/customers/{customer}/tax_ids - Create a Customer tax ID', async ({ request }) => {
    const endpoint = '/v1/customers/Sit sunt solutio repellendus utpote virtus./tax_ids';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/customers/{customer}/tax_ids/{id}: <p>Retrieves the <code>tax_id</code> object with the given identifier.</p>
  test('GET /v1/customers/{customer}/tax_ids/{id} - Retrieve a Customer tax ID', async ({ request }) => {
    const endpoint = '/v1/customers/Infit sulum verus cavus cubo coaegresco voco speculum./tax_ids/Inventore ascit cometes taceo vetus.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/customers/{customer}/tax_ids/{id}: <p>Deletes an existing <code>tax_id</code> object.</p>
  test('DELETE /v1/customers/{customer}/tax_ids/{id} - Delete a Customer tax ID', async ({ request }) => {
    const endpoint = '/v1/customers/Necessitatibus correptius calamitas degenero stabilis adulescens./tax_ids/Cum comitatus taedium vicissitudo causa cervus def';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'customer' returns 400
  test('GET /v1/customers/{customer}/tax_ids - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/customers/{customer}/tax_ids - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/customers/{customer}/tax_ids - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/customers/{customer}/tax_ids - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('GET /v1/customers/{customer}/tax_ids - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/tax_ids';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('POST /v1/customers/{customer}/tax_ids - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/customers/{customer}/tax_ids - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/customers/{customer}/tax_ids - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/customers/{customer}/tax_ids - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('POST /v1/customers/{customer}/tax_ids - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/tax_ids';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('GET /v1/customers/{customer}/tax_ids/{id} - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/customers/{customer}/tax_ids/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/customers/{customer}/tax_ids/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/customers/{customer}/tax_ids/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('GET /v1/customers/{customer}/tax_ids/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/tax_ids/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('DELETE /v1/customers/{customer}/tax_ids/{id} - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/customers/{customer}/tax_ids/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/customers/{customer}/tax_ids/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids/{id}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/customers/{customer}/tax_ids/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/tax_ids/{id}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('DELETE /v1/customers/{customer}/tax_ids/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/tax_ids/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});