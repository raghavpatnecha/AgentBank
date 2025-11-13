/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.626Z
 * Endpoints: /v1/payouts/{payout}/cancel
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/payouts/{payout}/cancel: <p>You can cancel a previously created payout if its status is <code>pending</code>. Stripe refunds the funds to your available balance. You can’t cancel automatic Stripe payouts.</p>
  test('POST /v1/payouts/{payout}/cancel - Cancel a payout', async ({ request }) => {
    const endpoint = '/v1/payouts/Aspernatur astrum velociter alii cattus cervus aestus benigne./cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'payout' returns 400
  test('POST /v1/payouts/{payout}/cancel - missing required parameter 'payout' (400)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payouts/{payout}/cancel - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payouts/{payout}/cancel - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}/cancel';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payouts/{payout}/cancel - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}/cancel';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent payout returns 404
  test('POST /v1/payouts/{payout}/cancel - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payouts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});