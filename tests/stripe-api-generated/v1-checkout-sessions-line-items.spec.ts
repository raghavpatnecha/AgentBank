/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.611Z
 * Endpoints: /v1/checkout/sessions/{session}/line_items
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/checkout/sessions/{session}/line_items: <p>When retrieving a Checkout Session, there is an includable <strong>line_items</strong> property containing the first handful of those items. There is also a URL where you can retrieve the full (paginated) list of line items.</p>
  test('GET /v1/checkout/sessions/{session}/line_items - Retrieve a Checkout Session's line items', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/Autem bestia asper claro sumptus patior quasi./line_items';

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

  // Verify that omitting required parameter 'session' returns 400
  test('GET /v1/checkout/sessions/{session}/line_items - missing required parameter 'session' (400)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/{session}/line_items';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/checkout/sessions/{session}/line_items - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/{session}/line_items';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/checkout/sessions/{session}/line_items - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/{session}/line_items';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/checkout/sessions/{session}/line_items - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/{session}/line_items';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent session returns 404
  test('GET /v1/checkout/sessions/{session}/line_items - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/checkout/sessions/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/line_items';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});