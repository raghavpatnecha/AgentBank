/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.606Z
 * Endpoints: /v1/accounts/{account}/bank_accounts, /v1/accounts/{account}/bank_accounts/{id}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 24
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/accounts/{account}/bank_accounts: <p>Create an external account for a given account.</p>
  test('POST /v1/accounts/{account}/bank_accounts - Create an external account', async ({ request }) => {
    const endpoint = '/v1/accounts/Arbitro arbitro demulceo demitto error vito subvenio./bank_accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/accounts/{account}/bank_accounts/{id}: <p>Retrieve a specified external account for a given account.</p>
  test('GET /v1/accounts/{account}/bank_accounts/{id} - Retrieve an external account', async ({ request }) => {
    const endpoint = '/v1/accounts/Dedecor sub vallum aedificium vis vos./bank_accounts/Denique strenuus patrocinor cultura umbra quas cel';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/accounts/{account}/bank_accounts/{id}: <p>Updates the metadata, account holder name, account holder type of a bank account belonging to
  a connected account and optionally sets it as the default for its currency. Other bank account
  details are not editable by design.</p>

  <p>You can only update bank accounts when <a href="/api/accounts/object#account_object-controller-requirement_collection">account.controller.requirement_collection</a> is <code>application</code>, which includes <a href="/connect/custom-accounts">Custom accounts</a>.</p>

  <p>You can re-enable a disabled bank account by performing an update call without providing any
  arguments or changes.</p>
  test('POST /v1/accounts/{account}/bank_accounts/{id} - bank_accounts by ID', async ({ request }) => {
    const endpoint = '/v1/accounts/Asperiores bis volo curatio sequi strues timidus repellendus demoror./bank_accounts/Texo vomito templum clibanus.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/accounts/{account}/bank_accounts/{id}: <p>Delete a specified external account for a given account.</p>
  test('DELETE /v1/accounts/{account}/bank_accounts/{id} - Delete an external account', async ({ request }) => {
    const endpoint = '/v1/accounts/Dedecor thymum vita supra baiulus sollicito calcar terga agnosco./bank_accounts/Corroboro volva statua desino attonbitus caste qua';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'account' returns 400
  test('POST /v1/accounts/{account}/bank_accounts - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/accounts/{account}/bank_accounts - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/accounts/{account}/bank_accounts - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/accounts/{account}/bank_accounts - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('POST /v1/accounts/{account}/bank_accounts - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/bank_accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('GET /v1/accounts/{account}/bank_accounts/{id} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/accounts/{account}/bank_accounts/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/accounts/{account}/bank_accounts/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/accounts/{account}/bank_accounts/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('GET /v1/accounts/{account}/bank_accounts/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/bank_accounts/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('POST /v1/accounts/{account}/bank_accounts/{id} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/accounts/{account}/bank_accounts/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/accounts/{account}/bank_accounts/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/accounts/{account}/bank_accounts/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('POST /v1/accounts/{account}/bank_accounts/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/bank_accounts/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('DELETE /v1/accounts/{account}/bank_accounts/{id} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/accounts/{account}/bank_accounts/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/accounts/{account}/bank_accounts/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts/{id}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/accounts/{account}/bank_accounts/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/bank_accounts/{id}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('DELETE /v1/accounts/{account}/bank_accounts/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/bank_accounts/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});