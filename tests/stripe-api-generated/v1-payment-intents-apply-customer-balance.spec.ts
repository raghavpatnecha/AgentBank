/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.624Z
 * Endpoints: /v1/payment_intents/{intent}/apply_customer_balance
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/payment_intents/{intent}/apply_customer_balance: <p>Manually reconcile the remaining amount for a <code>customer_balance</code> PaymentIntent.</p>
  test('POST /v1/payment_intents/{intent}/apply_customer_balance - Reconcile a customer_balance PaymentIntent', async ({ request }) => {
    const endpoint = '/v1/payment_intents/Cauda creber trans aufero tripudio audio tamisium delibero tenus./apply_customer_balance';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'intent' returns 400
  test('POST /v1/payment_intents/{intent}/apply_customer_balance - missing required parameter 'intent' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/apply_customer_balance';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_intents/{intent}/apply_customer_balance - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/apply_customer_balance';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_intents/{intent}/apply_customer_balance - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/apply_customer_balance';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_intents/{intent}/apply_customer_balance - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/apply_customer_balance';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent intent returns 404
  test('POST /v1/payment_intents/{intent}/apply_customer_balance - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/apply_customer_balance';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});