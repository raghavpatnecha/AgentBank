/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.611Z
 * Endpoints: /v1/charges/{charge}/refund
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/charges/{charge}/refund: <p>When you create a new refund, you must specify either a Charge or a PaymentIntent object.</p>

  <p>This action refunds a previously created charge that’s not refunded yet.
  Funds are refunded to the credit or debit card that’s originally charged.</p>

  <p>You can optionally refund only part of a charge.
  You can repeat this until the entire charge is refunded.</p>

  <p>After you entirely refund a charge, you can’t refund it again.
  This method raises an error when it’s called on an already-refunded charge,
  or when you attempt to refund more money than is left on a charge.</p>
  test('POST /v1/charges/{charge}/refund - Create a refund', async ({ request }) => {
    const endpoint = '/v1/charges/Pauper commodo conduco adhuc aptus tantum./refund';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'charge' returns 400
  test('POST /v1/charges/{charge}/refund - missing required parameter 'charge' (400)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refund';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/charges/{charge}/refund - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refund';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/charges/{charge}/refund - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refund';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/charges/{charge}/refund - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refund';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent charge returns 404
  test('POST /v1/charges/{charge}/refund - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/charges/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/refund';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});