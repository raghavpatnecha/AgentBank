/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.608Z
 * Endpoints: /v1/application_fees/{fee}/refunds/{id}, /v1/application_fees/{id}/refunds
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 24
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/application_fees/{fee}/refunds/{id}: <p>By default, you can see the 10 most recent refunds stored directly on the application fee object, but you can also retrieve details about a specific refund stored on the application fee.</p>
  test('GET /v1/application_fees/{fee}/refunds/{id} - Retrieve an application fee refund', async ({ request }) => {
    const endpoint = '/v1/application_fees/Conculco quo dicta animus./refunds/Quae uredo anser timor vitium subito conitor apparatus deprecator crustulum.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/application_fees/{fee}/refunds/{id}: <p>Updates the specified application fee refund by setting the values of the parameters passed. Any parameters not provided will be left unchanged.</p>

  <p>This request only accepts metadata as an argument.</p>
  test('POST /v1/application_fees/{fee}/refunds/{id} - Update an application fee refund', async ({ request }) => {
    const endpoint = '/v1/application_fees/Verus volubilis sordeo./refunds/Blanditiis paulatim arcus cogo vis adinventitias amitto blandior.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/application_fees/{id}/refunds: <p>You can see a list of the refunds belonging to a specific application fee. Note that the 10 most recent refunds are always available by default on the application fee object. If you need more than those 10, you can use this API method and the <code>limit</code> and <code>starting_after</code> parameters to page through additional refunds.</p>
  test('GET /v1/application_fees/{id}/refunds - List all application fee refunds', async ({ request }) => {
    const endpoint = '/v1/application_fees/Ex arbitro quod vigor./refunds';

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

  // Happy path test for POST /v1/application_fees/{id}/refunds: <p>Refunds an application fee that has previously been collected but not yet refunded.
  Funds will be refunded to the Stripe account from which the fee was originally collected.</p>

  <p>You can optionally refund only part of an application fee.
  You can do so multiple times, until the entire fee has been refunded.</p>

  <p>Once entirely refunded, an application fee can’t be refunded again.
  This method will raise an error when called on an already-refunded application fee,
  or when trying to refund more money than is left on an application fee.</p>
  test('POST /v1/application_fees/{id}/refunds - Create an application fee refund', async ({ request }) => {
    const endpoint = '/v1/application_fees/Expedita aut brevis tamisium tabernus vobis altus alter aeneus aggero./refunds';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'fee' returns 400
  test('GET /v1/application_fees/{fee}/refunds/{id} - missing required parameter 'fee' (400)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{fee}/refunds/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/application_fees/{fee}/refunds/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{fee}/refunds/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/application_fees/{fee}/refunds/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{fee}/refunds/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/application_fees/{fee}/refunds/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{fee}/refunds/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent fee returns 404
  test('GET /v1/application_fees/{fee}/refunds/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/application_fees/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/refunds/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'fee' returns 400
  test('POST /v1/application_fees/{fee}/refunds/{id} - missing required parameter 'fee' (400)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{fee}/refunds/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/application_fees/{fee}/refunds/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{fee}/refunds/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/application_fees/{fee}/refunds/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{fee}/refunds/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/application_fees/{fee}/refunds/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{fee}/refunds/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent fee returns 404
  test('POST /v1/application_fees/{fee}/refunds/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/application_fees/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/refunds/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'id' returns 400
  test('GET /v1/application_fees/{id}/refunds - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{id}/refunds';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/application_fees/{id}/refunds - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{id}/refunds';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/application_fees/{id}/refunds - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{id}/refunds';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/application_fees/{id}/refunds - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{id}/refunds';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('GET /v1/application_fees/{id}/refunds - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/application_fees/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/refunds';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'id' returns 400
  test('POST /v1/application_fees/{id}/refunds - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{id}/refunds';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/application_fees/{id}/refunds - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{id}/refunds';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/application_fees/{id}/refunds - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{id}/refunds';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/application_fees/{id}/refunds - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/application_fees/{id}/refunds';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('POST /v1/application_fees/{id}/refunds - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/application_fees/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/refunds';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});