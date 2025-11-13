/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.619Z
 * Endpoints: /v1/financial_connections/accounts/{account}/subscribe
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/financial_connections/accounts/{account}/subscribe: <p>Subscribes to periodic refreshes of data associated with a Financial Connections <code>Account</code>. When the account status is active, data is typically refreshed once a day.</p>
  test('POST /v1/financial_connections/accounts/{account}/subscribe - Subscribe to data refreshes for an Account', async ({ request }) => {
    const endpoint = '/v1/financial_connections/accounts/Odio abeo quia suffoco curvo./subscribe';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'account' returns 400
  test('POST /v1/financial_connections/accounts/{account}/subscribe - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/financial_connections/accounts/{account}/subscribe';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/financial_connections/accounts/{account}/subscribe - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/financial_connections/accounts/{account}/subscribe';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/financial_connections/accounts/{account}/subscribe - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/financial_connections/accounts/{account}/subscribe';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/financial_connections/accounts/{account}/subscribe - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/financial_connections/accounts/{account}/subscribe';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('POST /v1/financial_connections/accounts/{account}/subscribe - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/financial_connections/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/subscribe';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});