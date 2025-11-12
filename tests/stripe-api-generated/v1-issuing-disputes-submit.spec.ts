/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.622Z
 * Endpoints: /v1/issuing/disputes/{dispute}/submit
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/issuing/disputes/{dispute}/submit: <p>Submits an Issuing <code>Dispute</code> to the card network. Stripe validates that all evidence fields required for the dispute’s reason are present. For more details, see <a href="/docs/issuing/purchases/disputes#dispute-reasons-and-evidence">Dispute reasons and evidence</a>.</p>
  test('POST /v1/issuing/disputes/{dispute}/submit - Submit a dispute', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/Valeo tonsor in./submit';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'dispute' returns 400
  test('POST /v1/issuing/disputes/{dispute}/submit - missing required parameter 'dispute' (400)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/{dispute}/submit';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/issuing/disputes/{dispute}/submit - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/{dispute}/submit';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/issuing/disputes/{dispute}/submit - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/{dispute}/submit';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/issuing/disputes/{dispute}/submit - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/{dispute}/submit';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent dispute returns 404
  test('POST /v1/issuing/disputes/{dispute}/submit - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/issuing/disputes/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/submit';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});