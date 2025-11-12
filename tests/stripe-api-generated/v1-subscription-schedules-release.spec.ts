/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.630Z
 * Endpoints: /v1/subscription_schedules/{schedule}/release
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/subscription_schedules/{schedule}/release: <p>Releases the subscription schedule immediately, which will stop scheduling of its phases, but leave any existing subscription in place. A schedule can only be released if its status is <code>not_started</code> or <code>active</code>. If the subscription schedule is currently associated with a subscription, releasing it will remove its <code>subscription</code> property and set the subscription’s ID to the <code>released_subscription</code> property.</p>
  test('POST /v1/subscription_schedules/{schedule}/release - Release a schedule', async ({ request }) => {
    const endpoint = '/v1/subscription_schedules/Asper apparatus coaegresco comes./release';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'schedule' returns 400
  test('POST /v1/subscription_schedules/{schedule}/release - missing required parameter 'schedule' (400)', async ({ request }) => {
    const endpoint = '/v1/subscription_schedules/{schedule}/release';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/subscription_schedules/{schedule}/release - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/subscription_schedules/{schedule}/release';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/subscription_schedules/{schedule}/release - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/subscription_schedules/{schedule}/release';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/subscription_schedules/{schedule}/release - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/subscription_schedules/{schedule}/release';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent schedule returns 404
  test('POST /v1/subscription_schedules/{schedule}/release - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/subscription_schedules/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/release';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});