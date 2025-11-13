/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.625Z
 * Endpoints: /v1/payment_records/{id}/report_payment_attempt_informational
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/payment_records/{id}/report_payment_attempt_informational: <p>Report informational updates on the specified Payment Record.</p>
  test('POST /v1/payment_records/{id}/report_payment_attempt_informational - Report payment attempt informational', async ({ request }) => {
    const endpoint = '/v1/payment_records/Tero viridis aveho creptio comminor absens sol./report_payment_attempt_informational';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'id' returns 400
  test('POST /v1/payment_records/{id}/report_payment_attempt_informational - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_records/{id}/report_payment_attempt_informational';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_records/{id}/report_payment_attempt_informational - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_records/{id}/report_payment_attempt_informational';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_records/{id}/report_payment_attempt_informational - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_records/{id}/report_payment_attempt_informational';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_records/{id}/report_payment_attempt_informational - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_records/{id}/report_payment_attempt_informational';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('POST /v1/payment_records/{id}/report_payment_attempt_informational - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_records/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/report_payment_attempt_informational';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});