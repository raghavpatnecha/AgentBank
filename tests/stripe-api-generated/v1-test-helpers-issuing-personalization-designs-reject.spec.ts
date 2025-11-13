/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.637Z
 * Endpoints: /v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject: <p>Updates the <code>status</code> of the specified testmode personalization design object to <code>rejected</code>.</p>
  test('POST /v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject - Reject a testmode personalization design', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/personalization_designs/Uredo magni cotidie cohibeo./reject';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'personalization_design' returns 400
  test('POST /v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject - missing required parameter 'personalization_design' (400)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent personalization_design returns 404
  test('POST /v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/test_helpers/issuing/personalization_designs/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/reject';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});