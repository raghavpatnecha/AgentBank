/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.611Z
 * Endpoints: /v1/charges/{charge}/refunds, /v1/charges/{charge}/refunds/{refund}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 24
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/charges/{charge}/refunds: <p>You can see a list of the refunds belonging to a specific charge. Note that the 10 most recent refunds are always available by default on the charge object. If you need more than those 10, you can use this API method and the <code>limit</code> and <code>starting_after</code> parameters to page through additional refunds.</p>
  test('GET /v1/charges/{charge}/refunds - List all refunds', async ({ request }) => {
    const endpoint = '/v1/charges/Nisi collum beatae bestia cinis solutio sophismata/refunds';

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

  // Happy path test for POST /v1/charges/{charge}/refunds: <p>When you create a new refund, you must specify a Charge or a PaymentIntent object on which to create it.</p>

  <p>Creating a new refund will refund a charge that has previously been created but not yet refunded.
  Funds will be refunded to the credit or debit card that was originally charged.</p>

  <p>You can optionally refund only part of a charge.
  You can do so multiple times, until the entire charge has been refunded.</p>

  <p>Once entirely refunded, a charge can’t be refunded again.
  This method will raise an error when called on an already-refunded charge,
  or when trying to refund more money than is left on a charge.</p>
  test('POST /v1/charges/{charge}/refunds - Create customer balance refund', async ({ request }) => {
    const endpoint = '/v1/charges/Dedico temptatio brevis beatae defluo sumo venustas ullus./refunds';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/charges/{charge}/refunds/{refund}: <p>Retrieves the details of an existing refund.</p>
  test('GET /v1/charges/{charge}/refunds/{refund} - refunds by ID', async ({ request }) => {
    const endpoint = '/v1/charges/Corroboro solio aggero vivo claro bellum./refunds/Sono aut versus coniecto bellum curiositas timidus';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/charges/{charge}/refunds/{refund}: <p>Update a specified refund.</p>
  test('POST /v1/charges/{charge}/refunds/{refund} - refunds by ID', async ({ request }) => {
    const endpoint = '/v1/charges/Accommodo sono territo ter doloremque vomica./refunds/Commemoro ipsum tricesimus pauper convoco adhaero ';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'charge' returns 400
  test('GET /v1/charges/{charge}/refunds - missing required parameter 'charge' (400)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/charges/{charge}/refunds - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/charges/{charge}/refunds - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/charges/{charge}/refunds - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent charge returns 404
  test('GET /v1/charges/{charge}/refunds - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/charges/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/refunds';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'charge' returns 400
  test('POST /v1/charges/{charge}/refunds - missing required parameter 'charge' (400)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/charges/{charge}/refunds - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/charges/{charge}/refunds - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/charges/{charge}/refunds - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent charge returns 404
  test('POST /v1/charges/{charge}/refunds - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/charges/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/refunds';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'charge' returns 400
  test('GET /v1/charges/{charge}/refunds/{refund} - missing required parameter 'charge' (400)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds/{refund}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/charges/{charge}/refunds/{refund} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds/{refund}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/charges/{charge}/refunds/{refund} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds/{refund}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/charges/{charge}/refunds/{refund} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds/{refund}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent charge returns 404
  test('GET /v1/charges/{charge}/refunds/{refund} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/charges/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/refunds/{refund}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'charge' returns 400
  test('POST /v1/charges/{charge}/refunds/{refund} - missing required parameter 'charge' (400)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds/{refund}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/charges/{charge}/refunds/{refund} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds/{refund}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/charges/{charge}/refunds/{refund} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds/{refund}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/charges/{charge}/refunds/{refund} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/charges/{charge}/refunds/{refund}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent charge returns 404
  test('POST /v1/charges/{charge}/refunds/{refund} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/charges/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/refunds/{refund}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});