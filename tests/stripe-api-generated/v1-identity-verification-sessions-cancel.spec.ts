/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.620Z
 * Endpoints: /v1/identity/verification_sessions/{session}/cancel
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/identity/verification_sessions/{session}/cancel: <p>A VerificationSession object can be canceled when it is in <code>requires_input</code> <a href="/docs/identity/how-sessions-work">status</a>.</p>

  <p>Once canceled, future submission attempts are disabled. This cannot be undone. <a href="/docs/identity/verification-sessions#cancel">Learn more</a>.</p>
  test('POST /v1/identity/verification_sessions/{session}/cancel - Cancel a VerificationSession', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/Quis acidus advenio iusto causa carbo./cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'session' returns 400
  test('POST /v1/identity/verification_sessions/{session}/cancel - missing required parameter 'session' (400)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/identity/verification_sessions/{session}/cancel - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/identity/verification_sessions/{session}/cancel - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}/cancel';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/identity/verification_sessions/{session}/cancel - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}/cancel';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent session returns 404
  test('POST /v1/identity/verification_sessions/{session}/cancel - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});