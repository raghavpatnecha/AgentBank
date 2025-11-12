/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.623Z
 * Endpoints: /v1/linked_accounts, /v1/linked_accounts/{account}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 10
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/linked_accounts: <p>Returns a list of Financial Connections <code>Account</code> objects.</p>
  test('GET /v1/linked_accounts - List Accounts', async ({ request }) => {
    const endpoint = '/v1/linked_accounts';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();

    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
    // Validate required fields
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('has_more');
    expect(body).toHaveProperty('object');
    expect(body).toHaveProperty('url');
    // Validate field types and formats
    expect(Array.isArray(body.data)).toBe(true);
    // Validate array response
    expect(Array.isArray(body.data)).toBe(true);
    // Validate array items
    if (body.data.length > 0) {
    }
    expect(typeof body.has_more).toBe('boolean');
    expect(typeof body.object).toBe('string');
    expect(["list"]).toContain(body.object);
    expect(typeof body.url).toBe('string');
    expect(body.url.length).toBeLessThanOrEqual(5000);
    expect(body.url).toMatch(/^/v1/financial_connections/accounts/);
  });

  // Happy path test for GET /v1/linked_accounts/{account}: <p>Retrieves the details of an Financial Connections <code>Account</code>.</p>
  test('GET /v1/linked_accounts/{account} - Retrieve an Account', async ({ request }) => {
    const endpoint = '/v1/linked_accounts/Advenio demitto facilis beatae.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/linked_accounts - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/linked_accounts';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/linked_accounts - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/linked_accounts';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/linked_accounts - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/linked_accounts';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('GET /v1/linked_accounts/{account} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/linked_accounts/{account}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/linked_accounts/{account} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/linked_accounts/{account}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/linked_accounts/{account} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/linked_accounts/{account}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/linked_accounts/{account} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/linked_accounts/{account}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('GET /v1/linked_accounts/{account} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/linked_accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});