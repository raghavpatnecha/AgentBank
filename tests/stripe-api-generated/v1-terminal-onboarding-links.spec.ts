/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.635Z
 * Endpoints: /v1/terminal/onboarding_links
 * Tags: error, 401, auth, invalid-token, 403, permissions
 * Test count: 4
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/terminal/onboarding_links: <p>Creates a new <code>OnboardingLink</code> object that contains a redirect_url used for onboarding onto Tap to Pay on iPhone.</p>
  test('POST /v1/terminal/onboarding_links - Create an Onboarding Link', async ({ request }) => {
    const endpoint = '/v1/terminal/onboarding_links';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/terminal/onboarding_links - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/onboarding_links';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/terminal/onboarding_links - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/terminal/onboarding_links';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/terminal/onboarding_links - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/terminal/onboarding_links';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });
});