/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.608Z
 * Endpoints: /v1/apple_pay/domains, /v1/apple_pay/domains/{domain}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 20
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/apple_pay/domains: <p>List apple pay domains.</p>
  test('GET /v1/apple_pay/domains - domains', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains';

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
    expect(body.url).toMatch(/^/v1/apple_pay/domains/);
  });

  // Happy path test for POST /v1/apple_pay/domains: <p>Create an apple pay domain.</p>
  test('POST /v1/apple_pay/domains - domains', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/apple_pay/domains/{domain}: <p>Retrieve an apple pay domain.</p>
  test('GET /v1/apple_pay/domains/{domain} - domains by ID', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains/Ulterius cibo credo curo unde acidus tibi aveho eius vinum.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/apple_pay/domains/{domain}: <p>Delete an apple pay domain.</p>
  test('DELETE /v1/apple_pay/domains/{domain} - domains by ID', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains/Demens admoveo taceo demens arcus demulceo capitulus sono.';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/apple_pay/domains - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/apple_pay/domains - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/apple_pay/domains - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/apple_pay/domains - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/apple_pay/domains - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/apple_pay/domains - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'domain' returns 400
  test('GET /v1/apple_pay/domains/{domain} - missing required parameter 'domain' (400)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains/{domain}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/apple_pay/domains/{domain} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains/{domain}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/apple_pay/domains/{domain} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains/{domain}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/apple_pay/domains/{domain} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains/{domain}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent domain returns 404
  test('GET /v1/apple_pay/domains/{domain} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'domain' returns 400
  test('DELETE /v1/apple_pay/domains/{domain} - missing required parameter 'domain' (400)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains/{domain}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/apple_pay/domains/{domain} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains/{domain}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/apple_pay/domains/{domain} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains/{domain}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/apple_pay/domains/{domain} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains/{domain}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent domain returns 404
  test('DELETE /v1/apple_pay/domains/{domain} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/apple_pay/domains/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});