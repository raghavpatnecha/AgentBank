/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.619Z
 * Endpoints: /v1/external_accounts/{id}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/external_accounts/{id}: <p>Updates the metadata, account holder name, account holder type of a bank account belonging to
  a connected account and optionally sets it as the default for its currency. Other bank account
  details are not editable by design.</p>

  <p>You can only update bank accounts when <a href="/api/accounts/object#account_object-controller-requirement_collection">account.controller.requirement_collection</a> is <code>application</code>, which includes <a href="/connect/custom-accounts">Custom accounts</a>.</p>

  <p>You can re-enable a disabled bank account by performing an update call without providing any
  arguments or changes.</p>
  test('POST /v1/external_accounts/{id} - external_accounts by ID', async ({ request }) => {
    const endpoint = '/v1/external_accounts/Aggredior corrumpo dicta combibo vel atque.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'id' returns 400
  test('POST /v1/external_accounts/{id} - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/external_accounts/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/external_accounts/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/external_accounts/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/external_accounts/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/external_accounts/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/external_accounts/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/external_accounts/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('POST /v1/external_accounts/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/external_accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});