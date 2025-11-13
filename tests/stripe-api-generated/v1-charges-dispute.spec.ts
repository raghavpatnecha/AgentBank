/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.610Z
 * Endpoints: /v1/charges/{charge}/dispute
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 12
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/charges/{charge}/dispute: <p>Retrieve a dispute for a specified charge.</p>
  test('GET /v1/charges/{charge}/dispute - dispute', async ({ request }) => {
    const endpoint = '/v1/charges/Campana toties voluptate perspiciatis voluptates nihil dapifer coerceo./dispute';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/charges/{charge}/dispute: API operation
  test('POST /v1/charges/{charge}/dispute - dispute', async ({ request }) => {
    const endpoint = '/v1/charges/Neque velociter tot centum creator campana quaerat./dispute';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'charge' returns 400
  test('GET /v1/charges/{charge}/dispute - missing required parameter 'charge' (400)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/dispute';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/charges/{charge}/dispute - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/dispute';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/charges/{charge}/dispute - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/dispute';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/charges/{charge}/dispute - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/dispute';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent charge returns 404
  test('GET /v1/charges/{charge}/dispute - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/charges/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/dispute';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'charge' returns 400
  test('POST /v1/charges/{charge}/dispute - missing required parameter 'charge' (400)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/dispute';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/charges/{charge}/dispute - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/dispute';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/charges/{charge}/dispute - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/dispute';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/charges/{charge}/dispute - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/dispute';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent charge returns 404
  test('POST /v1/charges/{charge}/dispute - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/charges/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/dispute';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});