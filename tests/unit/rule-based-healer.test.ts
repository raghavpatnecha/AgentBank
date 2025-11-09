/**
 * Comprehensive test suite for Rule-Based Test Healer
 *
 * Tests all transformation rules, pattern detection, and healing logic.
 * Target: 60+ tests with 85%+ coverage
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  RuleBasedHealer,
  FailedTest,
  FailureType,
  SpecDiff,
  Change,
} from '../../src/ai/rule-based-healer.js';
import {
  RuleType,
  RenamePattern,
  FieldRenameDetector,
  SimilarityMatcher,
  snakeToCamel,
  camelToSnake,
  kebabToCamel,
  camelToKebab,
  pascalToCamel,
  camelToPascal,
  snakeToPascal,
} from '../../src/ai/transformation-rules.js';

describe('Case Conversion Utilities', () => {
  test('snakeToCamel converts correctly', () => {
    expect(snakeToCamel('user_id')).toBe('userId');
    expect(snakeToCamel('first_name')).toBe('firstName');
    expect(snakeToCamel('created_at_timestamp')).toBe('createdAtTimestamp');
  });

  test('camelToSnake converts correctly', () => {
    expect(camelToSnake('userId')).toBe('user_id');
    expect(camelToSnake('firstName')).toBe('first_name');
    expect(camelToSnake('createdAtTimestamp')).toBe('created_at_timestamp');
  });

  test('kebabToCamel converts correctly', () => {
    expect(kebabToCamel('user-id')).toBe('userId');
    expect(kebabToCamel('first-name')).toBe('firstName');
    expect(kebabToCamel('created-at')).toBe('createdAt');
  });

  test('camelToKebab converts correctly', () => {
    expect(camelToKebab('userId')).toBe('user-id');
    expect(camelToKebab('firstName')).toBe('first-name');
    expect(camelToKebab('createdAt')).toBe('created-at');
  });

  test('pascalToCamel converts correctly', () => {
    expect(pascalToCamel('UserId')).toBe('userId');
    expect(pascalToCamel('FirstName')).toBe('firstName');
    expect(pascalToCamel('User')).toBe('user');
  });

  test('camelToPascal converts correctly', () => {
    expect(camelToPascal('userId')).toBe('UserId');
    expect(camelToPascal('firstName')).toBe('FirstName');
    expect(camelToPascal('user')).toBe('User');
  });

  test('snakeToPascal converts correctly', () => {
    expect(snakeToPascal('user_id')).toBe('UserId');
    expect(snakeToPascal('first_name')).toBe('FirstName');
  });
});

describe('FieldRenameDetector', () => {
  let detector: FieldRenameDetector;

  beforeEach(() => {
    detector = new FieldRenameDetector(0.8);
  });

  test('detects snake_case to camelCase rename', () => {
    const pattern = detector.detectPattern('user_id', 'userId');
    expect(pattern).toBe(RenamePattern.SNAKE_TO_CAMEL);
  });

  test('detects camelCase to snake_case rename', () => {
    const pattern = detector.detectPattern('userId', 'user_id');
    expect(pattern).toBe(RenamePattern.CAMEL_TO_SNAKE);
  });

  test('detects kebab-case to camelCase rename', () => {
    const pattern = detector.detectPattern('user-id', 'userId');
    expect(pattern).toBe(RenamePattern.KEBAB_TO_CAMEL);
  });

  test('detects camelCase to kebab-case rename', () => {
    const pattern = detector.detectPattern('userId', 'user-id');
    expect(pattern).toBe(RenamePattern.CAMEL_TO_KEBAB);
  });

  test('detects PascalCase to camelCase rename', () => {
    const pattern = detector.detectPattern('UserId', 'userId');
    expect(pattern).toBe(RenamePattern.PASCAL_TO_CAMEL);
  });

  test('detects camelCase to PascalCase rename', () => {
    const pattern = detector.detectPattern('userId', 'UserId');
    expect(pattern).toBe(RenamePattern.CAMEL_TO_PASCAL);
  });

  test('detects snake_case to PascalCase rename', () => {
    const pattern = detector.detectPattern('user_id', 'UserId');
    expect(pattern).toBe(RenamePattern.SNAKE_TO_PASCAL);
  });

  test('detects similarity match (80%+ similar)', () => {
    const pattern = detector.detectPattern('username', 'userName');
    expect(pattern).toBe(RenamePattern.SIMILARITY_MATCH);
  });

  test('detects abbreviation pattern', () => {
    const pattern = detector.detectPattern('id', 'identifier');
    expect(pattern).toBe(RenamePattern.ABBREVIATION);
  });

  test('detects expansion pattern', () => {
    const pattern = detector.detectPattern('identifier', 'id');
    expect(pattern).toBe(RenamePattern.EXPANSION);
  });

  test('returns null for unrelated field names', () => {
    const pattern = detector.detectPattern('email', 'password');
    expect(pattern).toBeNull();
  });

  test('handles complex field names', () => {
    const pattern = detector.detectPattern('created_at_timestamp', 'createdAtTimestamp');
    expect(pattern).toBe(RenamePattern.SNAKE_TO_CAMEL);
  });
});

describe('SimilarityMatcher', () => {
  let matcher: SimilarityMatcher;

  beforeEach(() => {
    matcher = new SimilarityMatcher(0.8);
  });

  test('finds exact match', () => {
    const result = matcher.findBestMatch('userId', ['userId', 'userName', 'email']);
    expect(result).toEqual({ match: 'userId', score: 1.0 });
  });

  test('finds best similar match', () => {
    const result = matcher.findBestMatch('username', ['userId', 'userName', 'email']);
    expect(result?.match).toBe('userName');
    expect(result?.score).toBeGreaterThan(0.8);
  });

  test('returns null when no match above threshold', () => {
    const result = matcher.findBestMatch('password', ['userId', 'email', 'name']);
    expect(result).toBeNull();
  });

  test('handles empty candidate list', () => {
    const result = matcher.findBestMatch('userId', []);
    expect(result).toBeNull();
  });

  test('handles single candidate', () => {
    const result = matcher.findBestMatch('userId', ['userId']);
    expect(result).toEqual({ match: 'userId', score: 1.0 });
  });

  test('finds match with different casing', () => {
    const result = matcher.findBestMatch('userid', ['userId', 'userName']);
    expect(result?.match).toBe('userId');
  });
});

describe('RuleBasedHealer - Field Rename Detection', () => {
  let healer: RuleBasedHealer;

  beforeEach(() => {
    healer = new RuleBasedHealer(0.8);
  });

  test('detects field rename from snake_case to camelCase', () => {
    const change: Change = {
      type: 'field_renamed',
      location: 'response.body.user',
      oldValue: 'user_id',
      newValue: 'userId',
      context: 'response',
    };

    const rule = healer.detectFieldRename(change);
    expect(rule).not.toBeNull();
    expect(rule?.type).toBe(RuleType.FIELD_RENAME);
    expect(rule?.oldField).toBe('user_id');
    expect(rule?.newField).toBe('userId');
    expect(rule?.pattern).toBe(RenamePattern.SNAKE_TO_CAMEL);
    expect(rule?.confidence).toBe(0.95);
  });

  test('detects field rename from camelCase to PascalCase', () => {
    const change: Change = {
      type: 'field_renamed',
      location: 'response.body',
      oldValue: 'userName',
      newValue: 'UserName',
    };

    const rule = healer.detectFieldRename(change);
    expect(rule?.pattern).toBe(RenamePattern.CAMEL_TO_PASCAL);
  });

  test('detects field rename from kebab-case to camelCase', () => {
    const change: Change = {
      type: 'field_renamed',
      location: 'response.body',
      oldValue: 'user-name',
      newValue: 'userName',
    };

    const rule = healer.detectFieldRename(change);
    expect(rule?.pattern).toBe(RenamePattern.KEBAB_TO_CAMEL);
  });

  test('detects similarity-based rename', () => {
    const change: Change = {
      type: 'field_renamed',
      location: 'response.body',
      oldValue: 'username',
      newValue: 'userName',
    };

    const rule = healer.detectFieldRename(change);
    expect(rule?.pattern).toBe(RenamePattern.SIMILARITY_MATCH);
    expect(rule?.confidence).toBe(0.7);
  });

  test('returns null for invalid rename change', () => {
    const change: Change = {
      type: 'field_renamed',
      location: 'response.body',
      oldValue: 123,
      newValue: 456,
    };

    const rule = healer.detectFieldRename(change);
    expect(rule).toBeNull();
  });
});

describe('RuleBasedHealer - Field Addition Detection', () => {
  let healer: RuleBasedHealer;

  beforeEach(() => {
    healer = new RuleBasedHealer();
  });

  test('detects required field addition', () => {
    const change: Change = {
      type: 'field_added',
      location: 'request.body',
      newValue: {
        name: 'age',
        type: 'integer',
        required: true,
      },
    };

    const rule = healer.detectFieldAddition(change);
    expect(rule).not.toBeNull();
    expect(rule?.type).toBe(RuleType.FIELD_ADDITION);
    expect(rule?.fieldName).toBe('age');
    expect(rule?.fieldType).toBe('integer');
    expect(rule?.required).toBe(true);
    expect(rule?.defaultValue).toBe(42);
  });

  test('detects optional field addition', () => {
    const change: Change = {
      type: 'field_added',
      location: 'request.body',
      newValue: {
        name: 'description',
        type: 'string',
        required: false,
      },
    };

    const rule = healer.detectFieldAddition(change);
    expect(rule?.required).toBe(false);
    expect(rule?.defaultValue).toBe('test-value');
  });

  test('generates email default for email format', () => {
    const change: Change = {
      type: 'field_added',
      location: 'request.body',
      newValue: {
        name: 'email',
        type: 'string',
        schema: { format: 'email' },
      },
    };

    const rule = healer.detectFieldAddition(change);
    expect(rule?.defaultValue).toBe('test@example.com');
    expect(rule?.fakerMethod).toBe('internet.email');
  });

  test('generates URI default for URI format', () => {
    const change: Change = {
      type: 'field_added',
      location: 'request.body',
      newValue: {
        name: 'website',
        type: 'string',
        schema: { format: 'uri' },
      },
    };

    const rule = healer.detectFieldAddition(change);
    expect(rule?.defaultValue).toBe('https://example.com');
  });

  test('handles enum field addition', () => {
    const change: Change = {
      type: 'field_added',
      location: 'request.body',
      newValue: {
        name: 'status',
        type: 'string',
        schema: { enum: ['active', 'inactive', 'pending'] },
      },
    };

    const rule = healer.detectFieldAddition(change);
    expect(rule?.defaultValue).toBe('active');
  });

  test('returns null for invalid addition change', () => {
    const change: Change = {
      type: 'field_added',
      location: 'request.body',
      newValue: null,
    };

    const rule = healer.detectFieldAddition(change);
    expect(rule).toBeNull();
  });
});

describe('RuleBasedHealer - Field Removal Detection', () => {
  let healer: RuleBasedHealer;

  beforeEach(() => {
    healer = new RuleBasedHealer();
  });

  test('detects field removal', () => {
    const change: Change = {
      type: 'field_removed',
      location: 'response.body',
      oldValue: {
        name: 'deprecated_field',
        required: false,
      },
    };

    const rule = healer.detectFieldRemoval(change);
    expect(rule).not.toBeNull();
    expect(rule?.type).toBe(RuleType.FIELD_REMOVAL);
    expect(rule?.fieldName).toBe('deprecated_field');
    expect(rule?.breaking).toBe(false);
  });

  test('marks required field removal as breaking', () => {
    const change: Change = {
      type: 'field_removed',
      location: 'response.body',
      oldValue: {
        name: 'required_field',
        required: true,
      },
    };

    const rule = healer.detectFieldRemoval(change);
    expect(rule?.breaking).toBe(true);
  });

  test('returns null for invalid removal change', () => {
    const change: Change = {
      type: 'field_removed',
      location: 'response.body',
      oldValue: 'invalid',
    };

    const rule = healer.detectFieldRemoval(change);
    expect(rule).toBeNull();
  });
});

describe('RuleBasedHealer - Path Change Detection', () => {
  let healer: RuleBasedHealer;

  beforeEach(() => {
    healer = new RuleBasedHealer();
  });

  test('detects versioned path change', () => {
    const change: Change = {
      type: 'path_changed',
      location: 'endpoint',
      oldValue: '/users',
      newValue: '/v2/users',
    };

    const rule = healer.detectPathChange(change);
    expect(rule).not.toBeNull();
    expect(rule?.type).toBe(RuleType.PATH_CHANGE);
    expect(rule?.oldPath).toBe('/users');
    expect(rule?.newPath).toBe('/v2/users');
    expect(rule?.changeType).toBe('versioned');
  });

  test('detects renamed path change', () => {
    const change: Change = {
      type: 'path_changed',
      location: 'endpoint',
      oldValue: '/users',
      newValue: '/accounts',
    };

    const rule = healer.detectPathChange(change);
    expect(rule?.changeType).toBe('renamed');
  });

  test('detects restructured path change', () => {
    const change: Change = {
      type: 'path_changed',
      location: 'endpoint',
      oldValue: '/users',
      newValue: '/api/v1/users',
    };

    const rule = healer.detectPathChange(change);
    expect(rule?.changeType).toBe('restructured');
  });
});

describe('RuleBasedHealer - Status Code Change Detection', () => {
  let healer: RuleBasedHealer;
  let testInfo: FailedTest;

  beforeEach(() => {
    healer = new RuleBasedHealer();
    testInfo = {
      testName: 'test',
      testFile: 'test.spec.ts',
      testCode: '',
      failureMessage: '',
      endpoint: '/users',
      method: 'POST',
      failureType: FailureType.STATUS_CODE_CHANGED,
    };
  });

  test('detects 200 to 201 status code change', () => {
    const change: Change = {
      type: 'status_code_changed',
      location: 'response',
      oldValue: 200,
      newValue: 201,
    };

    const rule = healer.detectStatusCodeChange(change, testInfo);
    expect(rule).not.toBeNull();
    expect(rule?.type).toBe(RuleType.STATUS_CODE_CHANGE);
    expect(rule?.oldStatus).toBe(200);
    expect(rule?.newStatus).toBe(201);
    expect(rule?.reason).toBe('created_instead_of_ok');
    expect(rule?.confidence).toBe(0.95);
  });

  test('detects 200 to 404 status code change', () => {
    const change: Change = {
      type: 'status_code_changed',
      location: 'response',
      oldValue: 200,
      newValue: 404,
    };

    const rule = healer.detectStatusCodeChange(change, testInfo);
    expect(rule?.reason).toBe('not_found');
  });

  test('detects 200 to 204 status code change', () => {
    const change: Change = {
      type: 'status_code_changed',
      location: 'response',
      oldValue: 200,
      newValue: 204,
    };

    const rule = healer.detectStatusCodeChange(change, testInfo);
    expect(rule?.reason).toBe('no_content_instead_of_ok');
  });

  test('handles unknown status code change', () => {
    const change: Change = {
      type: 'status_code_changed',
      location: 'response',
      oldValue: 200,
      newValue: 418, // I'm a teapot
    };

    const rule = healer.detectStatusCodeChange(change, testInfo);
    expect(rule?.reason).toBeUndefined();
    expect(rule?.confidence).toBe(0.7);
  });
});

describe('RuleBasedHealer - Apply Field Rename', () => {
  let healer: RuleBasedHealer;

  beforeEach(() => {
    healer = new RuleBasedHealer();
  });

  test('renames field in dot notation', () => {
    const code = `expect(body.user_id).toBe(123);`;
    const rule = {
      type: RuleType.FIELD_RENAME,
      oldField: 'user_id',
      newField: 'userId',
      pattern: RenamePattern.SNAKE_TO_CAMEL,
      location: 'response.body',
      context: 'response' as const,
      confidence: 0.95,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyFieldRename(rule, code);
    expect(result).toBe(`expect(body.userId).toBe(123);`);
  });

  test('renames field in bracket notation with single quotes', () => {
    const code = `expect(body['user_id']).toBe(123);`;
    const rule = {
      type: RuleType.FIELD_RENAME,
      oldField: 'user_id',
      newField: 'userId',
      pattern: RenamePattern.SNAKE_TO_CAMEL,
      location: 'response.body',
      context: 'response' as const,
      confidence: 0.95,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyFieldRename(rule, code);
    expect(result).toBe(`expect(body['userId']).toBe(123);`);
  });

  test('renames field in bracket notation with double quotes', () => {
    const code = `expect(body["user_id"]).toBe(123);`;
    const rule = {
      type: RuleType.FIELD_RENAME,
      oldField: 'user_id',
      newField: 'userId',
      pattern: RenamePattern.SNAKE_TO_CAMEL,
      location: 'response.body',
      context: 'response' as const,
      confidence: 0.95,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyFieldRename(rule, code);
    expect(result).toBe(`expect(body["userId"]).toBe(123);`);
  });

  test('renames field in object literal', () => {
    const code = `const data = { user_id: 123 };`;
    const rule = {
      type: RuleType.FIELD_RENAME,
      oldField: 'user_id',
      newField: 'userId',
      pattern: RenamePattern.SNAKE_TO_CAMEL,
      location: 'request.body',
      context: 'request' as const,
      confidence: 0.95,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyFieldRename(rule, code);
    expect(result).toBe(`const data = { userId: 123 };`);
  });

  test('renames multiple occurrences', () => {
    const code = `
      const data = { user_id: 123 };
      expect(body.user_id).toBe(123);
      expect(body.user_id).toBeDefined();
    `;
    const rule = {
      type: RuleType.FIELD_RENAME,
      oldField: 'user_id',
      newField: 'userId',
      pattern: RenamePattern.SNAKE_TO_CAMEL,
      location: 'response.body',
      context: 'both' as const,
      confidence: 0.95,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyFieldRename(rule, code);
    expect(result).toContain('userId: 123');
    expect(result).toContain('body.userId');
    expect(result.match(/userId/g)?.length).toBe(3);
  });
});

describe('RuleBasedHealer - Apply Field Addition', () => {
  let healer: RuleBasedHealer;

  beforeEach(() => {
    healer = new RuleBasedHealer();
  });

  test('adds field to request body', () => {
    const code = `
      body: {
        name: 'John',
        email: 'john@example.com'
      }
    `;
    const rule = {
      type: RuleType.FIELD_ADDITION,
      fieldName: 'age',
      fieldType: 'integer',
      required: true,
      defaultValue: 30,
      location: 'request.body',
      confidence: 0.85,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyFieldAddition(rule, code);
    expect(result).toContain('age: 30');
  });

  test('adds string field with proper formatting', () => {
    const code = `data: { name: 'John' }`;
    const rule = {
      type: RuleType.FIELD_ADDITION,
      fieldName: 'email',
      fieldType: 'string',
      required: true,
      defaultValue: 'test@example.com',
      location: 'request.body',
      confidence: 0.85,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyFieldAddition(rule, code);
    expect(result).toContain("email: 'test@example.com'");
  });

  test('does not add duplicate field', () => {
    const code = `body: { age: 25, name: 'John' }`;
    const rule = {
      type: RuleType.FIELD_ADDITION,
      fieldName: 'age',
      fieldType: 'integer',
      required: true,
      defaultValue: 30,
      location: 'request.body',
      confidence: 0.85,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyFieldAddition(rule, code);
    expect(result).toBe(code);
  });
});

describe('RuleBasedHealer - Apply Field Removal', () => {
  let healer: RuleBasedHealer;

  beforeEach(() => {
    healer = new RuleBasedHealer();
  });

  test('removes field from request body', () => {
    const code = `body: { name: 'John', deprecated: true, email: 'test@example.com' }`;
    const rule = {
      type: RuleType.FIELD_REMOVAL,
      fieldName: 'deprecated',
      location: 'request.body',
      context: 'request' as const,
      breaking: false,
      confidence: 0.9,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyFieldRemoval(rule, code);
    expect(result).not.toContain('deprecated');
    expect(result).toContain('name');
    expect(result).toContain('email');
  });

  test('removes field from assertions', () => {
    const code = `
      expect(body.name).toBe('John');
      expect(body.deprecated).toBe(true);
      expect(body.email).toBeDefined();
    `;
    const rule = {
      type: RuleType.FIELD_REMOVAL,
      fieldName: 'deprecated',
      location: 'response.body',
      context: 'response' as const,
      breaking: false,
      confidence: 0.9,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyFieldRemoval(rule, code);
    expect(result).not.toContain('deprecated');
    expect(result).toContain('body.name');
    expect(result).toContain('body.email');
  });
});

describe('RuleBasedHealer - Apply Path Change', () => {
  let healer: RuleBasedHealer;

  beforeEach(() => {
    healer = new RuleBasedHealer();
  });

  test('updates path in single quotes', () => {
    const code = `await request.get('/users');`;
    const rule = {
      type: RuleType.PATH_CHANGE,
      oldPath: '/users',
      newPath: '/v2/users',
      method: 'GET',
      changeType: 'versioned' as const,
      confidence: 0.95,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyPathChange(rule, code);
    expect(result).toBe(`await request.get('/v2/users');`);
  });

  test('updates path in double quotes', () => {
    const code = `await request.get("/users");`;
    const rule = {
      type: RuleType.PATH_CHANGE,
      oldPath: '/users',
      newPath: '/v2/users',
      method: 'GET',
      changeType: 'versioned' as const,
      confidence: 0.95,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyPathChange(rule, code);
    expect(result).toBe(`await request.get("/v2/users");`);
  });

  test('updates path in template literals', () => {
    const code = 'await request.get(`/users`);';
    const rule = {
      type: RuleType.PATH_CHANGE,
      oldPath: '/users',
      newPath: '/v2/users',
      method: 'GET',
      changeType: 'versioned' as const,
      confidence: 0.95,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyPathChange(rule, code);
    expect(result).toBe('await request.get(`/v2/users`);');
  });

  test('updates multiple path occurrences', () => {
    const code = `
      await request.get('/users');
      await request.post('/users');
    `;
    const rule = {
      type: RuleType.PATH_CHANGE,
      oldPath: '/users',
      newPath: '/v2/users',
      method: 'GET',
      changeType: 'versioned' as const,
      confidence: 0.95,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyPathChange(rule, code);
    expect(result.match(/\/v2\/users/g)?.length).toBe(2);
  });
});

describe('RuleBasedHealer - Apply Status Code Change', () => {
  let healer: RuleBasedHealer;

  beforeEach(() => {
    healer = new RuleBasedHealer();
  });

  test('updates status code in toBe assertion', () => {
    const code = `expect(response.status()).toBe(200);`;
    const rule = {
      type: RuleType.STATUS_CODE_CHANGE,
      oldStatus: 200,
      newStatus: 201,
      method: 'POST',
      endpoint: '/users',
      reason: 'created_instead_of_ok' as const,
      confidence: 0.95,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyStatusCodeChange(rule, code);
    expect(result).toBe(`expect(response.status()).toBe(201);`);
  });

  test('updates status code in toEqual assertion', () => {
    const code = `expect(response.status()).toEqual(200);`;
    const rule = {
      type: RuleType.STATUS_CODE_CHANGE,
      oldStatus: 200,
      newStatus: 404,
      method: 'GET',
      endpoint: '/users/123',
      confidence: 0.95,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyStatusCodeChange(rule, code);
    expect(result).toBe(`expect(response.status()).toEqual(404);`);
  });

  test('updates multiple status code assertions', () => {
    const code = `
      expect(response.status()).toBe(200);
      expect(response.status()).toEqual(200);
    `;
    const rule = {
      type: RuleType.STATUS_CODE_CHANGE,
      oldStatus: 200,
      newStatus: 201,
      method: 'POST',
      endpoint: '/users',
      confidence: 0.95,
      description: 'test',
      applicable: true,
    };

    const result = healer.applyStatusCodeChange(rule, code);
    expect(result.match(/201/g)?.length).toBe(2);
  });
});

describe('RuleBasedHealer - Validation', () => {
  let healer: RuleBasedHealer;

  beforeEach(() => {
    healer = new RuleBasedHealer();
  });

  test('validates successful healing', () => {
    const original = `expect(body.user_id).toBe(123);`;
    const healed = `expect(body.userId).toBe(123);`;

    const isValid = healer.validateHealing(original, healed);
    expect(isValid).toBe(true);
  });

  test('rejects unchanged code', () => {
    const code = `expect(body.id).toBe(123);`;

    const isValid = healer.validateHealing(code, code);
    expect(isValid).toBe(false);
  });

  test('rejects code with unbalanced braces', () => {
    const original = `expect(body.id).toBe(123);`;
    const healed = `expect(body.id).toBe(123);{`;

    const isValid = healer.validateHealing(original, healed);
    expect(isValid).toBe(false);
  });

  test('rejects code with unbalanced parentheses', () => {
    const original = `expect(body.id).toBe(123);`;
    const healed = `expect(body.id).toBe(123;`;

    const isValid = healer.validateHealing(original, healed);
    expect(isValid).toBe(false);
  });

  test('rejects code without test structure', () => {
    const original = `test('should work', () => { expect(true).toBe(true); });`;
    const healed = `const x = 5;`;

    const isValid = healer.validateHealing(original, healed);
    expect(isValid).toBe(false);
  });

  test('rejects code without expect statements', () => {
    const original = `test('should work', () => { expect(true).toBe(true); });`;
    const healed = `test('should work', () => { const x = 5; });`;

    const isValid = healer.validateHealing(original, healed);
    expect(isValid).toBe(false);
  });
});

describe('RuleBasedHealer - Integration Tests', () => {
  let healer: RuleBasedHealer;

  beforeEach(() => {
    healer = new RuleBasedHealer();
  });

  test('heals test with field rename', () => {
    const test: FailedTest = {
      testName: 'GET /users',
      testFile: 'users.spec.ts',
      testCode: `
        test('should get user', async () => {
          const response = await request.get('/users/1');
          expect(response.status()).toBe(200);
          const body = await response.json();
          expect(body.user_id).toBe(1);
        });
      `,
      failureMessage: 'Expected property user_id not found',
      endpoint: '/users/1',
      method: 'GET',
      failureType: FailureType.FIELD_MISSING,
    };

    const specDiff: SpecDiff = {
      endpointsAdded: [],
      endpointsRemoved: [],
      endpointsModified: [
        {
          path: '/users/{id}',
          method: 'GET',
          changes: [
            {
              type: 'field_renamed',
              location: 'response.body',
              oldValue: 'user_id',
              newValue: 'userId',
              context: 'response',
            },
          ],
        },
      ],
    };

    const result = healer.healTest(test, specDiff);
    expect(result.success).toBe(true);
    expect(result.healedCode).toContain('body.userId');
    expect(result.rulesApplied.length).toBe(1);
    expect(result.rulesApplied[0].type).toBe(RuleType.FIELD_RENAME);
  });

  test('heals test with status code change', () => {
    const test: FailedTest = {
      testName: 'POST /users',
      testFile: 'users.spec.ts',
      testCode: `
        test('should create user', async () => {
          const response = await request.post('/users', { data: { name: 'John' } });
          expect(response.status()).toBe(200);
        });
      `,
      failureMessage: 'Expected status 200 but got 201',
      endpoint: '/users',
      method: 'POST',
      failureType: FailureType.STATUS_CODE_CHANGED,
    };

    const specDiff: SpecDiff = {
      endpointsAdded: [],
      endpointsRemoved: [],
      endpointsModified: [
        {
          path: '/users',
          method: 'POST',
          changes: [
            {
              type: 'status_code_changed',
              location: 'response',
              oldValue: 200,
              newValue: 201,
            },
          ],
        },
      ],
    };

    const result = healer.healTest(test, specDiff);
    expect(result.success).toBe(true);
    expect(result.healedCode).toContain('toBe(201)');
    expect(result.rulesApplied[0].type).toBe(RuleType.STATUS_CODE_CHANGE);
  });

  test('heals test with multiple changes', () => {
    const test: FailedTest = {
      testName: 'POST /users',
      testFile: 'users.spec.ts',
      testCode: `
        test('should create user', async () => {
          const response = await request.post('/users', {
            body: { name: 'John', email: 'john@example.com' }
          });
          expect(response.status()).toBe(200);
          const body = await response.json();
          expect(body.user_id).toBeDefined();
        });
      `,
      failureMessage: 'Multiple failures',
      endpoint: '/users',
      method: 'POST',
      failureType: FailureType.FIELD_MISSING,
    };

    const specDiff: SpecDiff = {
      endpointsAdded: [],
      endpointsRemoved: [],
      endpointsModified: [
        {
          path: '/users',
          method: 'POST',
          changes: [
            {
              type: 'field_renamed',
              location: 'response.body',
              oldValue: 'user_id',
              newValue: 'userId',
              context: 'response',
            },
            {
              type: 'status_code_changed',
              location: 'response',
              oldValue: 200,
              newValue: 201,
            },
            {
              type: 'field_added',
              location: 'request.body',
              newValue: {
                name: 'age',
                type: 'integer',
                required: true,
              },
            },
          ],
        },
      ],
    };

    const result = healer.healTest(test, specDiff);
    expect(result.success).toBe(true);
    expect(result.healedCode).toContain('userId');
    expect(result.healedCode).toContain('toBe(201)');
    expect(result.healedCode).toContain('age:');
    expect(result.rulesApplied.length).toBe(3);
  });

  test('returns warnings when no relevant changes found', () => {
    const test: FailedTest = {
      testName: 'GET /products',
      testFile: 'products.spec.ts',
      testCode: 'test code',
      failureMessage: 'Test failed',
      endpoint: '/products',
      method: 'GET',
      failureType: FailureType.UNKNOWN,
    };

    const specDiff: SpecDiff = {
      endpointsAdded: [],
      endpointsRemoved: [],
      endpointsModified: [
        {
          path: '/users',
          method: 'GET',
          changes: [],
        },
      ],
    };

    const result = healer.healTest(test, specDiff);
    expect(result.success).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('handles healing errors gracefully', () => {
    const test: FailedTest = {
      testName: 'test',
      testFile: 'test.spec.ts',
      testCode: '',
      failureMessage: '',
      endpoint: '/test',
      method: 'GET',
      failureType: FailureType.UNKNOWN,
    };

    const specDiff: SpecDiff = {
      endpointsAdded: [],
      endpointsRemoved: [],
      endpointsModified: [],
    };

    const result = healer.healTest(test, specDiff);
    expect(result.success).toBe(false);
  });
});
