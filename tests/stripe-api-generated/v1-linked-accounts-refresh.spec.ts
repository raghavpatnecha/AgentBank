/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.624Z
 * Endpoints: /v1/linked_accounts/{account}/refresh
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/linked_accounts/{account}/refresh: <p>Refreshes the data associated with a Financial Connections <code>Account</code>.</p>
  test('POST /v1/linked_accounts/{account}/refresh - Refresh Account data', async ({ request }) => {
    const endpoint = '/v1/linked_accounts/Deserunt audeo natus civis adversus culpa ustulo./refresh';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'account' returns 400
  test('POST /v1/linked_accounts/{account}/refresh - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/linked_accounts/{account}/refresh';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/linked_accounts/{account}/refresh - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/linked_accounts/{account}/refresh';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/linked_accounts/{account}/refresh - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/linked_accounts/{account}/refresh';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/linked_accounts/{account}/refresh - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/linked_accounts/{account}/refresh';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('POST /v1/linked_accounts/{account}/refresh - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/linked_accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/refresh';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});