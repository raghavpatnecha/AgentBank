/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.638Z
 * Endpoints: /v1/transfers/{id}/reversals, /v1/transfers/{transfer}/reversals/{id}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 24
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/transfers/{id}/reversals: <p>You can see a list of the reversals belonging to a specific transfer. Note that the 10 most recent reversals are always available by default on the transfer object. If you need more than those 10, you can use this API method and the <code>limit</code> and <code>starting_after</code> parameters to page through additional reversals.</p>
  test('GET /v1/transfers/{id}/reversals - List all reversals', async ({ request }) => {
    const endpoint = '/v1/transfers/Strues aeneus quisquam aut cogito infit./reversals';

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

  // Happy path test for POST /v1/transfers/{id}/reversals: <p>When you create a new reversal, you must specify a transfer to create it on.</p>

  <p>When reversing transfers, you can optionally reverse part of the transfer. You can do so as many times as you wish until the entire transfer has been reversed.</p>

  <p>Once entirely reversed, a transfer can’t be reversed again. This method will return an error when called on an already-reversed transfer, or when trying to reverse more money than is left on a transfer.</p>
  test('POST /v1/transfers/{id}/reversals - Create a transfer reversal', async ({ request }) => {
    const endpoint = '/v1/transfers/Pax viduo accendo adaugeo varius./reversals';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/transfers/{transfer}/reversals/{id}: <p>By default, you can see the 10 most recent reversals stored directly on the transfer object, but you can also retrieve details about a specific reversal stored on the transfer.</p>
  test('GET /v1/transfers/{transfer}/reversals/{id} - Retrieve a reversal', async ({ request }) => {
    const endpoint = '/v1/transfers/Crur appositus velit adaugeo ulciscor volo./reversals/Delectatio universe tristis acsi deleniti deleniti delibero.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/transfers/{transfer}/reversals/{id}: <p>Updates the specified reversal by setting the values of the parameters passed. Any parameters not provided will be left unchanged.</p>

  <p>This request only accepts metadata and description as arguments.</p>
  test('POST /v1/transfers/{transfer}/reversals/{id} - Update a reversal', async ({ request }) => {
    const endpoint = '/v1/transfers/Iusto vulpes virtus campana vulgus cado quaerat bis./reversals/Crastinus vilis vinum cunabula demonstro alienus unde.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'id' returns 400
  test('GET /v1/transfers/{id}/reversals - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/transfers/{id}/reversals';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/transfers/{id}/reversals - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/transfers/{id}/reversals';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/transfers/{id}/reversals - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/transfers/{id}/reversals';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/transfers/{id}/reversals - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/transfers/{id}/reversals';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('GET /v1/transfers/{id}/reversals - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/transfers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/reversals';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'id' returns 400
  test('POST /v1/transfers/{id}/reversals - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/transfers/{id}/reversals';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/transfers/{id}/reversals - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/transfers/{id}/reversals';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/transfers/{id}/reversals - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/transfers/{id}/reversals';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/transfers/{id}/reversals - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/transfers/{id}/reversals';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('POST /v1/transfers/{id}/reversals - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/transfers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/reversals';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'id' returns 400
  test('GET /v1/transfers/{transfer}/reversals/{id} - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/transfers/{transfer}/reversals/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/transfers/{transfer}/reversals/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/transfers/{transfer}/reversals/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/transfers/{transfer}/reversals/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/transfers/{transfer}/reversals/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/transfers/{transfer}/reversals/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/transfers/{transfer}/reversals/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('GET /v1/transfers/{transfer}/reversals/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/transfers/{transfer}/reversals/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'id' returns 400
  test('POST /v1/transfers/{transfer}/reversals/{id} - missing required parameter 'id' (400)', async ({ request }) => {
    const endpoint = '/v1/transfers/{transfer}/reversals/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/transfers/{transfer}/reversals/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/transfers/{transfer}/reversals/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/transfers/{transfer}/reversals/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/transfers/{transfer}/reversals/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/transfers/{transfer}/reversals/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/transfers/{transfer}/reversals/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent id returns 404
  test('POST /v1/transfers/{transfer}/reversals/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/transfers/{transfer}/reversals/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});