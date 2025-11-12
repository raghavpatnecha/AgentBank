/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.636Z
 * Endpoints: /v1/terminal/readers/{reader}/collect_payment_method
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/terminal/readers/{reader}/collect_payment_method: <p>Initiates a payment flow on a Reader and updates the PaymentIntent with card details before manual confirmation. See <a href="/docs/terminal/payments/collect-card-payment?terminal-sdk-platform=server-driven&process=inspect#collect-a-paymentmethod">Collecting a Payment method</a> for more details.</p>
  test('POST /v1/terminal/readers/{reader}/collect_payment_method - Hand off a PaymentIntent to a Reader and collect card details', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/Cinis varius sordeo depraedor statua paulatim dolore ager crapula baiulus./collect_payment_method';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'reader' returns 400
  test('POST /v1/terminal/readers/{reader}/collect_payment_method - missing required parameter 'reader' (400)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}/collect_payment_method';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/terminal/readers/{reader}/collect_payment_method - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}/collect_payment_method';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/terminal/readers/{reader}/collect_payment_method - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}/collect_payment_method';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/terminal/readers/{reader}/collect_payment_method - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/{reader}/collect_payment_method';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent reader returns 404
  test('POST /v1/terminal/readers/{reader}/collect_payment_method - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/terminal/readers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/collect_payment_method';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});