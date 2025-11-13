/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.620Z
 * Endpoints: /v1/invoice_payments, /v1/invoice_payments/{invoice_payment}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 10
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/invoice_payments: <p>When retrieving an invoice, there is an includable payments property containing the first handful of those items. There is also a URL where you can retrieve the full (paginated) list of payments.</p>
  test('GET /v1/invoice_payments - List all payments for an invoice', async ({ request }) => {
    const endpoint = '/v1/invoice_payments';

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
  });

  // Happy path test for GET /v1/invoice_payments/{invoice_payment}: <p>Retrieves the invoice payment with the given ID.</p>
  test('GET /v1/invoice_payments/{invoice_payment} - Retrieve an InvoicePayment', async ({ request }) => {
    const endpoint = '/v1/invoice_payments/Bene vulgivagus suasoria vorax viscus taedium dolore adipiscor culpo.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/invoice_payments - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoice_payments';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/invoice_payments - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoice_payments';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/invoice_payments - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoice_payments';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'invoice_payment' returns 400
  test('GET /v1/invoice_payments/{invoice_payment} - missing required parameter 'invoice_payment' (400)', async ({ request }) => {
    const endpoint = '/v1/invoice_payments/{invoice_payment}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/invoice_payments/{invoice_payment} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoice_payments/{invoice_payment}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/invoice_payments/{invoice_payment} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoice_payments/{invoice_payment}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/invoice_payments/{invoice_payment} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoice_payments/{invoice_payment}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent invoice_payment returns 404
  test('GET /v1/invoice_payments/{invoice_payment} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/invoice_payments/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});