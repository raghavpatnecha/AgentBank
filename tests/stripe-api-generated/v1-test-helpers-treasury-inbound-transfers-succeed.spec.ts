/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.637Z
 * Endpoints: /v1/test_helpers/treasury/inbound_transfers/{id}/succeed
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/test_helpers/treasury/inbound_transfers/{id}/succeed: <p>Transitions a test mode created InboundTransfer to the <code>succeeded</code> status. The InboundTransfer must already be in the <code>processing</code> state.</p>
  test('POST /v1/test_helpers/treasury/inbound_transfers/{id}/succeed - Test mode: Succeed an InboundTransfer', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/inbound_transfers/Deripio deludo qui adflicto nulla tabesco occaecati./succeed';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'id' returns 400
  test('POST /v1/test_helpers/treasury/inbound_transfers/{id}/succeed - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/inbound_transfers/{id}/succeed';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/test_helpers/treasury/inbound_transfers/{id}/succeed - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/inbound_transfers/{id}/succeed';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/test_helpers/treasury/inbound_transfers/{id}/succeed - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/inbound_transfers/{id}/succeed';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/test_helpers/treasury/inbound_transfers/{id}/succeed - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/inbound_transfers/{id}/succeed';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('POST /v1/test_helpers/treasury/inbound_transfers/{id}/succeed - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/inbound_transfers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/succeed';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});