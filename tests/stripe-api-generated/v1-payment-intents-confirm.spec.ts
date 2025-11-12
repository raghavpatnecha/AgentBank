/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.624Z
 * Endpoints: /v1/payment_intents/{intent}/confirm
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/payment_intents/{intent}/confirm: <p>Confirm that your customer intends to pay with current or provided
  payment method. Upon confirmation, the PaymentIntent will attempt to initiate
  a payment.</p>

  <p>If the selected payment method requires additional authentication steps, the
  PaymentIntent will transition to the <code>requires_action</code> status and
  suggest additional actions via <code>next_action</code>. If payment fails,
  the PaymentIntent transitions to the <code>requires_payment_method</code> status or the
  <code>canceled</code> status if the confirmation limit is reached. If
  payment succeeds, the PaymentIntent will transition to the <code>succeeded</code>
  status (or <code>requires_capture</code>, if <code>capture_method</code> is set to <code>manual</code>).</p>

  <p>If the <code>confirmation_method</code> is <code>automatic</code>, payment may be attempted
  using our <a href="/docs/stripe-js/reference#stripe-handle-card-payment">client SDKs</a>
  and the PaymentIntent’s <a href="#payment_intent_object-client_secret">client_secret</a>.
  After <code>next_action</code>s are handled by the client, no additional
  confirmation is required to complete the payment.</p>

  <p>If the <code>confirmation_method</code> is <code>manual</code>, all payment attempts must be
  initiated using a secret key.</p>

  <p>If any actions are required for the payment, the PaymentIntent will
  return to the <code>requires_confirmation</code> state
  after those actions are completed. Your server needs to then
  explicitly re-confirm the PaymentIntent to initiate the next payment
  attempt.</p>

  <p>There is a variable upper limit on how many times a PaymentIntent can be confirmed.
  After this limit is reached, any further calls to this endpoint will
  transition the PaymentIntent to the <code>canceled</code> state.</p>
  test('POST /v1/payment_intents/{intent}/confirm - Confirm a PaymentIntent', async ({ request }) => {
    const endpoint = '/v1/payment_intents/Abstergo via vester ago adamo animadverto unus taceo./confirm';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'intent' returns 400
  test('POST /v1/payment_intents/{intent}/confirm - missing required parameter 'intent' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/confirm';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_intents/{intent}/confirm - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/confirm';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_intents/{intent}/confirm - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/confirm';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_intents/{intent}/confirm - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/confirm';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent intent returns 404
  test('POST /v1/payment_intents/{intent}/confirm - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/confirm';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});