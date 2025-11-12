/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.628Z
 * Endpoints: /v1/reporting/report_runs, /v1/reporting/report_runs/{report_run}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 14
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/reporting/report_runs: <p>Returns a list of Report Runs, with the most recent appearing first.</p>
  test('GET /v1/reporting/report_runs - List all Report Runs', async ({ request }) => {
    const endpoint = '/v1/reporting/report_runs';

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
    expect(body.url).toMatch(/^/v1/reporting/report_runs/);
  });

  // Happy path test for POST /v1/reporting/report_runs: <p>Creates a new object and begin running the report. (Certain report types require a <a href="https://stripe.com/docs/keys#test-live-modes">live-mode API key</a>.)</p>
  test('POST /v1/reporting/report_runs - Create a Report Run', async ({ request }) => {
    const endpoint = '/v1/reporting/report_runs';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/reporting/report_runs/{report_run}: <p>Retrieves the details of an existing Report Run.</p>
  test('GET /v1/reporting/report_runs/{report_run} - Retrieve a Report Run', async ({ request }) => {
    const endpoint = '/v1/reporting/report_runs/Quas vester blandior pel enim.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/reporting/report_runs - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_runs';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/reporting/report_runs - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_runs';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/reporting/report_runs - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_runs';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/reporting/report_runs - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_runs';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/reporting/report_runs - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_runs';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/reporting/report_runs - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_runs';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'report_run' returns 400
  test('GET /v1/reporting/report_runs/{report_run} - missing required parameter 'report_run' (400)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_runs/{report_run}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/reporting/report_runs/{report_run} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_runs/{report_run}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/reporting/report_runs/{report_run} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_runs/{report_run}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/reporting/report_runs/{report_run} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_runs/{report_run}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent report_run returns 404
  test('GET /v1/reporting/report_runs/{report_run} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/reporting/report_runs/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});