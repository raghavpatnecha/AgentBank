/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.640Z
 * Endpoints: /v1/treasury/outbound_transfers, /v1/treasury/outbound_transfers/{outbound_transfer}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 15
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/treasury/outbound_transfers: <p>Returns a list of OutboundTransfers sent from the specified FinancialAccount.</p>
  test('GET /v1/treasury/outbound_transfers - List all OutboundTransfers', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers';

    const response = await request.get(endpoint, {
      params: {,
          financial_account: "Volup demum acidus adipisci crepusculum.",
      }
    });

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

  // Happy path test for POST /v1/treasury/outbound_transfers: <p>Creates an OutboundTransfer.</p>
  test('POST /v1/treasury/outbound_transfers - Create an OutboundTransfer', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/treasury/outbound_transfers/{outbound_transfer}: <p>Retrieves the details of an existing OutboundTransfer by passing the unique OutboundTransfer ID from either the OutboundTransfer creation request or OutboundTransfer list.</p>
  test('GET /v1/treasury/outbound_transfers/{outbound_transfer} - Retrieve an OutboundTransfer', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers/Comis verus amplitudo thymum absorbeo thesis trans ascisco consectetur tamisium.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'financial_account' returns 400
  test('GET /v1/treasury/outbound_transfers - missing required parameter 'financial_account' (400)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/treasury/outbound_transfers - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/treasury/outbound_transfers - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/treasury/outbound_transfers - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/treasury/outbound_transfers - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/treasury/outbound_transfers - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/treasury/outbound_transfers - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'outbound_transfer' returns 400
  test('GET /v1/treasury/outbound_transfers/{outbound_transfer} - missing required parameter 'outbound_transfer' (400)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers/{outbound_transfer}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/treasury/outbound_transfers/{outbound_transfer} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers/{outbound_transfer}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/treasury/outbound_transfers/{outbound_transfer} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers/{outbound_transfer}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/treasury/outbound_transfers/{outbound_transfer} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers/{outbound_transfer}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent outbound_transfer returns 404
  test('GET /v1/treasury/outbound_transfers/{outbound_transfer} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/treasury/outbound_transfers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});