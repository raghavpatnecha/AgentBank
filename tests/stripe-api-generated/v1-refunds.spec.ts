/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.628Z
 * Endpoints: /v1/refunds, /v1/refunds/{refund}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/refunds: <p>Returns a list of all refunds you created. We return the refunds in sorted order, with the most recent refunds appearing first. The 10 most recent refunds are always available by default on the Charge object.</p>
  test('GET /v1/refunds - List all refunds', async ({ request }) => {
    const endpoint = '/v1/refunds';

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
    expect(body.url).toMatch(/^/v1/refunds/);
  });

  // Happy path test for POST /v1/refunds: <p>When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.</p>

  <p>Creating a new refund will refund a charge that has previously been created but not yet refunded.
  Funds will be refunded to the credit or debit card that was originally charged.</p>

  <p>You can optionally refund only part of a charge.
  You can do so multiple times, until the entire charge has been refunded.</p>

  <p>Once entirely refunded, a charge can’t be refunded again.
  This method will raise an error when called on an already-refunded charge,
  or when trying to refund more money than is left on a charge.</p>
  test('POST /v1/refunds - Create customer balance refund', async ({ request }) => {
    const endpoint = '/v1/refunds';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/refunds/{refund}: <p>Retrieves the details of an existing refund.</p>
  test('GET /v1/refunds/{refund} - Retrieve a refund', async ({ request }) => {
    const endpoint = '/v1/refunds/Tersus substantia vorago verbera angustus valetudo';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/refunds/{refund}: <p>Updates the refund that you specify by setting the values of the passed parameters. Any parameters that you don’t provide remain unchanged.</p>

  <p>This request only accepts <code>metadata</code> as an argument.</p>
  test('POST /v1/refunds/{refund} - Update a refund', async ({ request }) => {
    const endpoint = '/v1/refunds/Conor arbitro atrocitas vespillo vulgus virga capi';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/refunds - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/refunds';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/refunds - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/refunds';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/refunds - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/refunds';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/refunds - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/refunds';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/refunds - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/refunds';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/refunds - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/refunds';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'refund' returns 400
  test('GET /v1/refunds/{refund} - missing required parameter 'refund' (400)', async ({ request }) => {
    const endpoint = '/v1/refunds/{refund}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/refunds/{refund} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/refunds/{refund}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/refunds/{refund} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/refunds/{refund}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/refunds/{refund} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/refunds/{refund}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent refund returns 404
  test('GET /v1/refunds/{refund} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/refunds/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'refund' returns 400
  test('POST /v1/refunds/{refund} - missing required parameter 'refund' (400)', async ({ request }) => {
    const endpoint = '/v1/refunds/{refund}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/refunds/{refund} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/refunds/{refund}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/refunds/{refund} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/refunds/{refund}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/refunds/{refund} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/refunds/{refund}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent refund returns 404
  test('POST /v1/refunds/{refund} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/refunds/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});