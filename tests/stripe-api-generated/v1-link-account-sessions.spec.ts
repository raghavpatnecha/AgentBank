/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.623Z
 * Endpoints: /v1/link_account_sessions, /v1/link_account_sessions/{session}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 10
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/link_account_sessions: <p>To launch the Financial Connections authorization flow, create a <code>Session</code>. The session’s <code>client_secret</code> can be used to launch the flow using Stripe.js.</p>
  test('POST /v1/link_account_sessions - Create a Session', async ({ request }) => {
    const endpoint = '/v1/link_account_sessions';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/link_account_sessions/{session}: <p>Retrieves the details of a Financial Connections <code>Session</code></p>
  test('GET /v1/link_account_sessions/{session} - Retrieve a Session', async ({ request }) => {
    const endpoint = '/v1/link_account_sessions/Supra culpa minus tibi appositus accusamus arcus absorbeo arceo.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/link_account_sessions - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/link_account_sessions';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/link_account_sessions - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/link_account_sessions';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/link_account_sessions - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/link_account_sessions';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'session' returns 400
  test('GET /v1/link_account_sessions/{session} - missing required parameter 'session' (400)', async ({ request }) => {
    const endpoint = '/v1/link_account_sessions/{session}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/link_account_sessions/{session} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/link_account_sessions/{session}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/link_account_sessions/{session} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/link_account_sessions/{session}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/link_account_sessions/{session} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/link_account_sessions/{session}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent session returns 404
  test('GET /v1/link_account_sessions/{session} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/link_account_sessions/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});