/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.607Z
 * Endpoints: /v1/accounts/{account}/login_links
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/accounts/{account}/login_links: <p>Creates a login link for a connected account to access the Express Dashboard.</p>

  <p><strong>You can only create login links for accounts that use the <a href="/connect/express-dashboard">Express Dashboard</a> and are connected to your platform</strong>.</p>
  test('POST /v1/accounts/{account}/login_links - Create a login link', async ({ request }) => {
    const endpoint = '/v1/accounts/Pecus adiuvo vilis tutamen curvo vociferor defungo centum benevolentia depromo./login_links';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'account' returns 400
  test('POST /v1/accounts/{account}/login_links - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/login_links';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/accounts/{account}/login_links - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/login_links';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/accounts/{account}/login_links - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/login_links';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/accounts/{account}/login_links - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/login_links';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('POST /v1/accounts/{account}/login_links - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/login_links';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});