/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.606Z
 * Endpoints: /v1/accounts, /v1/accounts/{account}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 26
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/accounts: <p>Returns a list of accounts connected to your platform via <a href="/docs/connect">Connect</a>. If you’re not a platform, the list is empty.</p>
  test('GET /v1/accounts - List all connected accounts', async ({ request }) => {
    const endpoint = '/v1/accounts';

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
    expect(body.url).toMatch(/^/v1/accounts/);
  });

  // Happy path test for POST /v1/accounts: <p>With <a href="/docs/connect">Connect</a>, you can create Stripe accounts for your users.
  To do this, you’ll first need to <a href="https://dashboard.stripe.com/account/applications/settings">register your platform</a>.</p>

  <p>If you’ve already collected information for your connected accounts, you <a href="/docs/connect/best-practices#onboarding">can prefill that information</a> when
  creating the account. Connect Onboarding won’t ask for the prefilled information during account onboarding.
  You can prefill any information on the account.</p>
  test('POST /v1/accounts - accounts', async ({ request }) => {
    const endpoint = '/v1/accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/accounts/{account}: <p>Retrieves the details of an account.</p>
  test('GET /v1/accounts/{account} - Retrieve account', async ({ request }) => {
    const endpoint = '/v1/accounts/Cohibeo ater timor claro libero vinco assumenda.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/accounts/{account}: <p>Updates a <a href="/connect/accounts">connected account</a> by setting the values of the parameters passed. Any parameters not provided are
  left unchanged.</p>

  <p>For accounts where <a href="/api/accounts/object#account_object-controller-requirement_collection">controller.requirement_collection</a>
  is <code>application</code>, which includes Custom accounts, you can update any information on the account.</p>

  <p>For accounts where <a href="/api/accounts/object#account_object-controller-requirement_collection">controller.requirement_collection</a>
  is <code>stripe</code>, which includes Standard and Express accounts, you can update all information until you create
  an <a href="/api/account_links">Account Link</a> or <a href="/api/account_sessions">Account Session</a> to start Connect onboarding,
  after which some properties can no longer be updated.</p>

  <p>To update your own account, use the <a href="https://dashboard.stripe.com/settings/account">Dashboard</a>. Refer to our
  <a href="/docs/connect/updating-accounts">Connect</a> documentation to learn more about updating accounts.</p>
  test('POST /v1/accounts/{account} - Update an account', async ({ request }) => {
    const endpoint = '/v1/accounts/Decens blanditiis sto synagoga cado adulatio celer terga.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/accounts/{account}: <p>With <a href="/connect">Connect</a>, you can delete accounts you manage.</p>

  <p>Test-mode accounts can be deleted at any time.</p>

  <p>Live-mode accounts that have access to the standard dashboard and Stripe is responsible for negative account balances cannot be deleted, which includes Standard accounts. All other Live-mode accounts, can be deleted when all <a href="/api/balance/balance_object">balances</a> are zero.</p>

  <p>If you want to delete your own account, use the <a href="https://dashboard.stripe.com/settings/account">account information tab in your account settings</a> instead.</p>
  test('DELETE /v1/accounts/{account} - Delete an account', async ({ request }) => {
    const endpoint = '/v1/accounts/Adsuesco vorago alias congregatio sunt bis copia.';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/accounts - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/accounts - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/accounts - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/accounts - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/accounts - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/accounts - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('GET /v1/accounts/{account} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/accounts/{account} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/accounts/{account} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/accounts/{account} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('GET /v1/accounts/{account} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('POST /v1/accounts/{account} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/accounts/{account} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/accounts/{account} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/accounts/{account} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('POST /v1/accounts/{account} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('DELETE /v1/accounts/{account} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/accounts/{account} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/accounts/{account} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/accounts/{account} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('DELETE /v1/accounts/{account} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});