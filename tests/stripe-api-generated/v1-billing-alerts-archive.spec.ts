/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.609Z
 * Endpoints: /v1/billing/alerts/{id}/archive
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/billing/alerts/{id}/archive: <p>Archives this alert, removing it from the list view and APIs. This is non-reversible.</p>
  test('POST /v1/billing/alerts/{id}/archive - Archive a billing alert', async ({ request }) => {
    const endpoint = '/v1/billing/alerts/Asperiores attollo spiritus facilis quos defaeco damnatio./archive';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'id' returns 400
  test('POST /v1/billing/alerts/{id}/archive - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/billing/alerts/{id}/archive';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/billing/alerts/{id}/archive - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/billing/alerts/{id}/archive';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/billing/alerts/{id}/archive - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/billing/alerts/{id}/archive';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/billing/alerts/{id}/archive - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/billing/alerts/{id}/archive';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('POST /v1/billing/alerts/{id}/archive - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/billing/alerts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/archive';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});