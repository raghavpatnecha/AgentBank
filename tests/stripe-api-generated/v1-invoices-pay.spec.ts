/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.621Z
 * Endpoints: /v1/invoices/{invoice}/pay
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/invoices/{invoice}/pay: <p>Stripe automatically creates and then attempts to collect payment on invoices for customers on subscriptions according to your <a href="https://dashboard.stripe.com/account/billing/automatic">subscriptions settings</a>. However, if you’d like to attempt payment on an invoice out of the normal collection schedule or for some other reason, you can do so.</p>
  test('POST /v1/invoices/{invoice}/pay - Pay an invoice', async ({ request }) => {
    const endpoint = '/v1/invoices/Temporibus thesaurus quisquam alveus viduo contra./pay';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'invoice' returns 400
  test('POST /v1/invoices/{invoice}/pay - missing required parameter 'invoice' (400)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/pay';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/invoices/{invoice}/pay - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/pay';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/invoices/{invoice}/pay - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/pay';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/invoices/{invoice}/pay - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/pay';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent invoice returns 404
  test('POST /v1/invoices/{invoice}/pay - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/invoices/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/pay';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});