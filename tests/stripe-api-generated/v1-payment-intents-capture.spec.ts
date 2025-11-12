/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.624Z
 * Endpoints: /v1/payment_intents/{intent}/capture
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/payment_intents/{intent}/capture: <p>Capture the funds of an existing uncaptured PaymentIntent when its status is <code>requires_capture</code>.</p>

  <p>Uncaptured PaymentIntents are cancelled a set number of days (7 by default) after their creation.</p>

  <p>Learn more about <a href="/docs/payments/capture-later">separate authorization and capture</a>.</p>
  test('POST /v1/payment_intents/{intent}/capture - Capture a PaymentIntent', async ({ request }) => {
    const endpoint = '/v1/payment_intents/Amplitudo timor torqueo peior subito arbustum ulciscor vestrum./capture';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'intent' returns 400
  test('POST /v1/payment_intents/{intent}/capture - missing required parameter 'intent' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/capture';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_intents/{intent}/capture - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/capture';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_intents/{intent}/capture - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/capture';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_intents/{intent}/capture - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/{intent}/capture';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent intent returns 404
  test('POST /v1/payment_intents/{intent}/capture - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_intents/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/capture';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});