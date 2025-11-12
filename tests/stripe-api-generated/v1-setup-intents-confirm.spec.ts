/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.629Z
 * Endpoints: /v1/setup_intents/{intent}/confirm
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/setup_intents/{intent}/confirm: <p>Confirm that your customer intends to set up the current or
  provided payment method. For example, you would confirm a SetupIntent
  when a customer hits the “Save” button on a payment method management
  page on your website.</p>

  <p>If the selected payment method does not require any additional
  steps from the customer, the SetupIntent will transition to the
  <code>succeeded</code> status.</p>

  <p>Otherwise, it will transition to the <code>requires_action</code> status and
  suggest additional actions via <code>next_action</code>. If setup fails,
  the SetupIntent will transition to the
  <code>requires_payment_method</code> status or the <code>canceled</code> status if the
  confirmation limit is reached.</p>
  test('POST /v1/setup_intents/{intent}/confirm - Confirm a SetupIntent', async ({ request }) => {
    const endpoint = '/v1/setup_intents/Defetiscor ter ambulo demitto maxime velum asper./confirm';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'intent' returns 400
  test('POST /v1/setup_intents/{intent}/confirm - missing required parameter 'intent' (400)', async ({ request }) => {
    const endpoint = '/v1/setup_intents/{intent}/confirm';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/setup_intents/{intent}/confirm - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/setup_intents/{intent}/confirm';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/setup_intents/{intent}/confirm - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/setup_intents/{intent}/confirm';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/setup_intents/{intent}/confirm - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/setup_intents/{intent}/confirm';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent intent returns 404
  test('POST /v1/setup_intents/{intent}/confirm - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/setup_intents/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/confirm';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});