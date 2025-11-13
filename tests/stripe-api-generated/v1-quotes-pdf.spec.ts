/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.627Z
 * Endpoints: /v1/quotes/{quote}/pdf
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 6
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/quotes/{quote}/pdf: <p>Download the PDF for a finalized quote. Explanation for special handling can be found <a href="https://docs.stripe.com/quotes/overview#quote_pdf">here</a></p>
  test('GET /v1/quotes/{quote}/pdf - Download quote PDF', async ({ request }) => {
    const endpoint = '/v1/quotes/Cognatus coepi verbum certus omnis tenuis supplanto tenax aveho apto./pdf';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

  });

  // Verify that omitting required parameter 'quote' returns 400
  test('GET /v1/quotes/{quote}/pdf - missing required parameter 'quote' (400)', async ({ request }) => {
    const endpoint = '/v1/quotes/{quote}/pdf';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/quotes/{quote}/pdf - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/quotes/{quote}/pdf';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/quotes/{quote}/pdf - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/quotes/{quote}/pdf';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/quotes/{quote}/pdf - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/quotes/{quote}/pdf';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent quote returns 404
  test('GET /v1/quotes/{quote}/pdf - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/quotes/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/pdf';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});