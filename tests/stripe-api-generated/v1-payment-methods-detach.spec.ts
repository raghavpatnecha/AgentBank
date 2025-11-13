/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.625Z
 * Endpoints: /v1/payment_methods/{payment_method}/detach
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/payment_methods/{payment_method}/detach: <p>Detaches a PaymentMethod object from a Customer. After a PaymentMethod is detached, it can no longer be used for a payment or re-attached to a Customer.</p>
  test('POST /v1/payment_methods/{payment_method}/detach - Detach a PaymentMethod from a Customer', async ({ request }) => {
    const endpoint = '/v1/payment_methods/Vigor truculenter corrigo./detach';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'payment_method' returns 400
  test('POST /v1/payment_methods/{payment_method}/detach - missing required parameter 'payment_method' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}/detach';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_methods/{payment_method}/detach - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}/detach';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_methods/{payment_method}/detach - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}/detach';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_methods/{payment_method}/detach - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/{payment_method}/detach';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent payment_method returns 404
  test('POST /v1/payment_methods/{payment_method}/detach - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_methods/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/detach';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});