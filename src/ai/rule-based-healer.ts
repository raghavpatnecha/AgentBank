/**
 * Rule-Based Test Healer
 *
 * Implements intelligent rule-based healing for common API change patterns.
 * This serves as a fallback when AI-based healing is unavailable or inappropriate.
 */

import {
  TransformationRule,
  RuleType,
  FieldRenameRule,
  FieldAdditionRule,
  FieldRemovalRule,
  PathChangeRule,
  StatusCodeChangeRule,
  RenamePattern,
  FieldRenameDetector,
  COMMON_STATUS_CODE_CHANGES,
} from './transformation-rules.js';

/**
 * Spec diff structure (from Task 4.1)
 */
export interface SpecDiff {
  endpointsAdded: string[];
  endpointsRemoved: string[];
  endpointsModified: Array<{
    path: string;
    method: string;
    changes: Change[];
  }>;
}

/**
 * Individual change in spec
 */
export interface Change {
  type:
    | 'field_renamed'
    | 'field_added'
    | 'field_removed'
    | 'type_changed'
    | 'path_changed'
    | 'status_code_changed'
    | 'parameter_added'
    | 'parameter_removed';
  location: string;
  oldValue?: unknown;
  newValue?: unknown;
  context?: 'request' | 'response' | 'parameter';
}

/**
 * Failed test information
 */
export interface FailedTest {
  testName: string;
  testFile: string;
  testCode: string;
  failureMessage: string;
  endpoint: string;
  method: string;
  failureType: FailureType;
}

/**
 * Failure type enumeration (from Task 4.2)
 */
export enum FailureType {
  FIELD_MISSING = 'field_missing',
  TYPE_MISMATCH = 'type_mismatch',
  STATUS_CODE_CHANGED = 'status_code_changed',
  AUTH_FAILED = 'auth_failed',
  ENDPOINT_NOT_FOUND = 'endpoint_not_found',
  TIMEOUT = 'timeout',
  NETWORK_ERROR = 'network_error',
  UNKNOWN = 'unknown',
}

/**
 * Healing result
 */
export interface HealingResult {
  success: boolean;
  healedCode?: string;
  rulesApplied: TransformationRule[];
  confidence: number;
  errors: string[];
  warnings: string[];
}

/**
 * Rule-based healer for automatic test fixing
 */
export class RuleBasedHealer {
  private renameDetector: FieldRenameDetector;

  constructor(similarityThreshold = 0.8) {
    this.renameDetector = new FieldRenameDetector(similarityThreshold);
  }

  /**
   * Heal a failed test using rule-based transformations
   */
  healTest(test: FailedTest, specDiff: SpecDiff): HealingResult {
    const result: HealingResult = {
      success: false,
      rulesApplied: [],
      confidence: 0,
      errors: [],
      warnings: [],
    };

    try {
      // Find relevant changes for this endpoint
      const relevantChanges = this.findRelevantChanges(test, specDiff);

      if (relevantChanges.length === 0) {
        result.warnings.push('No relevant spec changes found for this test');
        return result;
      }

      // Detect applicable rules
      const rules = this.detectRules(relevantChanges, test);

      if (rules.length === 0) {
        result.warnings.push('No applicable transformation rules detected');
        return result;
      }

      // Apply rules sequentially
      let healedCode = test.testCode;
      const appliedRules: TransformationRule[] = [];

      for (const rule of rules) {
        if (!rule.applicable) continue;

        const before = healedCode;
        healedCode = this.applyRule(rule, healedCode);

        if (healedCode !== before) {
          appliedRules.push(rule);
        }
      }

      // Validate healed code
      const isValid = this.validateHealing(test.testCode, healedCode);

      if (!isValid) {
        result.errors.push('Healed code failed validation');
        return result;
      }

      // Calculate overall confidence
      const confidence =
        appliedRules.length > 0
          ? appliedRules.reduce((sum, rule) => sum + rule.confidence, 0) / appliedRules.length
          : 0;

      result.success = appliedRules.length > 0;
      result.healedCode = healedCode;
      result.rulesApplied = appliedRules;
      result.confidence = confidence;

      if (appliedRules.length > 0) {
        result.warnings.push(`Applied ${appliedRules.length} transformation rule(s)`);
      }

      return result;
    } catch (error) {
      result.errors.push(
        `Healing failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return result;
    }
  }

  /**
   * Find changes relevant to the failed test
   */
  private findRelevantChanges(test: FailedTest, specDiff: SpecDiff): Change[] {
    const changes: Change[] = [];

    for (const modified of specDiff.endpointsModified) {
      // Match by path and method
      if (
        this.endpointMatches(test.endpoint, modified.path) &&
        test.method.toUpperCase() === modified.method.toUpperCase()
      ) {
        changes.push(...modified.changes);
      }
    }

    return changes;
  }

  /**
   * Check if endpoints match (handles path parameters)
   */
  private endpointMatches(testPath: string, specPath: string): boolean {
    // Direct match
    if (testPath === specPath) return true;

    // Convert to regex pattern (handle path params)
    const pattern = specPath.replace(/\{[^}]+\}/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);

    return regex.test(testPath);
  }

  /**
   * Detect applicable transformation rules from changes
   */
  private detectRules(changes: Change[], test: FailedTest): TransformationRule[] {
    const rules: TransformationRule[] = [];

    for (const change of changes) {
      switch (change.type) {
        case 'field_renamed':
          const renameRule = this.detectFieldRename(change);
          if (renameRule) rules.push(renameRule);
          break;

        case 'field_added':
          const addRule = this.detectFieldAddition(change);
          if (addRule) rules.push(addRule);
          break;

        case 'field_removed':
          const removeRule = this.detectFieldRemoval(change);
          if (removeRule) rules.push(removeRule);
          break;

        case 'path_changed':
          const pathRule = this.detectPathChange(change);
          if (pathRule) rules.push(pathRule);
          break;

        case 'status_code_changed':
          const statusRule = this.detectStatusCodeChange(change, test);
          if (statusRule) rules.push(statusRule);
          break;
      }
    }

    return rules;
  }

  /**
   * Detect field rename rule
   */
  detectFieldRename(change: Change): FieldRenameRule | null {
    if (typeof change.oldValue !== 'string' || typeof change.newValue !== 'string') {
      return null;
    }

    const oldField = change.oldValue;
    const newField = change.newValue;
    const pattern = this.renameDetector.detectPattern(oldField, newField);

    if (!pattern) {
      return null;
    }

    return {
      type: RuleType.FIELD_RENAME,
      oldField,
      newField,
      pattern,
      location: change.location,
      context: (change.context || 'response') as 'request' | 'response' | 'both',
      confidence: pattern === RenamePattern.SIMILARITY_MATCH ? 0.7 : 0.95,
      description: `Rename field "${oldField}" to "${newField}" (${pattern})`,
      applicable: true,
    };
  }

  /**
   * Detect field addition rule
   */
  detectFieldAddition(change: Change): FieldAdditionRule | null {
    if (typeof change.newValue !== 'object' || !change.newValue) {
      return null;
    }

    const fieldInfo = change.newValue as {
      name?: string;
      type?: string;
      required?: boolean;
      schema?: unknown;
    };

    if (!fieldInfo.name || !fieldInfo.type) {
      return null;
    }

    const defaultValue = this.generateDefaultValue(fieldInfo.type, fieldInfo.schema);
    const fakerMethod = this.getFakerMethod(fieldInfo.name, fieldInfo.type);

    return {
      type: RuleType.FIELD_ADDITION,
      fieldName: fieldInfo.name,
      fieldType: fieldInfo.type,
      required: fieldInfo.required || false,
      defaultValue,
      fakerMethod,
      location: change.location,
      schema: fieldInfo.schema as FieldAdditionRule['schema'],
      confidence: 0.85,
      description: `Add new ${fieldInfo.required ? 'required' : 'optional'} field "${fieldInfo.name}"`,
      applicable: true,
    };
  }

  /**
   * Detect field removal rule
   */
  detectFieldRemoval(change: Change): FieldRemovalRule | null {
    if (typeof change.oldValue !== 'object' || !change.oldValue) {
      return null;
    }

    const fieldInfo = change.oldValue as {
      name?: string;
      required?: boolean;
    };

    if (!fieldInfo.name) {
      return null;
    }

    return {
      type: RuleType.FIELD_REMOVAL,
      fieldName: fieldInfo.name,
      location: change.location,
      context: (change.context || 'response') as 'request' | 'response' | 'both',
      breaking: fieldInfo.required || false,
      confidence: 0.9,
      description: `Remove field "${fieldInfo.name}"`,
      applicable: true,
    };
  }

  /**
   * Detect path change rule
   */
  detectPathChange(change: Change): PathChangeRule | null {
    if (typeof change.oldValue !== 'string' || typeof change.newValue !== 'string') {
      return null;
    }

    const oldPath = change.oldValue;
    const newPath = change.newValue;

    // Detect change type
    let changeType: 'versioned' | 'renamed' | 'restructured' = 'renamed';
    if (/\/v\d+\//.test(newPath) && !/\/v\d+\//.test(oldPath)) {
      changeType = 'versioned';
    } else if (oldPath.split('/').length !== newPath.split('/').length) {
      changeType = 'restructured';
    }

    return {
      type: RuleType.PATH_CHANGE,
      oldPath,
      newPath,
      method: 'GET', // Will be updated from context
      changeType,
      confidence: 0.95,
      description: `Update path from "${oldPath}" to "${newPath}"`,
      applicable: true,
    };
  }

  /**
   * Detect status code change rule
   */
  detectStatusCodeChange(change: Change, test: FailedTest): StatusCodeChangeRule | null {
    if (typeof change.oldValue !== 'number' || typeof change.newValue !== 'number') {
      return null;
    }

    const oldStatus = change.oldValue;
    const newStatus = change.newValue;
    const changeKey = `${oldStatus}-${newStatus}`;
    const changeInfo = COMMON_STATUS_CODE_CHANGES[changeKey];

    return {
      type: RuleType.STATUS_CODE_CHANGE,
      oldStatus,
      newStatus,
      method: test.method,
      endpoint: test.endpoint,
      reason: changeInfo?.reason as StatusCodeChangeRule['reason'],
      confidence: changeInfo ? 0.95 : 0.7,
      description: `Update status code from ${oldStatus} to ${newStatus}`,
      applicable: true,
    };
  }

  /**
   * Apply a transformation rule to test code
   */
  applyRule(rule: TransformationRule, testCode: string): string {
    switch (rule.type) {
      case RuleType.FIELD_RENAME:
        return this.applyFieldRename(rule as FieldRenameRule, testCode);

      case RuleType.FIELD_ADDITION:
        return this.applyFieldAddition(rule as FieldAdditionRule, testCode);

      case RuleType.FIELD_REMOVAL:
        return this.applyFieldRemoval(rule as FieldRemovalRule, testCode);

      case RuleType.PATH_CHANGE:
        return this.applyPathChange(rule as PathChangeRule, testCode);

      case RuleType.STATUS_CODE_CHANGE:
        return this.applyStatusCodeChange(rule as StatusCodeChangeRule, testCode);

      default:
        return testCode;
    }
  }

  /**
   * Apply field rename transformation
   */
  applyFieldRename(rule: FieldRenameRule, code: string): string {
    let result = code;

    // Pattern 1: expect(body.oldField) or expect(data.oldField)
    const patterns = [
      new RegExp(`\\.${this.escapeRegex(rule.oldField)}\\b`, 'g'),
      new RegExp(`\\['${this.escapeRegex(rule.oldField)}'\\]`, 'g'),
      new RegExp(`\\["${this.escapeRegex(rule.oldField)}"\\]`, 'g'),
      new RegExp(`\\b${this.escapeRegex(rule.oldField)}:`, 'g'),
    ];

    for (const pattern of patterns) {
      if (pattern.toString().includes('\\.')) {
        result = result.replace(pattern, `.${rule.newField}`);
      } else if (pattern.toString().includes("['")) {
        result = result.replace(pattern, `['${rule.newField}']`);
      } else if (pattern.toString().includes('["')) {
        result = result.replace(pattern, `["${rule.newField}"]`);
      } else {
        result = result.replace(pattern, `${rule.newField}:`);
      }
    }

    return result;
  }

  /**
   * Apply field addition transformation
   */
  applyFieldAddition(rule: FieldAdditionRule, code: string): string {
    let result = code;

    // Find request body objects and add the new field
    const bodyPatterns = [/body:\s*\{([^}]+)\}/g, /data:\s*\{([^}]+)\}/g, /json:\s*\{([^}]+)\}/g];

    for (const pattern of bodyPatterns) {
      result = result.replace(pattern, (match, content) => {
        // Check if field already exists
        if (content.includes(rule.fieldName)) {
          return match;
        }

        // Add new field
        const value = this.formatValue(rule.defaultValue, rule.fieldType);
        const newField = `${rule.fieldName}: ${value}`;

        // Add to end of object
        const trimmedContent = content.trim();
        const needsComma = trimmedContent && !trimmedContent.endsWith(',');

        return match.replace(content, `${content}${needsComma ? ',' : ''}\n      ${newField}`);
      });
    }

    return result;
  }

  /**
   * Apply field removal transformation
   */
  applyFieldRemoval(rule: FieldRemovalRule, code: string): string {
    let result = code;

    // Remove field from request bodies
    const bodyFieldPattern = new RegExp(
      `[,\\s]*${this.escapeRegex(rule.fieldName)}\\s*:\\s*[^,}]+[,\\s]*`,
      'g'
    );
    result = result.replace(bodyFieldPattern, '');

    // Remove field from assertions
    const assertPatterns = [
      new RegExp(`expect\\([^)]*\\.${this.escapeRegex(rule.fieldName)}\\)\\.[^;]+;?\\s*`, 'g'),
      new RegExp(`expect\\([^)]*\\['${this.escapeRegex(rule.fieldName)}'\\]\\)\\.[^;]+;?\\s*`, 'g'),
      new RegExp(`expect\\([^)]*\\["${this.escapeRegex(rule.fieldName)}"\\]\\)\\.[^;]+;?\\s*`, 'g'),
    ];

    for (const pattern of assertPatterns) {
      result = result.replace(pattern, '');
    }

    return result;
  }

  /**
   * Apply path change transformation
   */
  applyPathChange(rule: PathChangeRule, code: string): string {
    let result = code;

    // Replace path in request calls
    const escapedOldPath = this.escapeRegex(rule.oldPath);
    const patterns = [
      new RegExp(`(['"\`])${escapedOldPath}\\1`, 'g'),
      new RegExp(`(['"\`])${escapedOldPath}/`, 'g'),
      new RegExp(`/${escapedOldPath}(['"\`])`, 'g'),
    ];

    for (const pattern of patterns) {
      result = result.replace(pattern, (match) => {
        return match.replace(rule.oldPath, rule.newPath);
      });
    }

    return result;
  }

  /**
   * Apply status code change transformation
   */
  applyStatusCodeChange(rule: StatusCodeChangeRule, code: string): string {
    let result = code;

    // Replace status code in assertions
    const patterns = [
      new RegExp(`expect\\(.*?\\.status\\(\\)\\)\\.toBe\\(${rule.oldStatus}\\)`, 'g'),
      new RegExp(`expect\\(.*?\\.status\\(\\)\\)\\.toEqual\\(${rule.oldStatus}\\)`, 'g'),
      new RegExp(`status.*?===.*?${rule.oldStatus}`, 'g'),
      new RegExp(`${rule.oldStatus}.*?===.*?status`, 'g'),
    ];

    for (const pattern of patterns) {
      result = result.replace(pattern, (match) => {
        return match.replace(String(rule.oldStatus), String(rule.newStatus));
      });
    }

    return result;
  }

  /**
   * Validate healed code
   */
  validateHealing(originalCode: string, healedCode: string): boolean {
    // Code must have changed
    if (originalCode === healedCode) {
      return false;
    }

    // Basic syntax validation - check for balanced braces
    const openBraces = (healedCode.match(/\{/g) || []).length;
    const closeBraces = (healedCode.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      return false;
    }

    // Check for balanced parentheses
    const openParens = (healedCode.match(/\(/g) || []).length;
    const closeParens = (healedCode.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return false;
    }

    // Check for balanced brackets
    const openBrackets = (healedCode.match(/\[/g) || []).length;
    const closeBrackets = (healedCode.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return false;
    }

    // Ensure test structure is preserved
    if (!healedCode.includes('test(') && !healedCode.includes('it(')) {
      return false;
    }

    // Ensure expect statements exist
    if (!healedCode.includes('expect(')) {
      return false;
    }

    return true;
  }

  /**
   * Generate default value for a field type
   */
  private generateDefaultValue(type: string, schema?: unknown): unknown {
    const schemaObj = schema as
      | { format?: string; enum?: unknown[]; minimum?: number; maximum?: number }
      | undefined;

    switch (type.toLowerCase()) {
      case 'string':
        if (schemaObj?.format === 'email') return 'test@example.com';
        if (schemaObj?.format === 'uri') return 'https://example.com';
        if (schemaObj?.format === 'date-time') return new Date().toISOString();
        if (schemaObj?.enum) return schemaObj.enum[0];
        return 'test-value';

      case 'number':
      case 'integer':
        if (schemaObj?.minimum !== undefined) return schemaObj.minimum;
        if (schemaObj?.maximum !== undefined) return Math.floor(schemaObj.maximum / 2);
        return 42;

      case 'boolean':
        return true;

      case 'array':
        return [];

      case 'object':
        return {};

      default:
        return null;
    }
  }

  /**
   * Get Faker.js method for field name/type
   */
  private getFakerMethod(fieldName: string, fieldType: string): string | undefined {
    const name = fieldName.toLowerCase();

    // Map common field names to Faker methods
    if (name.includes('email')) return 'internet.email';
    if (name.includes('name') && !name.includes('user')) return 'person.fullName';
    if (name.includes('firstname')) return 'person.firstName';
    if (name.includes('lastname')) return 'person.lastName';
    if (name.includes('phone')) return 'phone.number';
    if (name.includes('address')) return 'location.streetAddress';
    if (name.includes('city')) return 'location.city';
    if (name.includes('country')) return 'location.country';
    if (name.includes('zipcode') || name.includes('postalcode')) return 'location.zipCode';
    if (name.includes('company')) return 'company.name';
    if (name.includes('url') || name.includes('website')) return 'internet.url';
    if (name.includes('username')) return 'internet.userName';
    if (name.includes('password')) return 'internet.password';
    if (name.includes('avatar') || name.includes('image')) return 'image.avatar';
    if (name.includes('description')) return 'lorem.paragraph';
    if (name.includes('title')) return 'lorem.sentence';
    if (name.includes('age') && fieldType === 'integer') return 'number.int';
    if (name.includes('price') || name.includes('amount')) return 'commerce.price';
    if (name.includes('uuid') || name.includes('id')) return 'string.uuid';

    return undefined;
  }

  /**
   * Format value for code insertion
   */
  private formatValue(value: unknown, type: string): string {
    if (value === null || value === undefined) {
      return 'null';
    }

    switch (type.toLowerCase()) {
      case 'string':
        return `'${String(value).replace(/'/g, "\\'")}'`;
      case 'number':
      case 'integer':
      case 'boolean':
        return String(value);
      case 'array':
        return '[]';
      case 'object':
        return '{}';
      default:
        return JSON.stringify(value);
    }
  }

  /**
   * Escape string for use in regex
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
