/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.637Z
 * Endpoints: /v1/test_helpers/treasury/outbound_payments/{id}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/test_helpers/treasury/outbound_payments/{id}: <p>Updates a test mode created OutboundPayment with tracking details. The OutboundPayment must not be cancelable, and cannot be in the <code>canceled</code> or <code>failed</code> states.</p>
  test('POST /v1/test_helpers/treasury/outbound_payments/{id} - Test mode: Update an OutboundPayment', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/outbound_payments/Alienus assentator credo tertius.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'id' returns 400
  test('POST /v1/test_helpers/treasury/outbound_payments/{id} - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/outbound_payments/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/test_helpers/treasury/outbound_payments/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/outbound_payments/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/test_helpers/treasury/outbound_payments/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/outbound_payments/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/test_helpers/treasury/outbound_payments/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/outbound_payments/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('POST /v1/test_helpers/treasury/outbound_payments/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/outbound_payments/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});