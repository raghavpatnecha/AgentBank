/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.639Z
 * Endpoints: /v1/treasury/financial_accounts, /v1/treasury/financial_accounts/{financial_account}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/treasury/financial_accounts: <p>Returns a list of FinancialAccounts.</p>
  test('GET /v1/treasury/financial_accounts - List all FinancialAccounts', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts';

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
    expect(body.url).toMatch(/^/v1/treasury/financial_accounts/);
  });

  // Happy path test for POST /v1/treasury/financial_accounts: <p>Creates a new FinancialAccount. Each connected account can have up to three FinancialAccounts by default.</p>
  test('POST /v1/treasury/financial_accounts - Create a FinancialAccount', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/treasury/financial_accounts/{financial_account}: <p>Retrieves the details of a FinancialAccount.</p>
  test('GET /v1/treasury/financial_accounts/{financial_account} - Retrieve a FinancialAccount', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/Audacia consuasor adulescens cattus volo accedo demergo.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/treasury/financial_accounts/{financial_account}: <p>Updates the details of a FinancialAccount.</p>
  test('POST /v1/treasury/financial_accounts/{financial_account} - Update a FinancialAccount', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/Acidus aetas delectatio ullam utilis.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/treasury/financial_accounts - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/treasury/financial_accounts - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/treasury/financial_accounts - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/treasury/financial_accounts - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/treasury/financial_accounts - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/treasury/financial_accounts - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'financial_account' returns 400
  test('GET /v1/treasury/financial_accounts/{financial_account} - missing required parameter 'financial_account' (400)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/treasury/financial_accounts/{financial_account} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/treasury/financial_accounts/{financial_account} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/treasury/financial_accounts/{financial_account} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent financial_account returns 404
  test('GET /v1/treasury/financial_accounts/{financial_account} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'financial_account' returns 400
  test('POST /v1/treasury/financial_accounts/{financial_account} - missing required parameter 'financial_account' (400)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/treasury/financial_accounts/{financial_account} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/treasury/financial_accounts/{financial_account} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/treasury/financial_accounts/{financial_account} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/{financial_account}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent financial_account returns 404
  test('POST /v1/treasury/financial_accounts/{financial_account} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/treasury/financial_accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});