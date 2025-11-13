/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.614Z
 * Endpoints: /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 12
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount: API operation
  test('GET /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount - discount', async ({ request }) => {
    const endpoint = '/v1/customers/Rem aequitas cupiditate debitis corrumpo urbanus./subscriptions/Admiratio vero taceo pectus./discount';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount: <p>Removes the currently applied discount on a customer.</p>
  test('DELETE /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount - Delete a customer discount', async ({ request }) => {
    const endpoint = '/v1/customers/Depopulo conservo acceptus./subscriptions/Clarus somniculosus arto canis tempore conitor clam tabesco./discount';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'customer' returns 400
  test('GET /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('GET /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/subscriptions/{subscription_exposed_id}/discount';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('DELETE /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('DELETE /v1/customers/{customer}/subscriptions/{subscription_exposed_id}/discount - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/subscriptions/{subscription_exposed_id}/discount';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});