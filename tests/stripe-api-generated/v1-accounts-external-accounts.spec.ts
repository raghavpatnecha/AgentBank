/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.607Z
 * Endpoints: /v1/accounts/{account}/external_accounts, /v1/accounts/{account}/external_accounts/{id}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 30
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/accounts/{account}/external_accounts: <p>List external accounts for an account.</p>
  test('GET /v1/accounts/{account}/external_accounts - List all external accounts', async ({ request }) => {
    const endpoint = '/v1/accounts/Voluptate ars creptio volutabrum sit./external_accounts';

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
  });

  // Happy path test for POST /v1/accounts/{account}/external_accounts: <p>Create an external account for a given account.</p>
  test('POST /v1/accounts/{account}/external_accounts - Create an external account', async ({ request }) => {
    const endpoint = '/v1/accounts/Voro celo toties./external_accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/accounts/{account}/external_accounts/{id}: <p>Retrieve a specified external account for a given account.</p>
  test('GET /v1/accounts/{account}/external_accounts/{id} - Retrieve an external account', async ({ request }) => {
    const endpoint = '/v1/accounts/Cohaero vulgus virgo ex cumque vapulus truculenter sursum./external_accounts/Pectus accusator stella adeptio rem amor dapifer t';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/accounts/{account}/external_accounts/{id}: <p>Updates the metadata, account holder name, account holder type of a bank account belonging to
  a connected account and optionally sets it as the default for its currency. Other bank account
  details are not editable by design.</p>

  <p>You can only update bank accounts when <a href="/api/accounts/object#account_object-controller-requirement_collection">account.controller.requirement_collection</a> is <code>application</code>, which includes <a href="/connect/custom-accounts">Custom accounts</a>.</p>

  <p>You can re-enable a disabled bank account by performing an update call without providing any
  arguments or changes.</p>
  test('POST /v1/accounts/{account}/external_accounts/{id} - external_accounts by ID', async ({ request }) => {
    const endpoint = '/v1/accounts/Inventore desolo subvenio./external_accounts/Claustrum thesis utrum summa.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/accounts/{account}/external_accounts/{id}: <p>Delete a specified external account for a given account.</p>
  test('DELETE /v1/accounts/{account}/external_accounts/{id} - Delete an external account', async ({ request }) => {
    const endpoint = '/v1/accounts/Administratio aro admitto aliquam titulus sub calamitas ad aestus vae./external_accounts/Condico sequi vicissitudo talis decumbo bene creo ';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'account' returns 400
  test('GET /v1/accounts/{account}/external_accounts - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/accounts/{account}/external_accounts - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/accounts/{account}/external_accounts - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/accounts/{account}/external_accounts - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('GET /v1/accounts/{account}/external_accounts - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/external_accounts';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('POST /v1/accounts/{account}/external_accounts - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/accounts/{account}/external_accounts - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/accounts/{account}/external_accounts - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/accounts/{account}/external_accounts - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('POST /v1/accounts/{account}/external_accounts - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/external_accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('GET /v1/accounts/{account}/external_accounts/{id} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/accounts/{account}/external_accounts/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/accounts/{account}/external_accounts/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/accounts/{account}/external_accounts/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('GET /v1/accounts/{account}/external_accounts/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/external_accounts/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('POST /v1/accounts/{account}/external_accounts/{id} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/accounts/{account}/external_accounts/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/accounts/{account}/external_accounts/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/accounts/{account}/external_accounts/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('POST /v1/accounts/{account}/external_accounts/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/external_accounts/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('DELETE /v1/accounts/{account}/external_accounts/{id} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/accounts/{account}/external_accounts/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/accounts/{account}/external_accounts/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts/{id}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/accounts/{account}/external_accounts/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/external_accounts/{id}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('DELETE /v1/accounts/{account}/external_accounts/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/external_accounts/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});