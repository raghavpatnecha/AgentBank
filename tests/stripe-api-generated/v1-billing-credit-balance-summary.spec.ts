/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.609Z
 * Endpoints: /v1/billing/credit_balance_summary
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions
 * Test count: 5
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/billing/credit_balance_summary: <p>Retrieves the credit balance summary for a customer.</p>
  test('GET /v1/billing/credit_balance_summary - Retrieve the credit balance summary for a customer', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_summary';

    const response = await request.get(endpoint, {
      params: {,
          customer: "Claustrum a quae.",
          filter: {"type":"applicability_scope","applicability_scope":{"prices":[{"id":"Cito auditor amo dedecor armarium audio ea totus vociferor."},{"id":"Ut tam sint aspernatur tutis victoria quo."}]}},
      }
    });

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'customer' returns 400
  test('GET /v1/billing/credit_balance_summary - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_summary';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/billing/credit_balance_summary - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_summary';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/billing/credit_balance_summary - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_summary';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/billing/credit_balance_summary - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/billing/credit_balance_summary';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });
});