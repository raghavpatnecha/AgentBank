/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.637Z
 * Endpoints: /v1/test_helpers/issuing/cards/{card}/shipping/submit
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/test_helpers/issuing/cards/{card}/shipping/submit: <p>Updates the shipping status of the specified Issuing <code>Card</code> object to <code>submitted</code>. This method requires Stripe Version ‘2024-09-30.acacia’ or later.</p>
  test('POST /v1/test_helpers/issuing/cards/{card}/shipping/submit - Submit a testmode card', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/cards/Amplexus apto urbanus audio saepe corpus./shipping/submit';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'card' returns 400
  test('POST /v1/test_helpers/issuing/cards/{card}/shipping/submit - missing required parameter 'card' (400)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/cards/{card}/shipping/submit';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/test_helpers/issuing/cards/{card}/shipping/submit - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/cards/{card}/shipping/submit';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/test_helpers/issuing/cards/{card}/shipping/submit - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/cards/{card}/shipping/submit';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/test_helpers/issuing/cards/{card}/shipping/submit - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/cards/{card}/shipping/submit';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent card returns 404
  test('POST /v1/test_helpers/issuing/cards/{card}/shipping/submit - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/cards/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/shipping/submit';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});