/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.609Z
 * Endpoints: /v1/billing/alerts/{id}/deactivate
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/billing/alerts/{id}/deactivate: <p>Deactivates this alert, preventing it from triggering.</p>
  test('POST /v1/billing/alerts/{id}/deactivate - Deactivate a billing alert', async ({ request }) => {
    const endpoint = '/v1/billing/alerts/Adnuo culpo caste aranea verbum carbo./deactivate';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'id' returns 400
  test('POST /v1/billing/alerts/{id}/deactivate - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/billing/alerts/{id}/deactivate';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/billing/alerts/{id}/deactivate - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/billing/alerts/{id}/deactivate';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/billing/alerts/{id}/deactivate - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/billing/alerts/{id}/deactivate';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/billing/alerts/{id}/deactivate - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/billing/alerts/{id}/deactivate';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('POST /v1/billing/alerts/{id}/deactivate - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/billing/alerts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/deactivate';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});