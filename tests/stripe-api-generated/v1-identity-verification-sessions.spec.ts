/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.620Z
 * Endpoints: /v1/identity/verification_sessions, /v1/identity/verification_sessions/{session}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/identity/verification_sessions: <p>Returns a list of VerificationSessions</p>
  test('GET /v1/identity/verification_sessions - List VerificationSessions', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();

    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
    // Validate required fields
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('has_more');
    expect(body).toHaveProperty('object');
    expect(body).toHaveProperty('url');
    // Validate field types and formats
    expect(Array.isArray(body.data)).toBe(true);
    // Validate array response
    expect(Array.isArray(body.data)).toBe(true);
    // Validate array items
    if (body.data.length > 0) {
    }
    expect(typeof body.has_more).toBe('boolean');
    expect(typeof body.object).toBe('string');
    expect(["list"]).toContain(body.object);
    expect(typeof body.url).toBe('string');
    expect(body.url.length).toBeLessThanOrEqual(5000);
    expect(body.url).toMatch(/^/v1/identity/verification_sessions/);
  });

  // Happy path test for POST /v1/identity/verification_sessions: <p>Creates a VerificationSession object.</p>

  <p>After the VerificationSession is created, display a verification modal using the session <code>client_secret</code> or send your users to the session’s <code>url</code>.</p>

  <p>If your API key is in test mode, verification checks won’t actually process, though everything else will occur as if in live mode.</p>

  <p>Related guide: <a href="/docs/identity/verify-identity-documents">Verify your users’ identity documents</a></p>
  test('POST /v1/identity/verification_sessions - Create a VerificationSession', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/identity/verification_sessions/{session}: <p>Retrieves the details of a VerificationSession that was previously created.</p>

  <p>When the session status is <code>requires_input</code>, you can use this method to retrieve a valid
  <code>client_secret</code> or <code>url</code> to allow re-submission.</p>
  test('GET /v1/identity/verification_sessions/{session} - Retrieve a VerificationSession', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/Cogito vaco dedecor tunc dignissimos vulnero crastinus confido nostrum consectetur.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/identity/verification_sessions/{session}: <p>Updates a VerificationSession object.</p>

  <p>When the session status is <code>requires_input</code>, you can use this method to update the
  verification check and options.</p>
  test('POST /v1/identity/verification_sessions/{session} - Update a VerificationSession', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/Tego voluptatum ipsam cras.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/identity/verification_sessions - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/identity/verification_sessions - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/identity/verification_sessions - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/identity/verification_sessions - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/identity/verification_sessions - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/identity/verification_sessions - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'session' returns 400
  test('GET /v1/identity/verification_sessions/{session} - missing required parameter 'session' (400)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/identity/verification_sessions/{session} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/identity/verification_sessions/{session} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/identity/verification_sessions/{session} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent session returns 404
  test('GET /v1/identity/verification_sessions/{session} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'session' returns 400
  test('POST /v1/identity/verification_sessions/{session} - missing required parameter 'session' (400)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/identity/verification_sessions/{session} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/identity/verification_sessions/{session} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/identity/verification_sessions/{session} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent session returns 404
  test('POST /v1/identity/verification_sessions/{session} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});