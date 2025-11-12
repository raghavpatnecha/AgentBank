/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.631Z
 * Endpoints: /v1/subscriptions/{subscription_exposed_id}/discount
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for DELETE /v1/subscriptions/{subscription_exposed_id}/discount: <p>Removes the currently applied discount on a subscription.</p>
  test('DELETE /v1/subscriptions/{subscription_exposed_id}/discount - Delete a subscription discount', async ({ request }) => {
    const endpoint = '/v1/subscriptions/Cornu trepide constans somnus atque coniecto dolore./discount';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'subscription_exposed_id' returns 400
  test('DELETE /v1/subscriptions/{subscription_exposed_id}/discount - missing required parameter 'subscription_exposed_id' (400)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}/discount';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/subscriptions/{subscription_exposed_id}/discount - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}/discount';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/subscriptions/{subscription_exposed_id}/discount - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}/discount';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/subscriptions/{subscription_exposed_id}/discount - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}/discount';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent subscription_exposed_id returns 404
  test('DELETE /v1/subscriptions/{subscription_exposed_id}/discount - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/discount';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});