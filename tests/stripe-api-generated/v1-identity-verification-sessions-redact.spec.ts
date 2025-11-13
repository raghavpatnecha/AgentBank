/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.620Z
 * Endpoints: /v1/identity/verification_sessions/{session}/redact
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/identity/verification_sessions/{session}/redact: <p>Redact a VerificationSession to remove all collected information from Stripe. This will redact
  the VerificationSession and all objects related to it, including VerificationReports, Events,
  request logs, etc.</p>

  <p>A VerificationSession object can be redacted when it is in <code>requires_input</code> or <code>verified</code>
  <a href="/docs/identity/how-sessions-work">status</a>. Redacting a VerificationSession in <code>requires_action</code>
  state will automatically cancel it.</p>

  <p>The redaction process may take up to four days. When the redaction process is in progress, the
  VerificationSession’s <code>redaction.status</code> field will be set to <code>processing</code>; when the process is
  finished, it will change to <code>redacted</code> and an <code>identity.verification_session.redacted</code> event
  will be emitted.</p>

  <p>Redaction is irreversible. Redacted objects are still accessible in the Stripe API, but all the
  fields that contain personal data will be replaced by the string <code>[redacted]</code> or a similar
  placeholder. The <code>metadata</code> field will also be erased. Redacted objects cannot be updated or
  used for any purpose.</p>

  <p><a href="/docs/identity/verification-sessions#redact">Learn more</a>.</p>
  test('POST /v1/identity/verification_sessions/{session}/redact - Redact a VerificationSession', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/Arcus quis dolor labore cado cetera./redact';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'session' returns 400
  test('POST /v1/identity/verification_sessions/{session}/redact - missing required parameter 'session' (400)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}/redact';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/identity/verification_sessions/{session}/redact - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}/redact';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/identity/verification_sessions/{session}/redact - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}/redact';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/identity/verification_sessions/{session}/redact - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/{session}/redact';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent session returns 404
  test('POST /v1/identity/verification_sessions/{session}/redact - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/identity/verification_sessions/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/redact';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});