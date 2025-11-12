/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.626Z
 * Endpoints: /v1/payouts, /v1/payouts/{payout}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/payouts: <p>Returns a list of existing payouts sent to third-party bank accounts or payouts that Stripe sent to you. The payouts return in sorted order, with the most recently created payouts appearing first.</p>
  test('GET /v1/payouts - List all payouts', async ({ request }) => {
    const endpoint = '/v1/payouts';

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
    expect(body.url).toMatch(/^/v1/payouts/);
  });

  // Happy path test for POST /v1/payouts: <p>To send funds to your own bank account, create a new payout object. Your <a href="#balance">Stripe balance</a> must cover the payout amount. If it doesn’t, you receive an “Insufficient Funds” error.</p>

  <p>If your API key is in test mode, money won’t actually be sent, though every other action occurs as if you’re in live mode.</p>

  <p>If you create a manual payout on a Stripe account that uses multiple payment source types, you need to specify the source type balance that the payout draws from. The <a href="#balance_object">balance object</a> details available and pending amounts by source type.</p>
  test('POST /v1/payouts - Create a payout', async ({ request }) => {
    const endpoint = '/v1/payouts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/payouts/{payout}: <p>Retrieves the details of an existing payout. Supply the unique payout ID from either a payout creation request or the payout list. Stripe returns the corresponding payout information.</p>
  test('GET /v1/payouts/{payout} - Retrieve a payout', async ({ request }) => {
    const endpoint = '/v1/payouts/Distinctio aperio iure vulgivagus bis uxor voco alias sursum.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/payouts/{payout}: <p>Updates the specified payout by setting the values of the parameters you pass. We don’t change parameters that you don’t provide. This request only accepts the metadata as arguments.</p>
  test('POST /v1/payouts/{payout} - Update a payout', async ({ request }) => {
    const endpoint = '/v1/payouts/Aranea usque vapulus turba.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/payouts - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payouts';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/payouts - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payouts';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/payouts - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payouts';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payouts - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payouts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payouts - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payouts';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payouts - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payouts';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'payout' returns 400
  test('GET /v1/payouts/{payout} - missing required parameter 'payout' (400)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/payouts/{payout} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/payouts/{payout} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/payouts/{payout} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent payout returns 404
  test('GET /v1/payouts/{payout} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payouts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'payout' returns 400
  test('POST /v1/payouts/{payout} - missing required parameter 'payout' (400)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payouts/{payout} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payouts/{payout} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payouts/{payout} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payouts/{payout}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent payout returns 404
  test('POST /v1/payouts/{payout} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payouts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});