/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.606Z
 * Endpoints: /v1/accounts/{account}/capabilities, /v1/accounts/{account}/capabilities/{capability}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 18
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/accounts/{account}/capabilities: <p>Returns a list of capabilities associated with the account. The capabilities are returned sorted by creation date, with the most recent capability appearing first.</p>
  test('GET /v1/accounts/{account}/capabilities - List all account capabilities', async ({ request }) => {
    const endpoint = '/v1/accounts/Absque sapiente colo./capabilities';

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

  // Happy path test for GET /v1/accounts/{account}/capabilities/{capability}: <p>Retrieves information about the specified Account Capability.</p>
  test('GET /v1/accounts/{account}/capabilities/{capability} - Retrieve an Account Capability', async ({ request }) => {
    const endpoint = '/v1/accounts/Adaugeo corpus terminatio cubo denique cometes./capabilities/Tepesco quas cernuus advoco.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/accounts/{account}/capabilities/{capability}: <p>Updates an existing Account Capability. Request or remove a capability by updating its <code>requested</code> parameter.</p>
  test('POST /v1/accounts/{account}/capabilities/{capability} - Update an Account Capability', async ({ request }) => {
    const endpoint = '/v1/accounts/Tres crur sui solutio aiunt abeo spes adopto benevolentia incidunt./capabilities/Eum vitium undique crudelis derelinquo bellum cari';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'account' returns 400
  test('GET /v1/accounts/{account}/capabilities - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/capabilities';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/accounts/{account}/capabilities - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/capabilities';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/accounts/{account}/capabilities - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/capabilities';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/accounts/{account}/capabilities - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/capabilities';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('GET /v1/accounts/{account}/capabilities - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/capabilities';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('GET /v1/accounts/{account}/capabilities/{capability} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/capabilities/{capability}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/accounts/{account}/capabilities/{capability} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/capabilities/{capability}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/accounts/{account}/capabilities/{capability} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/capabilities/{capability}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/accounts/{account}/capabilities/{capability} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/capabilities/{capability}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('GET /v1/accounts/{account}/capabilities/{capability} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/capabilities/{capability}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('POST /v1/accounts/{account}/capabilities/{capability} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/capabilities/{capability}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/accounts/{account}/capabilities/{capability} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/capabilities/{capability}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/accounts/{account}/capabilities/{capability} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/capabilities/{capability}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/accounts/{account}/capabilities/{capability} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/capabilities/{capability}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('POST /v1/accounts/{account}/capabilities/{capability} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/capabilities/{capability}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});