/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.630Z
 * Endpoints: /v1/subscription_items, /v1/subscription_items/{item}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 27
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/subscription_items: <p>Returns a list of your subscription items for a given subscription.</p>
  test('GET /v1/subscription_items - List all subscription items', async ({ request }) => {
    const endpoint = '/v1/subscription_items';

    const response = await request.get(endpoint, {
      params: {,
          subscription: "Vesica tutis aliquam aureus soluta cubo uberrime.",
      }
    });

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
    expect(body.url).toMatch(/^/v1/subscription_items/);
  });

  // Happy path test for POST /v1/subscription_items: <p>Adds a new item to an existing subscription. No existing items will be changed or replaced.</p>
  test('POST /v1/subscription_items - Create a subscription item', async ({ request }) => {
    const endpoint = '/v1/subscription_items';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/subscription_items/{item}: <p>Retrieves the subscription item with the given ID.</p>
  test('GET /v1/subscription_items/{item} - Retrieve a subscription item', async ({ request }) => {
    const endpoint = '/v1/subscription_items/Trans utor depono defleo aperte.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/subscription_items/{item}: <p>Updates the plan or quantity of an item on a current subscription.</p>
  test('POST /v1/subscription_items/{item} - Update a subscription item', async ({ request }) => {
    const endpoint = '/v1/subscription_items/Arbitro aggredior cibo sollicito repudiandae decens tubineus timor.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/subscription_items/{item}: <p>Deletes an item from the subscription. Removing a subscription item from a subscription will not cancel the subscription.</p>
  test('DELETE /v1/subscription_items/{item} - Delete a subscription item', async ({ request }) => {
    const endpoint = '/v1/subscription_items/Atrox amoveo cursus solum.';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'subscription' returns 400
  test('GET /v1/subscription_items - missing required parameter 'subscription' (400)', async ({ request }) => {
    const endpoint = '/v1/subscription_items';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/subscription_items - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/subscription_items';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/subscription_items - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/subscription_items';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/subscription_items - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/subscription_items';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/subscription_items - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/subscription_items';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/subscription_items - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/subscription_items';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/subscription_items - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/subscription_items';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'item' returns 400
  test('GET /v1/subscription_items/{item} - missing required parameter 'item' (400)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/{item}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/subscription_items/{item} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/{item}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/subscription_items/{item} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/{item}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/subscription_items/{item} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/{item}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent item returns 404
  test('GET /v1/subscription_items/{item} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'item' returns 400
  test('POST /v1/subscription_items/{item} - missing required parameter 'item' (400)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/{item}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/subscription_items/{item} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/{item}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/subscription_items/{item} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/{item}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/subscription_items/{item} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/{item}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent item returns 404
  test('POST /v1/subscription_items/{item} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'item' returns 400
  test('DELETE /v1/subscription_items/{item} - missing required parameter 'item' (400)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/{item}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/subscription_items/{item} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/{item}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/subscription_items/{item} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/{item}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/subscription_items/{item} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/{item}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent item returns 404
  test('DELETE /v1/subscription_items/{item} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/subscription_items/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});