/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.621Z
 * Endpoints: /v1/invoices/{invoice}/lines, /v1/invoices/{invoice}/lines/{line_item_id}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 12
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/invoices/{invoice}/lines: <p>When retrieving an invoice, you’ll get a <strong>lines</strong> property containing the total count of line items and the first handful of those items. There is also a URL where you can retrieve the full (paginated) list of line items.</p>
  test('GET /v1/invoices/{invoice}/lines - Retrieve an invoice's line items', async ({ request }) => {
    const endpoint = '/v1/invoices/Audentia aliqua arcus id crebro crinis condico./lines';

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

  // Happy path test for POST /v1/invoices/{invoice}/lines/{line_item_id}: <p>Updates an invoice’s line item. Some fields, such as <code>tax_amounts</code>, only live on the invoice line item,
  so they can only be updated through this endpoint. Other fields, such as <code>amount</code>, live on both the invoice
  item and the invoice line item, so updates on this endpoint will propagate to the invoice item as well.
  Updating an invoice’s line item is only possible before the invoice is finalized.</p>
  test('POST /v1/invoices/{invoice}/lines/{line_item_id} - Update an invoice's line item', async ({ request }) => {
    const endpoint = '/v1/invoices/Convoco vicissitudo alienus ceno venustas ancilla delego desino tot astrum./lines/Curo acceptus theologus synagoga auctor.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'invoice' returns 400
  test('GET /v1/invoices/{invoice}/lines - missing required parameter 'invoice' (400)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/lines';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/invoices/{invoice}/lines - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/lines';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/invoices/{invoice}/lines - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/lines';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/invoices/{invoice}/lines - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/lines';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent invoice returns 404
  test('GET /v1/invoices/{invoice}/lines - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/invoices/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/lines';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'invoice' returns 400
  test('POST /v1/invoices/{invoice}/lines/{line_item_id} - missing required parameter 'invoice' (400)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/lines/{line_item_id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/invoices/{invoice}/lines/{line_item_id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/lines/{line_item_id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/invoices/{invoice}/lines/{line_item_id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/lines/{line_item_id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/invoices/{invoice}/lines/{line_item_id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoices/{invoice}/lines/{line_item_id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent invoice returns 404
  test('POST /v1/invoices/{invoice}/lines/{line_item_id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/invoices/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/lines/{line_item_id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});