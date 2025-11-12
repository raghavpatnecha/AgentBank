/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.624Z
 * Endpoints: /v1/payment_intents/{intent}/increment_authorization
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/payment_intents/{intent}/increment_authorization: <p>Perform an incremental authorization on an eligible
  <a href="/docs/api/payment_intents/object">PaymentIntent</a>. To be eligible, the
  PaymentIntent’s status must be <code>requires_capture</code> and
  <a href="/docs/api/charges/object#charge_object-payment_method_details-card_present-incremental_authorization_supported">incremental_authorization_supported</a>
  must be <code>true</code>.</p>

  <p>Incremental authorizations attempt to increase the authorized amount on
  your customer’s card to the new, higher <code>amount</code> provided. Similar to the
  initial authorization, incremental authorizations can be declined. A
  single PaymentIntent can call this endpoint multiple times to further
  increase the authorized amount.</p>

  <p>If the incremental authorization succeeds, the PaymentIntent object
  returns with the updated
  <a href="/docs/api/payment_intents/object#payment_intent_object-amount">amount</a>.
  If the incremental authorization fails, a
  <a href="/docs/error-codes#card-declined">card_declined</a> error returns, and no other
  fields on the PaymentIntent or Charge update. The PaymentIntent
  object remains capturable for the previously authorized amount.</p>

  <p>Each PaymentIntent can have a maximum of 10 incremental authorization attempts, including declines.
  After it’s captured, a PaymentIntent can no longer be incremented.</p>

  <p>Learn more about <a href="/docs/terminal/features/incremental-authorizations">incremental authorizations</a>.</p>
  test('POST /v1/payment_intents/{intent}/increment_authorization - Increment an authorization', async ({ request }) => {
    const endpoint = '/v1/payment_intents/Voluptatem quaerat sui coerceo qui spes adicio verto./increment_authorization';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'intent' returns 400
  test('POST /v1/payment_intents/{intent}/increment_authorization - missing required parameter 'intent' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/increment_authorization';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_intents/{intent}/increment_authorization - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/increment_authorization';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_intents/{intent}/increment_authorization - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/increment_authorization';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_intents/{intent}/increment_authorization - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/increment_authorization';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent intent returns 404
  test('POST /v1/payment_intents/{intent}/increment_authorization - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/increment_authorization';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});