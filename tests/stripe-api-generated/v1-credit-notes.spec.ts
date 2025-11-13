/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.612Z
 * Endpoints: /v1/credit_notes, /v1/credit_notes/{id}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/credit_notes: <p>Returns a list of credit notes.</p>
  test('GET /v1/credit_notes - List all credit notes', async ({ request }) => {
    const endpoint = '/v1/credit_notes';

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

  // Happy path test for POST /v1/credit_notes: <p>Issue a credit note to adjust the amount of a finalized invoice. A credit note will first reduce the invoice’s <code>amount_remaining</code> (and <code>amount_due</code>), but not below zero.
  This amount is indicated by the credit note’s <code>pre_payment_amount</code>. The excess amount is indicated by <code>post_payment_amount</code>, and it can result in any combination of the following:</p>

  <ul>
  <li>Refunds: create a new refund (using <code>refund_amount</code>) or link existing refunds (using <code>refunds</code>).</li>
  <li>Customer balance credit: credit the customer’s balance (using <code>credit_amount</code>) which will be automatically applied to their next invoice when it’s finalized.</li>
  <li>Outside of Stripe credit: record the amount that is or will be credited outside of Stripe (using <code>out_of_band_amount</code>).</li>
  </ul>

  <p>The sum of refunds, customer balance credits, and outside of Stripe credits must equal the <code>post_payment_amount</code>.</p>

  <p>You may issue multiple credit notes for an invoice. Each credit note may increment the invoice’s <code>pre_payment_credit_notes_amount</code>,
  <code>post_payment_credit_notes_amount</code>, or both, depending on the invoice’s <code>amount_remaining</code> at the time of credit note creation.</p>
  test('POST /v1/credit_notes - Create a credit note', async ({ request }) => {
    const endpoint = '/v1/credit_notes';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/credit_notes/{id}: <p>Retrieves the credit note object with the given identifier.</p>
  test('GET /v1/credit_notes/{id} - Retrieve a credit note', async ({ request }) => {
    const endpoint = '/v1/credit_notes/Bardus aqua vinum patruus vulgaris adfero strenuus velut sulum.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/credit_notes/{id}: <p>Updates an existing credit note.</p>
  test('POST /v1/credit_notes/{id} - Update a credit note', async ({ request }) => {
    const endpoint = '/v1/credit_notes/Unde cetera tres suadeo ventosus.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/credit_notes - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/credit_notes';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/credit_notes - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/credit_notes';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/credit_notes - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/credit_notes';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/credit_notes - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/credit_notes';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/credit_notes - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/credit_notes';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/credit_notes - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/credit_notes';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'id' returns 400
  test('GET /v1/credit_notes/{id} - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/credit_notes/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/credit_notes/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/credit_notes/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('GET /v1/credit_notes/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'id' returns 400
  test('POST /v1/credit_notes/{id} - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/credit_notes/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/credit_notes/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/credit_notes/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('POST /v1/credit_notes/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});