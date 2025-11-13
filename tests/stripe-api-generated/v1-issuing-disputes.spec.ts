/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.622Z
 * Endpoints: /v1/issuing/disputes, /v1/issuing/disputes/{dispute}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/issuing/disputes: <p>Returns a list of Issuing <code>Dispute</code> objects. The objects are sorted in descending order by creation date, with the most recently created object appearing first.</p>
  test('GET /v1/issuing/disputes - List all disputes', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes';

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
    expect(body.url).toMatch(/^/v1/issuing/disputes/);
  });

  // Happy path test for POST /v1/issuing/disputes: <p>Creates an Issuing <code>Dispute</code> object. Individual pieces of evidence within the <code>evidence</code> object are optional at this point. Stripe only validates that required evidence is present during submission. Refer to <a href="/docs/issuing/purchases/disputes#dispute-reasons-and-evidence">Dispute reasons and evidence</a> for more details about evidence requirements.</p>
  test('POST /v1/issuing/disputes - Create a dispute', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/issuing/disputes/{dispute}: <p>Retrieves an Issuing <code>Dispute</code> object.</p>
  test('GET /v1/issuing/disputes/{dispute} - Retrieve a dispute', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/Cattus sodalitas vilicus clam spargo eos laboriosam dolorem venia subnecto.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/issuing/disputes/{dispute}: <p>Updates the specified Issuing <code>Dispute</code> object by setting the values of the parameters passed. Any parameters not provided will be left unchanged. Properties on the <code>evidence</code> object can be unset by passing in an empty string.</p>
  test('POST /v1/issuing/disputes/{dispute} - Update a dispute', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/Depono vito catena audentia alias assumenda caste cedo tunc deludo.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/issuing/disputes - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/issuing/disputes - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/issuing/disputes - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/issuing/disputes - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/issuing/disputes - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/issuing/disputes - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'dispute' returns 400
  test('GET /v1/issuing/disputes/{dispute} - missing required parameter 'dispute' (400)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/{dispute}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/issuing/disputes/{dispute} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/{dispute}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/issuing/disputes/{dispute} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/{dispute}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/issuing/disputes/{dispute} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/{dispute}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent dispute returns 404
  test('GET /v1/issuing/disputes/{dispute} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'dispute' returns 400
  test('POST /v1/issuing/disputes/{dispute} - missing required parameter 'dispute' (400)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/{dispute}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/issuing/disputes/{dispute} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/{dispute}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/issuing/disputes/{dispute} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/{dispute}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/issuing/disputes/{dispute} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/{dispute}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent dispute returns 404
  test('POST /v1/issuing/disputes/{dispute} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});