/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.620Z
 * Endpoints: /v1/invoiceitems, /v1/invoiceitems/{invoiceitem}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 26
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/invoiceitems: <p>Returns a list of your invoice items. Invoice items are returned sorted by creation date, with the most recently created invoice items appearing first.</p>
  test('GET /v1/invoiceitems - List all invoice items', async ({ request }) => {
    const endpoint = '/v1/invoiceitems';

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
    expect(body.url).toMatch(/^/v1/invoiceitems/);
  });

  // Happy path test for POST /v1/invoiceitems: <p>Creates an item to be added to a draft invoice (up to 250 items per invoice). If no invoice is specified, the item will be on the next invoice created for the customer specified.</p>
  test('POST /v1/invoiceitems - Create an invoice item', async ({ request }) => {
    const endpoint = '/v1/invoiceitems';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/invoiceitems/{invoiceitem}: <p>Retrieves the invoice item with the given ID.</p>
  test('GET /v1/invoiceitems/{invoiceitem} - Retrieve an invoice item', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/Solutio bene barba ancilla curia adversus demonstro cetera.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/invoiceitems/{invoiceitem}: <p>Updates the amount or description of an invoice item on an upcoming invoice. Updating an invoice item is only possible before the invoice it’s attached to is closed.</p>
  test('POST /v1/invoiceitems/{invoiceitem} - Update an invoice item', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/Soleo summisse vinitor comburo.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/invoiceitems/{invoiceitem}: <p>Deletes an invoice item, removing it from an invoice. Deleting invoice items is only possible when they’re not attached to invoices, or if it’s attached to a draft invoice.</p>
  test('DELETE /v1/invoiceitems/{invoiceitem} - Delete an invoice item', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/Sollers ustulo terga facere deprecator.';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/invoiceitems - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/invoiceitems - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/invoiceitems - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/invoiceitems - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/invoiceitems - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/invoiceitems - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'invoiceitem' returns 400
  test('GET /v1/invoiceitems/{invoiceitem} - missing required parameter 'invoiceitem' (400)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/{invoiceitem}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/invoiceitems/{invoiceitem} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/{invoiceitem}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/invoiceitems/{invoiceitem} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/{invoiceitem}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/invoiceitems/{invoiceitem} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/{invoiceitem}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent invoiceitem returns 404
  test('GET /v1/invoiceitems/{invoiceitem} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'invoiceitem' returns 400
  test('POST /v1/invoiceitems/{invoiceitem} - missing required parameter 'invoiceitem' (400)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/{invoiceitem}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/invoiceitems/{invoiceitem} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/{invoiceitem}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/invoiceitems/{invoiceitem} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/{invoiceitem}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/invoiceitems/{invoiceitem} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/{invoiceitem}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent invoiceitem returns 404
  test('POST /v1/invoiceitems/{invoiceitem} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'invoiceitem' returns 400
  test('DELETE /v1/invoiceitems/{invoiceitem} - missing required parameter 'invoiceitem' (400)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/{invoiceitem}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/invoiceitems/{invoiceitem} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/{invoiceitem}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/invoiceitems/{invoiceitem} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/{invoiceitem}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/invoiceitems/{invoiceitem} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/{invoiceitem}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent invoiceitem returns 404
  test('DELETE /v1/invoiceitems/{invoiceitem} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/invoiceitems/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});