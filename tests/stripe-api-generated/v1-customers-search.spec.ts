/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.613Z
 * Endpoints: /v1/customers/search
 * Tags: error, 400, parameters, 401, auth, invalid-token, 403, permissions
 * Test count: 5
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/customers/search: <p>Search for customers you’ve previously created using Stripe’s <a href="/docs/search#search-query-language">Search Query Language</a>.
  Don’t use search in read-after-write flows where strict consistency is necessary. Under normal operating
  conditions, data is searchable in less than a minute. Occasionally, propagation of new or updated data can be up
  to an hour behind during outages. Search functionality is not available to merchants in India.</p>
  test('GET /v1/customers/search - Search customers', async ({ request }) => {
    const endpoint = '/v1/customers/search';

    const response = await request.get(endpoint, {
      params: {,
          query: "Amo tergum alienus sollicito virtus comminor.",
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
    if (body.next_page !== undefined) {
      expect(typeof body.next_page).toBe('string');
      expect(body.next_page.length).toBeLessThanOrEqual(5000);
    }
    expect(typeof body.object).toBe('string');
    expect(["search_result"]).toContain(body.object);
    if (body.total_count !== undefined) {
      expect(typeof body.total_count).toBe('number');
    }
    expect(typeof body.url).toBe('string');
    expect(body.url.length).toBeLessThanOrEqual(5000);
  });

  // Verify that omitting required parameter 'query' returns 400
  test('GET /v1/customers/search - missing required parameter 'query' (400)', async ({ request }) => {
    const endpoint = '/v1/customers/search';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/customers/search - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/customers/search';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/customers/search - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/customers/search';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/customers/search - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/customers/search';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });
});