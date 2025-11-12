/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.615Z
 * Endpoints: /v1/disputes/{dispute}/close
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/disputes/{dispute}/close: <p>Closing the dispute for a charge indicates that you do not have any evidence to submit and are essentially dismissing the dispute, acknowledging it as lost.</p>

  <p>The status of the dispute will change from <code>needs_response</code> to <code>lost</code>. <em>Closing a dispute is irreversible</em>.</p>
  test('POST /v1/disputes/{dispute}/close - Close a dispute', async ({ request }) => {
    const endpoint = '/v1/disputes/Votum aspernatur temeritas./close';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'dispute' returns 400
  test('POST /v1/disputes/{dispute}/close - missing required parameter 'dispute' (400)', async ({ request }) => {
    const endpoint = '/v1/disputes/{dispute}/close';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/disputes/{dispute}/close - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/disputes/{dispute}/close';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/disputes/{dispute}/close - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/disputes/{dispute}/close';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/disputes/{dispute}/close - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/disputes/{dispute}/close';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent dispute returns 404
  test('POST /v1/disputes/{dispute}/close - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/disputes/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/close';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});