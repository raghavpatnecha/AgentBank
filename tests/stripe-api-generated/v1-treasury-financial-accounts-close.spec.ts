/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.639Z
 * Endpoints: /v1/treasury/financial_accounts/{financial_account}/close
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/treasury/financial_accounts/{financial_account}/close: <p>Closes a FinancialAccount. A FinancialAccount can only be closed if it has a zero balance, has no pending InboundTransfers, and has canceled all attached Issuing cards.</p>
  test('POST /v1/treasury/financial_accounts/{financial_account}/close - Close a FinancialAccount', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/Voluptas bos peior adipisci consequatur confero solium cursim./close';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'financial_account' returns 400
  test('POST /v1/treasury/financial_accounts/{financial_account}/close - missing required parameter 'financial_account' (400)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}/close';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/treasury/financial_accounts/{financial_account}/close - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}/close';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/treasury/financial_accounts/{financial_account}/close - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}/close';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/treasury/financial_accounts/{financial_account}/close - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}/close';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent financial_account returns 404
  test('POST /v1/treasury/financial_accounts/{financial_account}/close - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/close';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});