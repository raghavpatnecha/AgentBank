/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.625Z
 * Endpoints: /v1/payment_methods, /v1/payment_methods/{payment_method}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/payment_methods: <p>Returns a list of PaymentMethods for Treasury flows. If you want to list the PaymentMethods attached to a Customer for payments, you should use the <a href="/docs/api/payment_methods/customer_list">List a Customer’s PaymentMethods</a> API instead.</p>
  test('GET /v1/payment_methods - List PaymentMethods', async ({ request }) => {
    const endpoint = '/v1/payment_methods';

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
    expect(body.url).toMatch(/^/v1/payment_methods/);
  });

  // Happy path test for POST /v1/payment_methods: <p>Creates a PaymentMethod object. Read the <a href="/docs/stripe-js/reference#stripe-create-payment-method">Stripe.js reference</a> to learn how to create PaymentMethods via Stripe.js.</p>

  <p>Instead of creating a PaymentMethod directly, we recommend using the <a href="/docs/payments/accept-a-payment">PaymentIntents</a> API to accept a payment immediately or the <a href="/docs/payments/save-and-reuse">SetupIntent</a> API to collect payment method details ahead of a future payment.</p>
  test('POST /v1/payment_methods - Shares a PaymentMethod', async ({ request }) => {
    const endpoint = '/v1/payment_methods';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/payment_methods/{payment_method}: <p>Retrieves a PaymentMethod object attached to the StripeAccount. To retrieve a payment method attached to a Customer, you should use <a href="/docs/api/payment_methods/customer">Retrieve a Customer’s PaymentMethods</a></p>
  test('GET /v1/payment_methods/{payment_method} - Retrieve a PaymentMethod', async ({ request }) => {
    const endpoint = '/v1/payment_methods/Umbra colligo terra dolores sol voluptatem debitis.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/payment_methods/{payment_method}: <p>Updates a PaymentMethod object. A PaymentMethod must be attached to a customer to be updated.</p>
  test('POST /v1/payment_methods/{payment_method} - Update a PaymentMethod', async ({ request }) => {
    const endpoint = '/v1/payment_methods/Vindico ara summa sui laborum possimus accendo vix unde.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/payment_methods - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_methods';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/payment_methods - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_methods';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/payment_methods - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_methods';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_methods - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_methods';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_methods - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_methods';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_methods - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_methods';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'payment_method' returns 400
  test('GET /v1/payment_methods/{payment_method} - missing required parameter 'payment_method' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/payment_methods/{payment_method} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/payment_methods/{payment_method} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/payment_methods/{payment_method} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent payment_method returns 404
  test('GET /v1/payment_methods/{payment_method} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'payment_method' returns 400
  test('POST /v1/payment_methods/{payment_method} - missing required parameter 'payment_method' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_methods/{payment_method} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_methods/{payment_method} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_methods/{payment_method} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent payment_method returns 404
  test('POST /v1/payment_methods/{payment_method} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});