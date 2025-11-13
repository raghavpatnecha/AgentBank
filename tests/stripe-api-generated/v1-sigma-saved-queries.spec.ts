/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.629Z
 * Endpoints: /v1/sigma/saved_queries/{id}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/sigma/saved_queries/{id}: <p>Update an existing Sigma query that previously exists</p>
  test('POST /v1/sigma/saved_queries/{id} - Update an existing Sigma Query', async ({ request }) => {
    const endpoint = '/v1/sigma/saved_queries/Coepi custodia condico cohaero sulum cunctatio animi laudantium vos amitto.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'id' returns 400
  test('POST /v1/sigma/saved_queries/{id} - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/sigma/saved_queries/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/sigma/saved_queries/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/sigma/saved_queries/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/sigma/saved_queries/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/sigma/saved_queries/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/sigma/saved_queries/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/sigma/saved_queries/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('POST /v1/sigma/saved_queries/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/sigma/saved_queries/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});