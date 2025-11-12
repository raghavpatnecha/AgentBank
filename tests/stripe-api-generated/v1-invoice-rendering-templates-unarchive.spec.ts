/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.620Z
 * Endpoints: /v1/invoice_rendering_templates/{template}/unarchive
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for POST /v1/invoice_rendering_templates/{template}/unarchive: <p>Unarchive an invoice rendering template so it can be used on new Stripe objects again.</p>
  test('POST /v1/invoice_rendering_templates/{template}/unarchive - Unarchive an invoice rendering template', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates/Desino alioqui tamisium abbas quasi spargo./unarchive';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'template' returns 400
  test('POST /v1/invoice_rendering_templates/{template}/unarchive - missing required parameter 'template' (400)', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates/{template}/unarchive';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/invoice_rendering_templates/{template}/unarchive - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates/{template}/unarchive';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/invoice_rendering_templates/{template}/unarchive - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates/{template}/unarchive';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/invoice_rendering_templates/{template}/unarchive - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates/{template}/unarchive';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent template returns 404
  test('POST /v1/invoice_rendering_templates/{template}/unarchive - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/invoice_rendering_templates/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/unarchive';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});