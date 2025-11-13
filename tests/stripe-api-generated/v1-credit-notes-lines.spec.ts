/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.612Z
 * Endpoints: /v1/credit_notes/{credit_note}/lines
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/credit_notes/{credit_note}/lines: <p>When retrieving a credit note, you’ll get a <strong>lines</strong> property containing the first handful of those items. There is also a URL where you can retrieve the full (paginated) list of line items.</p>
  test('GET /v1/credit_notes/{credit_note}/lines - Retrieve a credit note's line items', async ({ request }) => {
    const endpoint = '/v1/credit_notes/Comes compello adinventitias fugiat adulatio brevis causa./lines';

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

  // Verify that omitting required parameter 'credit_note' returns 400
  test('GET /v1/credit_notes/{credit_note}/lines - missing required parameter 'credit_note' (400)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{credit_note}/lines';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/credit_notes/{credit_note}/lines - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{credit_note}/lines';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/credit_notes/{credit_note}/lines - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{credit_note}/lines';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/credit_notes/{credit_note}/lines - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/{credit_note}/lines';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent credit_note returns 404
  test('GET /v1/credit_notes/{credit_note}/lines - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/credit_notes/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/lines';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});