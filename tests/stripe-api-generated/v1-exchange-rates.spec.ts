/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.618Z
 * Endpoints: /v1/exchange_rates, /v1/exchange_rates/{rate_id}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 10
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/exchange_rates: <p>[Deprecated] The <code>ExchangeRate</code> APIs are deprecated. Please use the <a href="https://docs.stripe.com/payments/currencies/localize-prices/fx-quotes-api">FX Quotes API</a> instead.</p>

  <p>Returns a list of objects that contain the rates at which foreign currencies are converted to one another. Only shows the currencies for which Stripe supports.</p>
  test('GET /v1/exchange_rates - List all exchange rates', async ({ request }) => {
    const endpoint = '/v1/exchange_rates';

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
    expect(body.url).toMatch(/^/v1/exchange_rates/);
  });

  // Happy path test for GET /v1/exchange_rates/{rate_id}: <p>[Deprecated] The <code>ExchangeRate</code> APIs are deprecated. Please use the <a href="https://docs.stripe.com/payments/currencies/localize-prices/fx-quotes-api">FX Quotes API</a> instead.</p>

  <p>Retrieves the exchange rates from the given currency to every supported currency.</p>
  test('GET /v1/exchange_rates/{rate_id} - Retrieve an exchange rate', async ({ request }) => {
    const endpoint = '/v1/exchange_rates/Turbo color vulgus.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/exchange_rates - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/exchange_rates';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/exchange_rates - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/exchange_rates';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/exchange_rates - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/exchange_rates';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'rate_id' returns 400
  test('GET /v1/exchange_rates/{rate_id} - missing required parameter 'rate_id' (400)', async ({ request }) => {
    const endpoint = '/v1/exchange_rates/{rate_id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/exchange_rates/{rate_id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/exchange_rates/{rate_id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/exchange_rates/{rate_id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/exchange_rates/{rate_id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/exchange_rates/{rate_id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/exchange_rates/{rate_id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent rate_id returns 404
  test('GET /v1/exchange_rates/{rate_id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/exchange_rates/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});