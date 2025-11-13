/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.627Z
 * Endpoints: /v1/quotes/{quote}/cancel
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/quotes/{quote}/cancel: <p>Cancels the quote.</p>
  test('POST /v1/quotes/{quote}/cancel - Cancel a quote', async ({ request }) => {
    const endpoint = '/v1/quotes/Aestas asperiores aegre vere thesis accusator aestus./cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'quote' returns 400
  test('POST /v1/quotes/{quote}/cancel - missing required parameter 'quote' (400)', async ({ request }) => {
    const endpoint = '/v1/quotes/{quote}/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/quotes/{quote}/cancel - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/quotes/{quote}/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/quotes/{quote}/cancel - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/quotes/{quote}/cancel';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/quotes/{quote}/cancel - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/quotes/{quote}/cancel';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent quote returns 404
  test('POST /v1/quotes/{quote}/cancel - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/quotes/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});