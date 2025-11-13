/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.621Z
 * Endpoints: /v1/invoices, /v1/invoices/{invoice}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 26
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/invoices: <p>You can list all invoices, or list the invoices for a specific customer. The invoices are returned sorted by creation date, with the most recently created invoices appearing first.</p>
  test('GET /v1/invoices - List all invoices', async ({ request }) => {
    const endpoint = '/v1/invoices';

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
    expect(body.url).toMatch(/^/v1/invoices/);
  });

  // Happy path test for POST /v1/invoices: <p>This endpoint creates a draft invoice for a given customer. The invoice remains a draft until you <a href="#finalize_invoice">finalize</a> the invoice, which allows you to <a href="#pay_invoice">pay</a> or <a href="#send_invoice">send</a> the invoice to your customers.</p>
  test('POST /v1/invoices - Create an invoice', async ({ request }) => {
    const endpoint = '/v1/invoices';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/invoices/{invoice}: <p>Retrieves the invoice with the given ID.</p>
  test('GET /v1/invoices/{invoice} - Retrieve an invoice', async ({ request }) => {
    const endpoint = '/v1/invoices/Sapiente corrupti audeo communis quae quia.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/invoices/{invoice}: <p>Draft invoices are fully editable. Once an invoice is <a href="/docs/billing/invoices/workflow#finalized">finalized</a>,
  monetary values, as well as <code>collection_method</code>, become uneditable.</p>

  <p>If you would like to stop the Stripe Billing engine from automatically finalizing, reattempting payments on,
  sending reminders for, or <a href="/docs/billing/invoices/reconciliation">automatically reconciling</a> invoices, pass
  <code>auto_advance=false</code>.</p>
  test('POST /v1/invoices/{invoice} - Update an invoice', async ({ request }) => {
    const endpoint = '/v1/invoices/Atqui magni tardus.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/invoices/{invoice}: <p>Permanently deletes a one-off invoice draft. This cannot be undone. Attempts to delete invoices that are no longer in a draft state will fail; once an invoice has been finalized or if an invoice is for a subscription, it must be <a href="#void_invoice">voided</a>.</p>
  test('DELETE /v1/invoices/{invoice} - Delete a draft invoice', async ({ request }) => {
    const endpoint = '/v1/invoices/Celo decet compello decerno beatus atavus ustulo.';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/invoices - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoices';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/invoices - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoices';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/invoices - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoices';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/invoices - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoices';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/invoices - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoices';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/invoices - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoices';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'invoice' returns 400
  test('GET /v1/invoices/{invoice} - missing required parameter 'invoice' (400)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/invoices/{invoice} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/invoices/{invoice} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/invoices/{invoice} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent invoice returns 404
  test('GET /v1/invoices/{invoice} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/invoices/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'invoice' returns 400
  test('POST /v1/invoices/{invoice} - missing required parameter 'invoice' (400)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/invoices/{invoice} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/invoices/{invoice} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/invoices/{invoice} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent invoice returns 404
  test('POST /v1/invoices/{invoice} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/invoices/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'invoice' returns 400
  test('DELETE /v1/invoices/{invoice} - missing required parameter 'invoice' (400)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/invoices/{invoice} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/invoices/{invoice} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/invoices/{invoice} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent invoice returns 404
  test('DELETE /v1/invoices/{invoice} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/invoices/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});