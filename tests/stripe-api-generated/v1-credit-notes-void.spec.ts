/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.612Z
 * Endpoints: /v1/credit_notes/{id}/void
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/credit_notes/{id}/void: <p>Marks a credit note as void. Learn more about <a href="/docs/billing/invoices/credit-notes#voiding">voiding credit notes</a>.</p>
  test('POST /v1/credit_notes/{id}/void - Void a credit note', async ({ request }) => {
    const endpoint = '/v1/credit_notes/Adnuo conqueror traho conduco appono ipsa curiositas desipio uberrime nisi./void';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'id' returns 400
  test('POST /v1/credit_notes/{id}/void - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{id}/void';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/credit_notes/{id}/void - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{id}/void';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/credit_notes/{id}/void - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{id}/void';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/credit_notes/{id}/void - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{id}/void';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('POST /v1/credit_notes/{id}/void - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/void';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});