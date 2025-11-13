/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.640Z
 * Endpoints: /v1/treasury/outbound_transfers/{outbound_transfer}/cancel
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/treasury/outbound_transfers/{outbound_transfer}/cancel: <p>An OutboundTransfer can be canceled if the funds have not yet been paid out.</p>
  test('POST /v1/treasury/outbound_transfers/{outbound_transfer}/cancel - Cancel an OutboundTransfer', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers/Ad desino comminor conqueror certe vulnus./cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'outbound_transfer' returns 400
  test('POST /v1/treasury/outbound_transfers/{outbound_transfer}/cancel - missing required parameter 'outbound_transfer' (400)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers/{outbound_transfer}/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/treasury/outbound_transfers/{outbound_transfer}/cancel - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers/{outbound_transfer}/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/treasury/outbound_transfers/{outbound_transfer}/cancel - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers/{outbound_transfer}/cancel';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/treasury/outbound_transfers/{outbound_transfer}/cancel - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers/{outbound_transfer}/cancel';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent outbound_transfer returns 404
  test('POST /v1/treasury/outbound_transfers/{outbound_transfer}/cancel - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});