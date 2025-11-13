/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.613Z
 * Endpoints: /v1/customers/{customer}/bank_accounts/{id}/verify
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/customers/{customer}/bank_accounts/{id}/verify: <p>Verify a specified bank account for a given customer.</p>
  test('POST /v1/customers/{customer}/bank_accounts/{id}/verify - Verify a bank account', async ({ request }) => {
    const endpoint = '/v1/customers/Tenax solitudo amita circumvenio thorax tenuis./bank_accounts/Campana aranea terra./verify';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'customer' returns 400
  test('POST /v1/customers/{customer}/bank_accounts/{id}/verify - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}/verify';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/customers/{customer}/bank_accounts/{id}/verify - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}/verify';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/customers/{customer}/bank_accounts/{id}/verify - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}/verify';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/customers/{customer}/bank_accounts/{id}/verify - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}/verify';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('POST /v1/customers/{customer}/bank_accounts/{id}/verify - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/bank_accounts/{id}/verify';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});