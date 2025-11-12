/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.624Z
 * Endpoints: /v1/payment_attempt_records, /v1/payment_attempt_records/{id}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 11
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/payment_attempt_records: <p>List all the Payment Attempt Records attached to the specified Payment Record.</p>
  test('GET /v1/payment_attempt_records - List Payment Attempt Records', async ({ request }) => {
    const endpoint = '/v1/payment_attempt_records';

    const response = await request.get(endpoint, {
      params: {,
          payment_record: "Quaerat pax temporibus totidem.",
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
  });

  // Happy path test for GET /v1/payment_attempt_records/{id}: <p>Retrieves a Payment Attempt Record with the given ID</p>
  test('GET /v1/payment_attempt_records/{id} - Retrieve a Payment Attempt Record', async ({ request }) => {
    const endpoint = '/v1/payment_attempt_records/Tendo vae compono torrens tergeo capio.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'payment_record' returns 400
  test('GET /v1/payment_attempt_records - missing required parameter 'payment_record' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_attempt_records';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/payment_attempt_records - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_attempt_records';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/payment_attempt_records - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_attempt_records';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/payment_attempt_records - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_attempt_records';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'id' returns 400
  test('GET /v1/payment_attempt_records/{id} - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_attempt_records/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/payment_attempt_records/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_attempt_records/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/payment_attempt_records/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_attempt_records/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/payment_attempt_records/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_attempt_records/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('GET /v1/payment_attempt_records/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_attempt_records/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});