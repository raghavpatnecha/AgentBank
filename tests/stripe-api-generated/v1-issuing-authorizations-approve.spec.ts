/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.622Z
 * Endpoints: /v1/issuing/authorizations/{authorization}/approve
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/issuing/authorizations/{authorization}/approve: <p>[Deprecated] Approves a pending Issuing <code>Authorization</code> object. This request should be made within the timeout window of the <a href="/docs/issuing/controls/real-time-authorizations">real-time authorization</a> flow. 
  This method is deprecated. Instead, <a href="/docs/issuing/controls/real-time-authorizations#authorization-handling">respond directly to the webhook request to approve an authorization</a>.</p>
  test('POST /v1/issuing/authorizations/{authorization}/approve - Approve an authorization', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/Desino vinco cohaero turbo utrimque corrupti./approve';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'authorization' returns 400
  test('POST /v1/issuing/authorizations/{authorization}/approve - missing required parameter 'authorization' (400)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/{authorization}/approve';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/issuing/authorizations/{authorization}/approve - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/{authorization}/approve';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/issuing/authorizations/{authorization}/approve - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/{authorization}/approve';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/issuing/authorizations/{authorization}/approve - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/{authorization}/approve';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent authorization returns 404
  test('POST /v1/issuing/authorizations/{authorization}/approve - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/issuing/authorizations/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/approve';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});