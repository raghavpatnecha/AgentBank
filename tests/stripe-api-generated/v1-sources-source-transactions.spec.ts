/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.630Z
 * Endpoints: /v1/sources/{source}/source_transactions, /v1/sources/{source}/source_transactions/{source_transaction}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 12
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/sources/{source}/source_transactions: <p>List source transactions for a given source.</p>
  test('GET /v1/sources/{source}/source_transactions - source_transactions', async ({ request }) => {
    const endpoint = '/v1/sources/Dapifer argentum talio desidero debitis adimpleo infit facilis quae./source_transactions';

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

  // Happy path test for GET /v1/sources/{source}/source_transactions/{source_transaction}: <p>Retrieve an existing source transaction object. Supply the unique source ID from a source creation request and the source transaction ID and Stripe will return the corresponding up-to-date source object information.</p>
  test('GET /v1/sources/{source}/source_transactions/{source_transaction} - Retrieve a source transaction', async ({ request }) => {
    const endpoint = '/v1/sources/Carmen convoco canis ventito absens voluptates vaco contra tolero./source_transactions/Debilito assumenda armarium vinitor approbo.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'source' returns 400
  test('GET /v1/sources/{source}/source_transactions - missing required parameter 'source' (400)', async ({ request }) => {
    const endpoint = '/v1/sources/{source}/source_transactions';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/sources/{source}/source_transactions - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/sources/{source}/source_transactions';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/sources/{source}/source_transactions - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/sources/{source}/source_transactions';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/sources/{source}/source_transactions - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/sources/{source}/source_transactions';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent source returns 404
  test('GET /v1/sources/{source}/source_transactions - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/sources/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/source_transactions';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'source' returns 400
  test('GET /v1/sources/{source}/source_transactions/{source_transaction} - missing required parameter 'source' (400)', async ({ request }) => {
    const endpoint = '/v1/sources/{source}/source_transactions/{source_transaction}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/sources/{source}/source_transactions/{source_transaction} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/sources/{source}/source_transactions/{source_transaction}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/sources/{source}/source_transactions/{source_transaction} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/sources/{source}/source_transactions/{source_transaction}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/sources/{source}/source_transactions/{source_transaction} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/sources/{source}/source_transactions/{source_transaction}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent source returns 404
  test('GET /v1/sources/{source}/source_transactions/{source_transaction} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/sources/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/source_transactions/{source_transaction}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});