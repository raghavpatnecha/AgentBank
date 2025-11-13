/**
 * Generated API Tests
 * Generated at: 2025-11-12T16:33:03.630Z
 * Endpoints: /v1/subscriptions, /v1/subscriptions/{subscription_exposed_id}
 * Tags: error, 401, auth, invalid-token, 403, permissions, 400, parameters, 404, not-found
 * Test count: 26
 */

import { test, expect } from '@playwright/test';

test.describe('error API', () => {

  // Happy path test for GET /v1/subscriptions: <p>By default, returns a list of subscriptions that have not been canceled. In order to list canceled subscriptions, specify <code>status=canceled</code>.</p>
  test('GET /v1/subscriptions - List subscriptions', async ({ request }) => {
    const endpoint = '/v1/subscriptions';

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
    expect(body.url).toMatch(/^/v1/subscriptions/);
  });

  // Happy path test for POST /v1/subscriptions: <p>Creates a new subscription on an existing customer. Each customer can have up to 500 active or scheduled subscriptions.</p>

  <p>When you create a subscription with <code>collection_method=charge_automatically</code>, the first invoice is finalized as part of the request.
  The <code>payment_behavior</code> parameter determines the exact behavior of the initial payment.</p>

  <p>To start subscriptions where the first invoice always begins in a <code>draft</code> status, use <a href="/docs/billing/subscriptions/subscription-schedules#managing">subscription schedules</a> instead.
  Schedules provide the flexibility to model more complex billing configurations that change over time.</p>
  test('POST /v1/subscriptions - Create a subscription', async ({ request }) => {
    const endpoint = '/v1/subscriptions';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for GET /v1/subscriptions/{subscription_exposed_id}: <p>Retrieves the subscription with the given ID.</p>
  test('GET /v1/subscriptions/{subscription_exposed_id} - Retrieve a subscription', async ({ request }) => {
    const endpoint = '/v1/subscriptions/Coniuratio amitto verumtamen vado officia antea thymum.';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for POST /v1/subscriptions/{subscription_exposed_id}: <p>Updates an existing subscription to match the specified parameters.
  When changing prices or quantities, we optionally prorate the price we charge next month to make up for any price changes.
  To preview how the proration is calculated, use the <a href="/docs/api/invoices/create_preview">create preview</a> endpoint.</p>

  <p>By default, we prorate subscription changes. For example, if a customer signs up on May 1 for a <currency>100</currency> price, they’ll be billed <currency>100</currency> immediately. If on May 15 they switch to a <currency>200</currency> price, then on June 1 they’ll be billed <currency>250</currency> (<currency>200</currency> for a renewal of her subscription, plus a <currency>50</currency> prorating adjustment for half of the previous month’s <currency>100</currency> difference). Similarly, a downgrade generates a credit that is applied to the next invoice. We also prorate when you make quantity changes.</p>

  <p>Switching prices does not normally change the billing date or generate an immediate charge unless:</p>

  <ul>
  <li>The billing interval is changed (for example, from monthly to yearly).</li>
  <li>The subscription moves from free to paid.</li>
  <li>A trial starts or ends.</li>
  </ul>

  <p>In these cases, we apply a credit for the unused time on the previous price, immediately charge the customer using the new price, and reset the billing date. Learn about how <a href="/docs/billing/subscriptions/upgrade-downgrade#immediate-payment">Stripe immediately attempts payment for subscription changes</a>.</p>

  <p>If you want to charge for an upgrade immediately, pass <code>proration_behavior</code> as <code>always_invoice</code> to create prorations, automatically invoice the customer for those proration adjustments, and attempt to collect payment. If you pass <code>create_prorations</code>, the prorations are created but not automatically invoiced. If you want to bill the customer for the prorations before the subscription’s renewal date, you need to manually <a href="/docs/api/invoices/create">invoice the customer</a>.</p>

  <p>If you don’t want to prorate, set the <code>proration_behavior</code> option to <code>none</code>. With this option, the customer is billed <currency>100</currency> on May 1 and <currency>200</currency> on June 1. Similarly, if you set <code>proration_behavior</code> to <code>none</code> when switching between different billing intervals (for example, from monthly to yearly), we don’t generate any credits for the old subscription’s unused time. We still reset the billing date and bill immediately for the new subscription.</p>

  <p>Updating the quantity on a subscription many times in an hour may result in <a href="/docs/rate-limits">rate limiting</a>. If you need to bill for a frequently changing quantity, consider integrating <a href="/docs/billing/subscriptions/usage-based">usage-based billing</a> instead.</p>
  test('POST /v1/subscriptions/{subscription_exposed_id} - Update a subscription', async ({ request }) => {
    const endpoint = '/v1/subscriptions/Adflicto vorago vomito addo delectus.';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Happy path test for DELETE /v1/subscriptions/{subscription_exposed_id}: <p>Cancels a customer’s subscription immediately. The customer won’t be charged again for the subscription. After it’s canceled, you can no longer update the subscription or its <a href="/metadata">metadata</a>.</p>

  <p>Any pending invoice items that you’ve created are still charged at the end of the period, unless manually <a href="#delete_invoiceitem">deleted</a>. If you’ve set the subscription to cancel at the end of the period, any pending prorations are also left in place and collected at the end of the period. But if the subscription is set to cancel immediately, pending prorations are removed if <code>invoice_now</code> and <code>prorate</code> are both set to true.</p>

  <p>By default, upon subscription cancellation, Stripe stops automatic collection of all finalized invoices for the customer. This is intended to prevent unexpected payment attempts after the customer has canceled a subscription. However, you can resume automatic collection of the invoices manually after subscription cancellation to have us proceed. Or, you could check for unpaid invoices before allowing the customer to cancel the subscription at all.</p>
  test('DELETE /v1/subscriptions/{subscription_exposed_id} - Cancel a subscription', async ({ request }) => {
    const endpoint = '/v1/subscriptions/Consequatur eius velut ter taceo vulticulus dolorem curtus.';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(200);

    // Validate response body
    const body = await response.json();


  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/subscriptions - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/subscriptions';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/subscriptions - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/subscriptions';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/subscriptions - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/subscriptions';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/subscriptions - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/subscriptions';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/subscriptions - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/subscriptions';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/subscriptions - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/subscriptions';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that omitting required parameter 'subscription_exposed_id' returns 400
  test('GET /v1/subscriptions/{subscription_exposed_id} - missing required parameter 'subscription_exposed_id' (400)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('GET /v1/subscriptions/{subscription_exposed_id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('GET /v1/subscriptions/{subscription_exposed_id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('GET /v1/subscriptions/{subscription_exposed_id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}';

    const response = await request.get(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent subscription_exposed_id returns 404
  test('GET /v1/subscriptions/{subscription_exposed_id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.get(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'subscription_exposed_id' returns 400
  test('POST /v1/subscriptions/{subscription_exposed_id} - missing required parameter 'subscription_exposed_id' (400)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('POST /v1/subscriptions/{subscription_exposed_id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('POST /v1/subscriptions/{subscription_exposed_id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('POST /v1/subscriptions/{subscription_exposed_id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}';

    const response = await request.post(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent subscription_exposed_id returns 404
  test('POST /v1/subscriptions/{subscription_exposed_id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.post(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });

  // Verify that omitting required parameter 'subscription_exposed_id' returns 400
  test('DELETE /v1/subscriptions/{subscription_exposed_id} - missing required parameter 'subscription_exposed_id' (400)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(400);

  });

  // Verify that request without authentication credentials returns 401
  test('DELETE /v1/subscriptions/{subscription_exposed_id} - no authentication (401)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that request with invalid token returns 401
  test('DELETE /v1/subscriptions/{subscription_exposed_id} - invalid authentication token (401)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer invalid-token-12345',
      }
    });

    // Validate response status
    expect(response.status()).toBe(401);

  });

  // Verify that valid authentication with insufficient permissions returns 403
  test('DELETE /v1/subscriptions/{subscription_exposed_id} - insufficient permissions (403)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/{subscription_exposed_id}';

    const response = await request.delete(endpoint, {
      headers: {,
          'Authorization': 'Bearer valid-token-limited-scope',
      }
    });

    // Validate response status
    expect(response.status()).toBe(403);

  });

  // Verify that requesting non-existent subscription_exposed_id returns 404
  test('DELETE /v1/subscriptions/{subscription_exposed_id} - resource not found (404)', async ({ request }) => {
    const endpoint = '/v1/subscriptions/nonexistent-id-99999999-aaaa-bbbb-cccc-dddddddddddd';

    const response = await request.delete(endpoint);

    // Validate response status
    expect(response.status()).toBe(404);

  });
});