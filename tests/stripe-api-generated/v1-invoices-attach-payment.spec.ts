/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.621Z
 * Endpoints: /v1/invoices/{invoice}/attach_payment
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/invoices/{invoice}/attach_payment: <p>Attaches a PaymentIntent or an Out of Band Payment to the invoice, adding it to the list of <code>payments</code>.</p>

  <p>For the PaymentIntent, when the PaymentIntent’s status changes to <code>succeeded</code>, the payment is credited
  to the invoice, increasing its <code>amount_paid</code>. When the invoice is fully paid, the
  invoice’s status becomes <code>paid</code>.</p>

  <p>If the PaymentIntent’s status is already <code>succeeded</code> when it’s attached, it’s
  credited to the invoice immediately.</p>

  <p>See: <a href="/docs/invoicing/partial-payments">Partial payments</a> to learn more.</p>
  test('POST /v1/invoices/{invoice}/attach_payment - Attach a payment to an Invoice', async ({ request }) => {
    const endpoint = '/v1/invoices/Subito ducimus appono decerno utilis vorago./attach_payment';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'invoice' returns 400
  test('POST /v1/invoices/{invoice}/attach_payment - missing required parameter 'invoice' (400)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/attach_payment';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/invoices/{invoice}/attach_payment - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/attach_payment';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/invoices/{invoice}/attach_payment - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/attach_payment';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/invoices/{invoice}/attach_payment - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/attach_payment';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent invoice returns 404
  test('POST /v1/invoices/{invoice}/attach_payment - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/invoices/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/attach_payment';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});