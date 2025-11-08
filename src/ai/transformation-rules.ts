/**
 * Transformation Rules for Rule-Based Test Healing
 *
 * Defines rule types and detection logic for common API change patterns
 * that can be automatically healed without AI assistance.
 */

/**
 * Base interface for all transformation rules
 */
export interface TransformationRule {
  /** Rule type identifier */
  type: RuleType;

  /** Confidence score (0-1) */
  confidence: number;

  /** Human-readable description */
  description: string;

  /** Whether this rule is applicable */
  applicable: boolean;

  /** Rule metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Available rule types
 */
export enum RuleType {
  FIELD_RENAME = 'field_rename',
  FIELD_ADDITION = 'field_addition',
  FIELD_REMOVAL = 'field_removal',
  PATH_CHANGE = 'path_change',
  STATUS_CODE_CHANGE = 'status_code_change',
  TYPE_CHANGE = 'type_change',
  NESTED_FIELD_CHANGE = 'nested_field_change'
}

/**
 * Field rename transformation rule
 */
export interface FieldRenameRule extends TransformationRule {
  type: RuleType.FIELD_RENAME;

  /** Original field name */
  oldField: string;

  /** New field name */
  newField: string;

  /** Rename pattern detected */
  pattern: RenamePattern;

  /** JSON path to the field (e.g., "response.body.user.id") */
  location: string;

  /** Whether field is in request or response */
  context: 'request' | 'response' | 'both';

  /** Nested path if field is nested (e.g., ["user", "profile", "name"]) */
  nestedPath?: string[];
}

/**
 * Field addition transformation rule
 */
export interface FieldAdditionRule extends TransformationRule {
  type: RuleType.FIELD_ADDITION;

  /** New field name */
  fieldName: string;

  /** Field type */
  fieldType: string;

  /** Whether field is required */
  required: boolean;

  /** Default value to use */
  defaultValue: unknown;

  /** Faker.js method to generate realistic data */
  fakerMethod?: string;

  /** JSON path where field should be added */
  location: string;

  /** Field schema information */
  schema?: {
    type: string;
    format?: string;
    pattern?: string;
    minimum?: number;
    maximum?: number;
    enum?: unknown[];
  };
}

/**
 * Field removal transformation rule
 */
export interface FieldRemovalRule extends TransformationRule {
  type: RuleType.FIELD_REMOVAL;

  /** Removed field name */
  fieldName: string;

  /** JSON path to removed field */
  location: string;

  /** Whether field was in request or response */
  context: 'request' | 'response' | 'both';

  /** Whether removal breaks test (required field) */
  breaking: boolean;
}

/**
 * Path change transformation rule
 */
export interface PathChangeRule extends TransformationRule {
  type: RuleType.PATH_CHANGE;

  /** Original path */
  oldPath: string;

  /** New path */
  newPath: string;

  /** Path parameters that changed */
  parameterChanges?: Array<{
    oldParam: string;
    newParam: string;
  }>;

  /** HTTP method */
  method: string;

  /** Change type */
  changeType: 'versioned' | 'renamed' | 'restructured';
}

/**
 * Status code change transformation rule
 */
export interface StatusCodeChangeRule extends TransformationRule {
  type: RuleType.STATUS_CODE_CHANGE;

  /** Original status code */
  oldStatus: number;

  /** New status code */
  newStatus: number;

  /** HTTP method */
  method: string;

  /** Endpoint path */
  endpoint: string;

  /** Change reason if detectable */
  reason?: 'created_instead_of_ok' | 'no_content_instead_of_ok' | 'not_found' | 'unauthorized' | 'unknown';
}

/**
 * Rename patterns for field names
 */
export enum RenamePattern {
  SNAKE_TO_CAMEL = 'snake_to_camel',        // user_id → userId
  CAMEL_TO_SNAKE = 'camel_to_snake',        // userId → user_id
  KEBAB_TO_CAMEL = 'kebab_to_camel',        // user-id → userId
  CAMEL_TO_KEBAB = 'camel_to_kebab',        // userId → user-id
  PASCAL_TO_CAMEL = 'pascal_to_camel',      // UserId → userId
  CAMEL_TO_PASCAL = 'camel_to_pascal',      // userId → UserId
  SNAKE_TO_PASCAL = 'snake_to_pascal',      // user_id → UserId
  SIMILARITY_MATCH = 'similarity_match',     // username → userName (fuzzy)
  ABBREVIATION = 'abbreviation',             // id → identifier
  EXPANSION = 'expansion'                    // identifier → id
}

/**
 * Common rename patterns with regex matchers
 */
export const COMMON_RENAME_PATTERNS = [
  {
    pattern: RenamePattern.SNAKE_TO_CAMEL,
    detect: (oldName: string, newName: string): boolean => {
      const converted = snakeToCamel(oldName);
      return converted === newName;
    },
    transform: snakeToCamel
  },
  {
    pattern: RenamePattern.CAMEL_TO_SNAKE,
    detect: (oldName: string, newName: string): boolean => {
      const converted = camelToSnake(oldName);
      return converted === newName;
    },
    transform: camelToSnake
  },
  {
    pattern: RenamePattern.KEBAB_TO_CAMEL,
    detect: (oldName: string, newName: string): boolean => {
      const converted = kebabToCamel(oldName);
      return converted === newName;
    },
    transform: kebabToCamel
  },
  {
    pattern: RenamePattern.CAMEL_TO_KEBAB,
    detect: (oldName: string, newName: string): boolean => {
      const converted = camelToKebab(oldName);
      return converted === newName;
    },
    transform: camelToKebab
  },
  {
    pattern: RenamePattern.PASCAL_TO_CAMEL,
    detect: (oldName: string, newName: string): boolean => {
      const converted = pascalToCamel(oldName);
      return converted === newName;
    },
    transform: pascalToCamel
  },
  {
    pattern: RenamePattern.CAMEL_TO_PASCAL,
    detect: (oldName: string, newName: string): boolean => {
      const converted = camelToPascal(oldName);
      return converted === newName;
    },
    transform: camelToPascal
  },
  {
    pattern: RenamePattern.SNAKE_TO_PASCAL,
    detect: (oldName: string, newName: string): boolean => {
      const converted = snakeToPascal(oldName);
      return converted === newName;
    },
    transform: snakeToPascal
  }
];

/**
 * Common status code changes and their meanings
 */
export const COMMON_STATUS_CODE_CHANGES: Record<string, { reason: string; breaking: boolean }> = {
  '200-201': { reason: 'created_instead_of_ok', breaking: false },
  '200-204': { reason: 'no_content_instead_of_ok', breaking: false },
  '200-404': { reason: 'not_found', breaking: true },
  '200-401': { reason: 'unauthorized', breaking: true },
  '200-403': { reason: 'forbidden', breaking: true },
  '201-200': { reason: 'ok_instead_of_created', breaking: false },
  '201-204': { reason: 'no_content_instead_of_created', breaking: false },
  '204-200': { reason: 'ok_instead_of_no_content', breaking: false },
  '404-200': { reason: 'endpoint_restored', breaking: false }
};

/**
 * Case conversion utilities
 */

export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

export function pascalToCamel(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

export function camelToPascal(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function snakeToPascal(str: string): string {
  return camelToPascal(snakeToCamel(str));
}

/**
 * Field rename detector using various pattern matching strategies
 */
export class FieldRenameDetector {
  private similarityThreshold: number;

  constructor(similarityThreshold = 0.8) {
    this.similarityThreshold = similarityThreshold;
  }

  /**
   * Detect rename pattern between two field names
   */
  detectPattern(oldField: string, newField: string): RenamePattern | null {
    // Try exact pattern matches first
    for (const { pattern, detect } of COMMON_RENAME_PATTERNS) {
      if (detect(oldField, newField)) {
        return pattern;
      }
    }

    // Try similarity matching
    const similarity = this.calculateSimilarity(oldField, newField);
    if (similarity >= this.similarityThreshold) {
      return RenamePattern.SIMILARITY_MATCH;
    }

    // Check for abbreviation/expansion
    if (this.isAbbreviation(oldField, newField)) {
      return RenamePattern.ABBREVIATION;
    }
    if (this.isAbbreviation(newField, oldField)) {
      return RenamePattern.EXPANSION;
    }

    return null;
  }

  /**
   * Calculate similarity score between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      if (!matrix[0]) matrix[0] = [];
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (!matrix[i]) matrix[i] = [];
        if (!matrix[i - 1]) matrix[i - 1] = [];

        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          const prev = matrix[i - 1]?.[j - 1];
          matrix[i]![j] = prev !== undefined ? prev : 0;
        } else {
          const sub = matrix[i - 1]?.[j - 1] ?? 0;
          const ins = matrix[i]?.[j - 1] ?? 0;
          const del = matrix[i - 1]?.[j] ?? 0;

          matrix[i]![j] = Math.min(
            sub + 1, // substitution
            ins + 1, // insertion
            del + 1  // deletion
          );
        }
      }
    }

    const result = matrix[str2.length]?.[str1.length];
    return result !== undefined ? result : 0;
  }

  /**
   * Check if one string is an abbreviation of another
   */
  private isAbbreviation(shorter: string, longer: string): boolean {
    if (shorter.length >= longer.length) {
      return false;
    }

    // Remove common prefixes/suffixes
    const commonPrefixes = ['get', 'set', 'is', 'has', 'the'];
    const cleanShorter = this.removeCommonPrefixes(shorter.toLowerCase(), commonPrefixes);
    const cleanLonger = this.removeCommonPrefixes(longer.toLowerCase(), commonPrefixes);

    // Check if shorter is contained in longer
    if (cleanLonger.includes(cleanShorter)) {
      return true;
    }

    // Check if all characters of shorter appear in order in longer
    let shorterIndex = 0;
    for (let i = 0; i < cleanLonger.length && shorterIndex < cleanShorter.length; i++) {
      if (cleanLonger[i] === cleanShorter[shorterIndex]) {
        shorterIndex++;
      }
    }

    return shorterIndex === cleanShorter.length;
  }

  /**
   * Remove common prefixes from a string
   */
  private removeCommonPrefixes(str: string, prefixes: string[]): string {
    for (const prefix of prefixes) {
      if (str.startsWith(prefix)) {
        return str.slice(prefix.length);
      }
    }
    return str;
  }
}

/**
 * Similarity matcher for fuzzy string matching
 */
export class SimilarityMatcher {
  private threshold: number;

  constructor(threshold = 0.8) {
    this.threshold = threshold;
  }

  /**
   * Find best match for a field name from a list of candidates
   */
  findBestMatch(target: string, candidates: string[]): { match: string; score: number } | null {
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const score = this.calculateSimilarity(target, candidate);
      if (score > bestScore && score >= this.threshold) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    return bestMatch ? { match: bestMatch, score: bestScore } : null;
  }

  /**
   * Calculate Jaro-Winkler similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const matchDistance = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, str2.length);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    // Find transpositions
    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    // Calculate Jaro similarity
    const jaro = (
      matches / str1.length +
      matches / str2.length +
      (matches - transpositions / 2) / matches
    ) / 3;

    // Calculate Jaro-Winkler similarity with prefix bonus
    const prefixLength = this.commonPrefixLength(str1, str2, 4);
    const jaroWinkler = jaro + prefixLength * 0.1 * (1 - jaro);

    return jaroWinkler;
  }

  /**
   * Get common prefix length up to max length
   */
  private commonPrefixLength(str1: string, str2: string, maxLength: number): number {
    const limit = Math.min(str1.length, str2.length, maxLength);
    for (let i = 0; i < limit; i++) {
      if (str1[i] !== str2[i]) return i;
    }
    return limit;
  }
}
