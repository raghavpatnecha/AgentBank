/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.625Z
 * Endpoints: /v1/payment_method_domains, /v1/payment_method_domains/{payment_method_domain}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/payment_method_domains: <p>Lists the details of existing payment method domains.</p>
  test('GET /v1/payment_method_domains - List payment method domains', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains';

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
    expect(body.url).toMatch(/^/v1/payment_method_domains/);
  });

  // Happy path test for POST /v1/payment_method_domains: <p>Creates a payment method domain.</p>
  test('POST /v1/payment_method_domains - Create a payment method domain', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/payment_method_domains/{payment_method_domain}: <p>Retrieves the details of an existing payment method domain.</p>
  test('GET /v1/payment_method_domains/{payment_method_domain} - Retrieve a payment method domain', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains/Fugit victus canis qui charisma vereor bellum.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/payment_method_domains/{payment_method_domain}: <p>Updates an existing payment method domain.</p>
  test('POST /v1/payment_method_domains/{payment_method_domain} - Update a payment method domain', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains/Pecus acidus cavus tandem eius accommodo balbus.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/payment_method_domains - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/payment_method_domains - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/payment_method_domains - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_method_domains - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_method_domains - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_method_domains - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'payment_method_domain' returns 400
  test('GET /v1/payment_method_domains/{payment_method_domain} - missing required parameter 'payment_method_domain' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains/{payment_method_domain}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/payment_method_domains/{payment_method_domain} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains/{payment_method_domain}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/payment_method_domains/{payment_method_domain} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains/{payment_method_domain}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/payment_method_domains/{payment_method_domain} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains/{payment_method_domain}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent payment_method_domain returns 404
  test('GET /v1/payment_method_domains/{payment_method_domain} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'payment_method_domain' returns 400
  test('POST /v1/payment_method_domains/{payment_method_domain} - missing required parameter 'payment_method_domain' (400)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains/{payment_method_domain}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/payment_method_domains/{payment_method_domain} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains/{payment_method_domain}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/payment_method_domains/{payment_method_domain} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains/{payment_method_domain}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/payment_method_domains/{payment_method_domain} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains/{payment_method_domain}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent payment_method_domain returns 404
  test('POST /v1/payment_method_domains/{payment_method_domain} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/payment_method_domains/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});