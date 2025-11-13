/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.613Z
 * Endpoints: /v1/customers/{customer}/bank_accounts, /v1/customers/{customer}/bank_accounts/{id}
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions, 404, not-found
 * Test count: 30
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/customers/{customer}/bank_accounts: <p>You can see a list of the bank accounts belonging to a Customer. Note that the 10 most recent sources are always available by default on the Customer. If you need more than those 10, you can use this API method and the <code>limit</code> and <code>starting_after</code> parameters to page through additional bank accounts.</p>
  test('GET /v1/customers/{customer}/bank_accounts - List all bank accounts', async ({ request }) => {
    const endpoint = '/v1/customers/Rem spoliatio ulterius curso tactus decimus debilito facere./bank_accounts';

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

  // Happy path test for POST /v1/customers/{customer}/bank_accounts: <p>When you create a new credit card, you must specify a customer or recipient on which to create it.</p>

  <p>If the card’s owner has no default card, then the new card will become the default.
  However, if the owner already has a default, then it will not change.
  To change the default, you should <a href="/docs/api#update_customer">update the customer</a> to have a new <code>default_source</code>.</p>
  test('POST /v1/customers/{customer}/bank_accounts - Create a card', async ({ request }) => {
    const endpoint = '/v1/customers/Synagoga defetiscor canto combibo beatus aggredior adhuc vae charisma suffragium./bank_accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/customers/{customer}/bank_accounts/{id}: <p>By default, you can see the 10 most recent sources stored on a Customer directly on the object, but you can also retrieve details about a specific bank account stored on the Stripe account.</p>
  test('GET /v1/customers/{customer}/bank_accounts/{id} - Retrieve a bank account', async ({ request }) => {
    const endpoint = '/v1/customers/Vesica alo deludo cotidie quas corrupti thymbra./bank_accounts/Carmen amaritudo dolores approbo currus.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/customers/{customer}/bank_accounts/{id}: <p>Update a specified source for a given customer.</p>
  test('POST /v1/customers/{customer}/bank_accounts/{id} - bank_accounts by ID', async ({ request }) => {
    const endpoint = '/v1/customers/Ara catena conor vilicus stultus cubicularis complectus crastinus trepide aduro./bank_accounts/Cedo depono tandem talio supra verecundia.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/customers/{customer}/bank_accounts/{id}: <p>Delete a specified source for a given customer.</p>
  test('DELETE /v1/customers/{customer}/bank_accounts/{id} - Delete a customer source', async ({ request }) => {
    const endpoint = '/v1/customers/Alo delectatio ullus agnitio a adeptio aer sordeo sequi vigor./bank_accounts/Iste calco abutor dignissimos admiratio beatae dol';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that omitting required parameter 'customer' returns 400
  test('GET /v1/customers/{customer}/bank_accounts - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/customers/{customer}/bank_accounts - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/customers/{customer}/bank_accounts - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/customers/{customer}/bank_accounts - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('GET /v1/customers/{customer}/bank_accounts - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/bank_accounts';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('POST /v1/customers/{customer}/bank_accounts - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/customers/{customer}/bank_accounts - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/customers/{customer}/bank_accounts - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/customers/{customer}/bank_accounts - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('POST /v1/customers/{customer}/bank_accounts - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/bank_accounts';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('GET /v1/customers/{customer}/bank_accounts/{id} - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/customers/{customer}/bank_accounts/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/customers/{customer}/bank_accounts/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/customers/{customer}/bank_accounts/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('GET /v1/customers/{customer}/bank_accounts/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/bank_accounts/{id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('POST /v1/customers/{customer}/bank_accounts/{id} - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/customers/{customer}/bank_accounts/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/customers/{customer}/bank_accounts/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/customers/{customer}/bank_accounts/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('POST /v1/customers/{customer}/bank_accounts/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/bank_accounts/{id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'customer' returns 400
  test('DELETE /v1/customers/{customer}/bank_accounts/{id} - missing required parameter 'customer' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/customers/{customer}/bank_accounts/{id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/customers/{customer}/bank_accounts/{id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/customers/{customer}/bank_accounts/{id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/{customer}/bank_accounts/{id}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent customer returns 404
  test('DELETE /v1/customers/{customer}/bank_accounts/{id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/customers/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd/bank_accounts/{id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});