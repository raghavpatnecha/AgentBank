/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.637Z
 * Endpoints: /v1/test_helpers/treasury/inbound_transfers/{id}/return
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/test_helpers/treasury/inbound_transfers/{id}/return: <p>Marks the test mode InboundTransfer object as returned and links the InboundTransfer to a ReceivedDebit. The InboundTransfer must already be in the <code>succeeded</code> state.</p>
  test('POST /v1/test_helpers/treasury/inbound_transfers/{id}/return - Test mode: Return an InboundTransfer', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/inbound_transfers/Sustineo thesaurus cupio magnam attonbitus conqueror ambitus suppono curso condico./return';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'id' returns 400
  test('POST /v1/test_helpers/treasury/inbound_transfers/{id}/return - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/inbound_transfers/{id}/return';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/test_helpers/treasury/inbound_transfers/{id}/return - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/inbound_transfers/{id}/return';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/test_helpers/treasury/inbound_transfers/{id}/return - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/inbound_transfers/{id}/return';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/test_helpers/treasury/inbound_transfers/{id}/return - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/inbound_transfers/{id}/return';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('POST /v1/test_helpers/treasury/inbound_transfers/{id}/return - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/treasury/inbound_transfers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/return';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});