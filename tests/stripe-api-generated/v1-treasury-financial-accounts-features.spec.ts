/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.639Z
 * Endpoints: /v1/treasury/financial_accounts/{financial_account}/features
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 12
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/treasury/financial_accounts/{financial_account}/features: <p>Retrieves Features information associated with the FinancialAccount.</p>
  test('GET /v1/treasury/financial_accounts/{financial_account}/features - Retrieve FinancialAccount Features', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/Solium adaugeo thalassinus subvenio tepesco./features';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/treasury/financial_accounts/{financial_account}/features: <p>Updates the Features associated with a FinancialAccount.</p>
  test('POST /v1/treasury/financial_accounts/{financial_account}/features - Update FinancialAccount Features', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/Tui totidem adnuo tricesimus./features';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'financial_account' returns 400
  test('GET /v1/treasury/financial_accounts/{financial_account}/features - missing required parameter 'financial_account' (400)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}/features';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/treasury/financial_accounts/{financial_account}/features - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}/features';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/treasury/financial_accounts/{financial_account}/features - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}/features';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/treasury/financial_accounts/{financial_account}/features - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}/features';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent financial_account returns 404
  test('GET /v1/treasury/financial_accounts/{financial_account}/features - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/features';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'financial_account' returns 400
  test('POST /v1/treasury/financial_accounts/{financial_account}/features - missing required parameter 'financial_account' (400)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}/features';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/treasury/financial_accounts/{financial_account}/features - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}/features';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/treasury/financial_accounts/{financial_account}/features - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}/features';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/treasury/financial_accounts/{financial_account}/features - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}/features';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent financial_account returns 404
  test('POST /v1/treasury/financial_accounts/{financial_account}/features - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/features';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});