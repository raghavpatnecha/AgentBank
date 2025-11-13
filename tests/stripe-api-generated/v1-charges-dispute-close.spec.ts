/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.611Z
 * Endpoints: /v1/charges/{charge}/dispute/close
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/charges/{charge}/dispute/close: API operation
  test('POST /v1/charges/{charge}/dispute/close - close', async ({ request }) => {
    const endpoint = '/v1/charges/Cohors vigor valde tergo sulum./dispute/close';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'charge' returns 400
  test('POST /v1/charges/{charge}/dispute/close - missing required parameter 'charge' (400)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/dispute/close';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/charges/{charge}/dispute/close - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/dispute/close';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/charges/{charge}/dispute/close - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/dispute/close';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/charges/{charge}/dispute/close - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/dispute/close';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent charge returns 404
  test('POST /v1/charges/{charge}/dispute/close - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/charges/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/dispute/close';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});