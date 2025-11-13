/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.612Z
 * Endpoints: /v1/coupons, /v1/coupons/{coupon}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 26
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/coupons: <p>Returns a list of your coupons.</p>
  test('GET /v1/coupons - List all coupons', async ({ request }) => {
    const endpoint = '/v1/coupons';

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
    expect(body.url).toMatch(/^/v1/coupons/);
  });

  // Happy path test for POST /v1/coupons: <p>You can create coupons easily via the <a href="https://dashboard.stripe.com/coupons">coupon management</a> page of the Stripe dashboard. Coupon creation is also accessible via the API if you need to create coupons on the fly.</p>

  <p>A coupon has either a <code>percent_off</code> or an <code>amount_off</code> and <code>currency</code>. If you set an <code>amount_off</code>, that amount will be subtracted from any invoice’s subtotal. For example, an invoice with a subtotal of <currency>100</currency> will have a final total of <currency>0</currency> if a coupon with an <code>amount_off</code> of <amount>200</amount> is applied to it and an invoice with a subtotal of <currency>300</currency> will have a final total of <currency>100</currency> if a coupon with an <code>amount_off</code> of <amount>200</amount> is applied to it.</p>
  test('POST /v1/coupons - Create a coupon', async ({ request }) => {
    const endpoint = '/v1/coupons';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/coupons/{coupon}: <p>Retrieves the coupon with the given ID.</p>
  test('GET /v1/coupons/{coupon} - Retrieve a coupon', async ({ request }) => {
    const endpoint = '/v1/coupons/Vilis tamen tactus voveo aeger vorax asper ter summopere.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/coupons/{coupon}: <p>Updates the metadata of a coupon. Other coupon details (currency, duration, amount_off) are, by design, not editable.</p>
  test('POST /v1/coupons/{coupon} - Update a coupon', async ({ request }) => {
    const endpoint = '/v1/coupons/Trans utrum tot thema.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/coupons/{coupon}: <p>You can delete coupons via the <a href="https://dashboard.stripe.com/coupons">coupon management</a> page of the Stripe dashboard. However, deleting a coupon does not affect any customers who have already applied the coupon; it means that new customers can’t redeem the coupon. You can also delete coupons via the API.</p>
  test('DELETE /v1/coupons/{coupon} - Delete a coupon', async ({ request }) => {
    const endpoint = '/v1/coupons/Agnitio venustas minus doloribus approbo spoliatio amoveo quis vito capillus.';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/coupons - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/coupons';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/coupons - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/coupons';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/coupons - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/coupons';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/coupons - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/coupons';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/coupons - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/coupons';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/coupons - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/coupons';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'coupon' returns 400
  test('GET /v1/coupons/{coupon} - missing required parameter 'coupon' (400)', async ({ request }) => {
    const endpoint = '/v1/coupons/{coupon}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/coupons/{coupon} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/coupons/{coupon}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/coupons/{coupon} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/coupons/{coupon}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/coupons/{coupon} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/coupons/{coupon}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent coupon returns 404
  test('GET /v1/coupons/{coupon} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/coupons/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'coupon' returns 400
  test('POST /v1/coupons/{coupon} - missing required parameter 'coupon' (400)', async ({ request }) => {
    const endpoint = '/v1/coupons/{coupon}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/coupons/{coupon} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/coupons/{coupon}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/coupons/{coupon} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/coupons/{coupon}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/coupons/{coupon} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/coupons/{coupon}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent coupon returns 404
  test('POST /v1/coupons/{coupon} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/coupons/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'coupon' returns 400
  test('DELETE /v1/coupons/{coupon} - missing required parameter 'coupon' (400)', async ({ request }) => {
    const endpoint = '/v1/coupons/{coupon}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/coupons/{coupon} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/coupons/{coupon}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/coupons/{coupon} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/coupons/{coupon}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/coupons/{coupon} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/coupons/{coupon}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent coupon returns 404
  test('DELETE /v1/coupons/{coupon} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/coupons/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});