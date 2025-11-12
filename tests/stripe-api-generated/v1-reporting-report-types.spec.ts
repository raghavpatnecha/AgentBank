/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.628Z
 * Endpoints: /v1/reporting/report_types, /v1/reporting/report_types/{report_type}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 10
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/reporting/report_types: <p>Returns a full list of Report Types.</p>
  test('GET /v1/reporting/report_types - List all Report Types', async ({ request }) => {
    const endpoint = '/v1/reporting/report_types';

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

  // Happy path test for GET /v1/reporting/report_types/{report_type}: <p>Retrieves the details of a Report Type. (Certain report types require a <a href="https://stripe.com/docs/keys#test-live-modes">live-mode API key</a>.)</p>
  test('GET /v1/reporting/report_types/{report_type} - Retrieve a Report Type', async ({ request }) => {
    const endpoint = '/v1/reporting/report_types/Magni vereor defendo solio ex.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/reporting/report_types - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_types';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/reporting/report_types - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_types';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/reporting/report_types - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_types';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'report_type' returns 400
  test('GET /v1/reporting/report_types/{report_type} - missing required parameter 'report_type' (400)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_types/{report_type}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/reporting/report_types/{report_type} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_types/{report_type}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/reporting/report_types/{report_type} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_types/{report_type}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/reporting/report_types/{report_type} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_types/{report_type}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent report_type returns 404
  test('GET /v1/reporting/report_types/{report_type} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_types/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});