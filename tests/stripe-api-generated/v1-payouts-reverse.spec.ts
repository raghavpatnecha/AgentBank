/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.626Z
 * Endpoints: /v1/payouts/{payout}/reverse
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/payouts/{payout}/reverse: <p>Reverses a payout by debiting the destination bank account. At this time, you can only reverse payouts for connected accounts to US and Canadian bank accounts. If the payout is manual and in the <code>pending</code> status, use <code>/v1/payouts/:id/cancel</code> instead.</p>

  <p>By requesting a reversal through <code>/v1/payouts/:id/reverse</code>, you confirm that the authorized signatory of the selected bank account authorizes the debit on the bank account and that no other authorization is required.</p>
  test('POST /v1/payouts/{payout}/reverse - Reverse a payout', async ({ request }) => {
    const endpoint = '/v1/payouts/Defaeco maiores thalassinus statim absconditus torqueo./reverse';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'payout' returns 400
  test('POST /v1/payouts/{payout}/reverse - missing required parameter 'payout' (400)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}/reverse';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payouts/{payout}/reverse - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}/reverse';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payouts/{payout}/reverse - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}/reverse';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payouts/{payout}/reverse - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}/reverse';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent payout returns 404
  test('POST /v1/payouts/{payout}/reverse - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payouts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/reverse';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});