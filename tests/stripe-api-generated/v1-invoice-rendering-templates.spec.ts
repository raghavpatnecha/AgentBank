/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.620Z
 * Endpoints: /v1/invoice_rendering_templates, /v1/invoice_rendering_templates/{template}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 10
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/invoice_rendering_templates: <p>List all templates, ordered by creation date, with the most recently created template appearing first.</p>
  test('GET /v1/invoice_rendering_templates - List all invoice rendering templates', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates';

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

  // Happy path test for GET /v1/invoice_rendering_templates/{template}: <p>Retrieves an invoice rendering template with the given ID. It by default returns the latest version of the template. Optionally, specify a version to see previous versions.</p>
  test('GET /v1/invoice_rendering_templates/{template} - Retrieve an invoice rendering template', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates/Cubo amet vulticulus amiculum currus.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/invoice_rendering_templates - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/invoice_rendering_templates - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/invoice_rendering_templates - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'template' returns 400
  test('GET /v1/invoice_rendering_templates/{template} - missing required parameter 'template' (400)', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates/{template}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/invoice_rendering_templates/{template} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates/{template}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/invoice_rendering_templates/{template} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates/{template}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/invoice_rendering_templates/{template} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates/{template}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent template returns 404
  test('GET /v1/invoice_rendering_templates/{template} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});