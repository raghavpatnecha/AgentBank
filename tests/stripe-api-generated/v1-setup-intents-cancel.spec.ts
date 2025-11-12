/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.629Z
 * Endpoints: /v1/setup_intents/{intent}/cancel
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/setup_intents/{intent}/cancel: <p>You can cancel a SetupIntent object when it’s in one of these statuses: <code>requires_payment_method</code>, <code>requires_confirmation</code>, or <code>requires_action</code>. </p>

  <p>After you cancel it, setup is abandoned and any operations on the SetupIntent fail with an error. You can’t cancel the SetupIntent for a Checkout Session. <a href="/docs/api/checkout/sessions/expire">Expire the Checkout Session</a> instead.</p>
  test('POST /v1/setup_intents/{intent}/cancel - Cancel a SetupIntent', async ({ request }) => {
    const endpoint = '/v1/setup_intents/Tempore delicate avarus quod deleo veniam admiratio venio alo decens./cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'intent' returns 400
  test('POST /v1/setup_intents/{intent}/cancel - missing required parameter 'intent' (400)', async ({ request }) => {
    const endpoint = '/v1/setup_intents/{intent}/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/setup_intents/{intent}/cancel - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/setup_intents/{intent}/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/setup_intents/{intent}/cancel - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/setup_intents/{intent}/cancel';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/setup_intents/{intent}/cancel - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/setup_intents/{intent}/cancel';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent intent returns 404
  test('POST /v1/setup_intents/{intent}/cancel - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/setup_intents/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});