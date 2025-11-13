/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.636Z
 * Endpoints: /v1/test_helpers/issuing/cards/{card}/shipping/ship
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/test_helpers/issuing/cards/{card}/shipping/ship: <p>Updates the shipping status of the specified Issuing <code>Card</code> object to <code>shipped</code>.</p>
  test('POST /v1/test_helpers/issuing/cards/{card}/shipping/ship - Ship a testmode card', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/cards/Attonbitus crudelis allatus neque denuncio venustas tristis./shipping/ship';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'card' returns 400
  test('POST /v1/test_helpers/issuing/cards/{card}/shipping/ship - missing required parameter 'card' (400)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/cards/{card}/shipping/ship';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/test_helpers/issuing/cards/{card}/shipping/ship - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/cards/{card}/shipping/ship';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/test_helpers/issuing/cards/{card}/shipping/ship - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/cards/{card}/shipping/ship';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/test_helpers/issuing/cards/{card}/shipping/ship - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/cards/{card}/shipping/ship';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent card returns 404
  test('POST /v1/test_helpers/issuing/cards/{card}/shipping/ship - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/cards/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/shipping/ship';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});