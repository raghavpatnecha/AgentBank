/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.625Z
 * Endpoints: /v1/payment_methods/{payment_method}/attach
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/payment_methods/{payment_method}/attach: <p>Attaches a PaymentMethod object to a Customer.</p>

  <p>To attach a new PaymentMethod to a customer for future payments, we recommend you use a <a href="/docs/api/setup_intents">SetupIntent</a>
  or a PaymentIntent with <a href="/docs/api/payment_intents/create#create_payment_intent-setup_future_usage">setup_future_usage</a>.
  These approaches will perform any necessary steps to set up the PaymentMethod for future payments. Using the <code>/v1/payment_methods/:id/attach</code>
  endpoint without first using a SetupIntent or PaymentIntent with <code>setup_future_usage</code> does not optimize the PaymentMethod for
  future use, which makes later declines and payment friction more likely.
  See <a href="/docs/payments/payment-intents#future-usage">Optimizing cards for future payments</a> for more information about setting up
  future payments.</p>

  <p>To use this PaymentMethod as the default for invoice or subscription payments,
  set <a href="/docs/api/customers/update#update_customer-invoice_settings-default_payment_method"><code>invoice_settings.default_payment_method</code></a>,
  on the Customer to the PaymentMethod’s ID.</p>
  test('POST /v1/payment_methods/{payment_method}/attach - Attach a PaymentMethod to a Customer', async ({ request }) => {
    const endpoint = '/v1/payment_methods/Cavus allatus adulatio./attach';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'payment_method' returns 400
  test('POST /v1/payment_methods/{payment_method}/attach - missing required parameter 'payment_method' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}/attach';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_methods/{payment_method}/attach - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}/attach';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_methods/{payment_method}/attach - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}/attach';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_methods/{payment_method}/attach - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}/attach';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent payment_method returns 404
  test('POST /v1/payment_methods/{payment_method}/attach - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/attach';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});