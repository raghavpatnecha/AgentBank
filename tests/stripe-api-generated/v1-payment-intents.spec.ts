/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.624Z
 * Endpoints: /v1/payment_intents, /v1/payment_intents/{intent}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/payment_intents: <p>Returns a list of PaymentIntents.</p>
  test('GET /v1/payment_intents - List all PaymentIntents', async ({ request }) => {
    const endpoint = '/v1/payment_intents';

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
    expect(body.url).toMatch(/^/v1/payment_intents/);
  });

  // Happy path test for POST /v1/payment_intents: <p>Creates a PaymentIntent object.</p>

  <p>After the PaymentIntent is created, attach a payment method and <a href="/docs/api/payment_intents/confirm">confirm</a>
  to continue the payment. Learn more about <a href="/docs/payments/payment-intents">the available payment flows
  with the Payment Intents API</a>.</p>

  <p>When you use <code>confirm=true</code> during creation, it’s equivalent to creating
  and confirming the PaymentIntent in the same call. You can use any parameters
  available in the <a href="/docs/api/payment_intents/confirm">confirm API</a> when you supply
  <code>confirm=true</code>.</p>
  test('POST /v1/payment_intents - Create a PaymentIntent', async ({ request }) => {
    const endpoint = '/v1/payment_intents';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/payment_intents/{intent}: <p>Retrieves the details of a PaymentIntent that has previously been created. </p>

  <p>You can retrieve a PaymentIntent client-side using a publishable key when the <code>client_secret</code> is in the query string. </p>

  <p>If you retrieve a PaymentIntent with a publishable key, it only returns a subset of properties. Refer to the <a href="#payment_intent_object">payment intent</a> object reference for more details.</p>
  test('GET /v1/payment_intents/{intent} - Retrieve a PaymentIntent', async ({ request }) => {
    const endpoint = '/v1/payment_intents/Urbs iusto tantillus universe celebrer apostolus amo bonus carmen.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/payment_intents/{intent}: <p>Updates properties on a PaymentIntent object without confirming.</p>

  <p>Depending on which properties you update, you might need to confirm the
  PaymentIntent again. For example, updating the <code>payment_method</code>
  always requires you to confirm the PaymentIntent again. If you prefer to
  update and confirm at the same time, we recommend updating properties through
  the <a href="/docs/api/payment_intents/confirm">confirm API</a> instead.</p>
  test('POST /v1/payment_intents/{intent} - Update a PaymentIntent', async ({ request }) => {
    const endpoint = '/v1/payment_intents/Illo subseco amplexus ratione ulciscor dapifer iusto.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/payment_intents - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/payment_intents - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/payment_intents - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_intents';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_intents - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_intents - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_intents - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_intents';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'intent' returns 400
  test('GET /v1/payment_intents/{intent} - missing required parameter 'intent' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/payment_intents/{intent} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/payment_intents/{intent} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/payment_intents/{intent} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent intent returns 404
  test('GET /v1/payment_intents/{intent} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'intent' returns 400
  test('POST /v1/payment_intents/{intent} - missing required parameter 'intent' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_intents/{intent} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_intents/{intent} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_intents/{intent} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent intent returns 404
  test('POST /v1/payment_intents/{intent} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});