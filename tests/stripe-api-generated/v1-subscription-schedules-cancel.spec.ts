/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.630Z
 * Endpoints: /v1/subscription_schedules/{schedule}/cancel
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/subscription_schedules/{schedule}/cancel: <p>Cancels a subscription schedule and its associated subscription immediately (if the subscription schedule has an active subscription). A subscription schedule can only be canceled if its status is <code>not_started</code> or <code>active</code>.</p>
  test('POST /v1/subscription_schedules/{schedule}/cancel - Cancel a schedule', async ({ request }) => {
    const endpoint = '/v1/subscription_schedules/Aperio comburo dolores arto cui asperiores uredo talus armarium./cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'schedule' returns 400
  test('POST /v1/subscription_schedules/{schedule}/cancel - missing required parameter 'schedule' (400)', async ({ request }) => {
    const endpoint = '/v1/subscription_schedules/{schedule}/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/subscription_schedules/{schedule}/cancel - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/subscription_schedules/{schedule}/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/subscription_schedules/{schedule}/cancel - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/subscription_schedules/{schedule}/cancel';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/subscription_schedules/{schedule}/cancel - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/subscription_schedules/{schedule}/cancel';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent schedule returns 404
  test('POST /v1/subscription_schedules/{schedule}/cancel - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/subscription_schedules/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/cancel';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});