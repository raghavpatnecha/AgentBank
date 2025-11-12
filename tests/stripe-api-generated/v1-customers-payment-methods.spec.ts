/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.614Z
 * Endpoints: /v1/customers/{customer}/payment_methods, /v1/customers/{customer}/payment_methods/{payment_method}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 12
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/customers/{customer}/payment_methods: <p>Returns a list of PaymentMethods for a given Customer</p>
  test('GET /v1/customers/{customer}/payment_methods - List a Customer's PaymentMethods', async ({ request }) => {
    const endpoint = '/v1/customers/Utor eos aureus comitatus culpo tenetur suggero corroboro usitas venio./payment_methods';

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

  // Happy path test for GET /v1/customers/{customer}/payment_methods/{payment_method}: <p>Retrieves a PaymentMethod object for a given Customer.</p>
  test('GET /v1/customers/{customer}/payment_methods/{payment_method} - Retrieve a Customer's PaymentMethod', async ({ request }) => {
    const endpoint = '/v1/customers/Placeat defessus arguo vulnus damno ipsum cruciamentum cervus aeneus aestus./payment_methods/Trans vero usitas thymum inventore vigor.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'customer' returns 400
  test('GET /v1/customers/{customer}/payment_methods - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/payment_methods';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/customers/{customer}/payment_methods - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/payment_methods';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/customers/{customer}/payment_methods - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/payment_methods';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/customers/{customer}/payment_methods - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/payment_methods';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('GET /v1/customers/{customer}/payment_methods - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/payment_methods';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('GET /v1/customers/{customer}/payment_methods/{payment_method} - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/payment_methods/{payment_method}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/customers/{customer}/payment_methods/{payment_method} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/payment_methods/{payment_method}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/customers/{customer}/payment_methods/{payment_method} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/payment_methods/{payment_method}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/customers/{customer}/payment_methods/{payment_method} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/payment_methods/{payment_method}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('GET /v1/customers/{customer}/payment_methods/{payment_method} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/payment_methods/{payment_method}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});