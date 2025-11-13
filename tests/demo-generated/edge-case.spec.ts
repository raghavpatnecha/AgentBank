/**
 * Generated API Tests
 * Generated at: 2025-11-12T14:48:50.875Z
 * Endpoints: /users, /users/{userId}
 * Tags: edge-case, boundary, maxLength, special-characters, security, xss, sql-injection, unicode, internationalization, empty-value
 * Test count: 8
 */

import { test, expect } from '@playwright/test';

test.describe('edge-case API', () => {
  // Test name with exactly maxLength (100) characters
  test('POST /users - name at maximum length', async ({ request }) => {
    const endpoint = '/users';

    const response = await request.post(endpoint, {
      data: {
        email: 'Nicolette66@gmail.com',
        name: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      },
    });

    // Validate response status
    expect([200, 201, 204]).toContain(response.status());
  });

  // Test name with special characters, potential XSS and SQL injection patterns
  test('POST /users - name with special characters', async ({ request }) => {
    const endpoint = '/users';

    const response = await request.post(endpoint, {
      data: {
        email: 'Jessie_Schiller98@hotmail.com',
        name: "O'Brien-Smith <script>alert('XSS')</script> & DROP TABLE users;",
        age: 2,
      },
    });

    // Validate response status
    expect([200, 201, 204, 400]).toContain(response.status());
  });

  // Test name with various Unicode characters (emoji, CJK, etc.)
  test('POST /users - name with Unicode characters', async ({ request }) => {
    const endpoint = '/users';

    const response = await request.post(endpoint, {
      data: {
        email: 'Saige57@gmail.com',
        name: '你好世界 🌍 Привет Мир café ñoño',
      },
    });

    // Validate response status
    expect([200, 201, 204, 400]).toContain(response.status());
  });

  // Test optional role with empty string value
  test('POST /users - role as empty string', async ({ request }) => {
    const endpoint = '/users';

    const response = await request.post(endpoint, {
      data: {
        email: 'Dawn_Ward22@yahoo.com',
        name: 'Tyrannus suus delinquo sol bardus aegre ulciscor quae suadeo suscipio.',
        role: '',
      },
    });

    // Validate response status
    expect([200, 201, 204, 400]).toContain(response.status());
  });

  // Test name with exactly maxLength (100) characters
  test('PUT /users/{userId} - name at maximum length', async ({ request }) => {
    const endpoint = '/users/{userId}';

    const response = await request.put(endpoint, {
      data: {
        email: 'Nathaniel_Hessel7@yahoo.com',
        name: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        role: 'admin',
      },
    });

    // Validate response status
    expect([200, 201, 204]).toContain(response.status());
  });

  // Test name with special characters, potential XSS and SQL injection patterns
  test('PUT /users/{userId} - name with special characters', async ({ request }) => {
    const endpoint = '/users/{userId}';

    const response = await request.put(endpoint, {
      data: {
        email: 'Mariane65@hotmail.com',
        name: "O'Brien-Smith <script>alert('XSS')</script> & DROP TABLE users;",
      },
    });

    // Validate response status
    expect([200, 201, 204, 400]).toContain(response.status());
  });

  // Test name with various Unicode characters (emoji, CJK, etc.)
  test('PUT /users/{userId} - name with Unicode characters', async ({ request }) => {
    const endpoint = '/users/{userId}';

    const response = await request.put(endpoint, {
      data: {
        email: 'Earnest26@yahoo.com',
        name: '你好世界 🌍 Привет Мир café ñoño',
        age: 88,
        role: 'user',
      },
    });

    // Validate response status
    expect([200, 201, 204, 400]).toContain(response.status());
  });

  // Test optional role with empty string value
  test('PUT /users/{userId} - role as empty string', async ({ request }) => {
    const endpoint = '/users/{userId}';

    const response = await request.put(endpoint, {
      data: {
        email: 'Andre_Kihn@hotmail.com',
        name: 'Colligo centum deprecator colo cui ventus officiis.',
        role: '',
      },
    });

    // Validate response status
    expect([200, 201, 204, 400]).toContain(response.status());
  });
});
