/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.607Z
 * Endpoints: /v1/accounts/{account}/persons, /v1/accounts/{account}/persons/{person}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 30
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/accounts/{account}/persons: <p>Returns a list of people associated with the account’s legal entity. The people are returned sorted by creation date, with the most recent people appearing first.</p>
  test('GET /v1/accounts/{account}/persons - List all persons', async ({ request }) => {
    const endpoint = '/v1/accounts/Ambitus verumtamen sponte praesentium capitulus aut./persons';

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

  // Happy path test for POST /v1/accounts/{account}/persons: <p>Creates a new person.</p>
  test('POST /v1/accounts/{account}/persons - Create a person', async ({ request }) => {
    const endpoint = '/v1/accounts/Cito tero spargo sortitus./persons';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/accounts/{account}/persons/{person}: <p>Retrieves an existing person.</p>
  test('GET /v1/accounts/{account}/persons/{person} - Retrieve a person', async ({ request }) => {
    const endpoint = '/v1/accounts/Molestiae tabula agnitio tubineus iste tristis./persons/Animi ascit praesentium decretum.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/accounts/{account}/persons/{person}: <p>Updates an existing person.</p>
  test('POST /v1/accounts/{account}/persons/{person} - Update a person', async ({ request }) => {
    const endpoint = '/v1/accounts/Tollo eligendi vomica derelinquo./persons/Cinis error conduco crustulum vehemens cresco.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/accounts/{account}/persons/{person}: <p>Deletes an existing person’s relationship to the account’s legal entity. Any person with a relationship for an account can be deleted through the API, except if the person is the <code>account_opener</code>. If your integration is using the <code>executive</code> parameter, you cannot delete the only verified <code>executive</code> on file.</p>
  test('DELETE /v1/accounts/{account}/persons/{person} - Delete a person', async ({ request }) => {
    const endpoint = '/v1/accounts/Crinis vaco dedecor audio conqueror dolores adicio./persons/Ciminatio autem pecus accusantium possimus voco decimus.';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'account' returns 400
  test('GET /v1/accounts/{account}/persons - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/accounts/{account}/persons - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/accounts/{account}/persons - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/accounts/{account}/persons - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('GET /v1/accounts/{account}/persons - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/persons';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('POST /v1/accounts/{account}/persons - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/accounts/{account}/persons - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/accounts/{account}/persons - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/accounts/{account}/persons - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('POST /v1/accounts/{account}/persons - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/persons';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('GET /v1/accounts/{account}/persons/{person} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons/{person}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/accounts/{account}/persons/{person} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons/{person}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/accounts/{account}/persons/{person} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons/{person}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/accounts/{account}/persons/{person} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons/{person}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('GET /v1/accounts/{account}/persons/{person} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/persons/{person}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('POST /v1/accounts/{account}/persons/{person} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons/{person}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/accounts/{account}/persons/{person} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons/{person}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/accounts/{account}/persons/{person} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons/{person}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/accounts/{account}/persons/{person} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons/{person}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('POST /v1/accounts/{account}/persons/{person} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/persons/{person}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'account' returns 400
  test('DELETE /v1/accounts/{account}/persons/{person} - missing required parameter 'account' (400)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons/{person}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/accounts/{account}/persons/{person} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons/{person}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/accounts/{account}/persons/{person} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons/{person}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/accounts/{account}/persons/{person} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/accounts/{account}/persons/{person}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent account returns 404
  test('DELETE /v1/accounts/{account}/persons/{person} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/accounts/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/persons/{person}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});