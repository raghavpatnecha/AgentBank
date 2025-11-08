/**
 * OpenAPI Spec Diff Analyzer
 * Feature 4: Self-Healing Agent - Task 4.1
 *
 * Intelligently compares OpenAPI specifications to detect changes
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import {
  OpenAPISpec,
  SpecDiff,
  Change,
  ChangeType,
  ChangeSeverity,
  EndpointChanges,
  EndpointChange,
  ParameterChanges,
  ParameterChange,
  SchemaChanges,
  SchemaChange,
  AuthChanges,
  AuthChange,
  MetadataChanges,
  DiffReport,
  DiffSummary,
  ComparisonOptions,
  SpecLoadResult,
  HttpMethod,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPISchema,
  OpenAPISecurityScheme
} from '../types/spec-diff-types.js';

/**
 * Default comparison options
 */
const DEFAULT_OPTIONS: ComparisonOptions = {
  ignoreDescriptionChanges: false,
  ignoreExampleChanges: false,
  ignoreDeprecated: false,
  strictTypeChecking: true,
  trackFieldRenames: true,
  renameSimilarityThreshold: 0.8
};

/**
 * Main class for analyzing differences between OpenAPI specs
 */
export class SpecDiffAnalyzer {
  private options: ComparisonOptions;

  constructor(options: Partial<ComparisonOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Load and parse an OpenAPI spec from file
   */
  async loadAndParseSpec(filepath: string): Promise<SpecLoadResult> {
    const startTime = Date.now();

    try {
      const absolutePath = path.resolve(filepath);
      const content = await fs.readFile(absolutePath, 'utf-8');
      const stats = await fs.stat(absolutePath);
      const ext = path.extname(absolutePath).toLowerCase();

      let spec: OpenAPISpec;
      let format: 'json' | 'yaml';

      if (ext === '.json') {
        spec = JSON.parse(content);
        format = 'json';
      } else if (ext === '.yaml' || ext === '.yml') {
        spec = yaml.parse(content);
        format = 'yaml';
      } else {
        throw new Error(`Unsupported file format: ${ext}. Use .json, .yaml, or .yml`);
      }

      // Validate basic structure
      if (!spec.openapi || !spec.info || !spec.paths) {
        throw new Error('Invalid OpenAPI spec: missing required fields (openapi, info, paths)');
      }

      const parseTime = Date.now() - startTime;

      return {
        spec,
        filepath: absolutePath,
        format,
        size: stats.size,
        parseTime
      };
    } catch (error) {
      throw new Error(`Failed to load spec from ${filepath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Compare two OpenAPI specs and generate diff
   */
  compareSpecs(oldSpec: OpenAPISpec, newSpec: OpenAPISpec): SpecDiff {
    const allChanges: Change[] = [];

    // Detect all types of changes
    const endpoints = this.detectEndpointChanges(oldSpec, newSpec, allChanges);
    const parameters = this.detectParameterChanges(oldSpec, newSpec, allChanges);
    const schemas = this.detectSchemaChanges(oldSpec, newSpec, allChanges);
    const auth = this.detectAuthChanges(oldSpec, newSpec, allChanges);
    const metadata = this.detectMetadataChanges(oldSpec, newSpec, allChanges);

    // Generate summary
    const summary = this.generateSummary(allChanges, endpoints, schemas);

    return {
      oldVersion: oldSpec.info.version,
      newVersion: newSpec.info.version,
      openAPIVersion: newSpec.openapi as any,
      timestamp: new Date(),
      summary,
      endpoints,
      parameters,
      schemas,
      auth,
      metadata,
      allChanges
    };
  }

  /**
   * Detect endpoint changes (added, removed, modified)
   */
  detectEndpointChanges(oldSpec: OpenAPISpec, newSpec: OpenAPISpec, allChanges: Change[]): EndpointChanges {
    const added: EndpointChange[] = [];
    const removed: EndpointChange[] = [];
    const modified: EndpointChange[] = [];

    const oldPaths = Object.keys(oldSpec.paths);
    const newPaths = Object.keys(newSpec.paths);

    // Find added paths
    for (const pathKey of newPaths) {
      if (!oldPaths.includes(pathKey)) {
        const pathItem = newSpec.paths[pathKey];
        if (!pathItem) continue;
        for (const method of this.getHttpMethods(pathItem)) {
          const operation = pathItem[method];
          if (operation) {
            const change: EndpointChange = {
              method,
              path: pathKey,
              changeType: 'added',
              changes: [],
              newOperation: operation
            };
            added.push(change);

            const changeRecord: Change = {
              type: ChangeType.FIELD_ADDED,
              path: `paths.${pathKey}.${method}`,
              newValue: operation,
              severity: ChangeSeverity.MINOR,
              description: `Added endpoint: ${method.toUpperCase()} ${pathKey}`
            };
            allChanges.push(changeRecord);
            change.changes.push(changeRecord);
          }
        }
      }
    }

    // Find removed paths
    for (const pathKey of oldPaths) {
      if (!newPaths.includes(pathKey)) {
        const pathItem = oldSpec.paths[pathKey];
        if (!pathItem) continue;
        for (const method of this.getHttpMethods(pathItem)) {
          const operation = pathItem[method];
          if (operation) {
            const change: EndpointChange = {
              method,
              path: pathKey,
              changeType: 'removed',
              changes: [],
              oldOperation: operation
            };
            removed.push(change);

            const changeRecord: Change = {
              type: ChangeType.FIELD_REMOVED,
              path: `paths.${pathKey}.${method}`,
              oldValue: operation,
              severity: ChangeSeverity.BREAKING,
              description: `Removed endpoint: ${method.toUpperCase()} ${pathKey}`
            };
            allChanges.push(changeRecord);
            change.changes.push(changeRecord);
          }
        }
      }
    }

    // Find modified paths
    for (const pathKey of oldPaths) {
      if (newPaths.includes(pathKey)) {
        const oldPathItem = oldSpec.paths[pathKey];
        const newPathItem = newSpec.paths[pathKey];
        if (!oldPathItem || !newPathItem) continue;

        for (const method of this.getHttpMethods(oldPathItem)) {
          const oldOperation = oldPathItem[method];
          const newOperation = newPathItem[method];

          if (oldOperation && !newOperation) {
            // Method removed from path
            const change: EndpointChange = {
              method,
              path: pathKey,
              changeType: 'removed',
              changes: [],
              oldOperation
            };
            removed.push(change);

            const changeRecord: Change = {
              type: ChangeType.FIELD_REMOVED,
              path: `paths.${pathKey}.${method}`,
              oldValue: oldOperation,
              severity: ChangeSeverity.BREAKING,
              description: `Removed method ${method.toUpperCase()} from ${pathKey}`
            };
            allChanges.push(changeRecord);
            change.changes.push(changeRecord);
          } else if (oldOperation && newOperation) {
            // Check for modifications
            const changes = this.compareOperations(oldOperation, newOperation, `paths.${pathKey}.${method}`);
            if (changes.length > 0) {
              const change: EndpointChange = {
                method,
                path: pathKey,
                changeType: 'modified',
                changes,
                oldOperation,
                newOperation
              };
              modified.push(change);
              allChanges.push(...changes);
            }
          }
        }

        // Check for added methods
        for (const method of this.getHttpMethods(newPathItem)) {
          const oldOperation = oldPathItem?.[method];
          const newOperation = newPathItem?.[method];

          if (!oldOperation && newOperation) {
            const change: EndpointChange = {
              method,
              path: pathKey,
              changeType: 'added',
              changes: [],
              newOperation
            };
            added.push(change);

            const changeRecord: Change = {
              type: ChangeType.FIELD_ADDED,
              path: `paths.${pathKey}.${method}`,
              newValue: newOperation,
              severity: ChangeSeverity.MINOR,
              description: `Added method ${method.toUpperCase()} to ${pathKey}`
            };
            allChanges.push(changeRecord);
            change.changes.push(changeRecord);
          }
        }
      }
    }

    return {
      added,
      removed,
      modified,
      total: added.length + removed.length + modified.length
    };
  }

  /**
   * Detect parameter changes across all endpoints
   */
  detectParameterChanges(oldSpec: OpenAPISpec, newSpec: OpenAPISpec, allChanges: Change[]): ParameterChanges {
    const added: ParameterChange[] = [];
    const removed: ParameterChange[] = [];
    const modified: ParameterChange[] = [];
    const requiredChanged: ParameterChange[] = [];
    const typeChanged: ParameterChange[] = [];

    for (const pathKey of Object.keys(oldSpec.paths)) {
      if (!newSpec.paths[pathKey]) continue;

      const oldPathItem = oldSpec.paths[pathKey];
      const newPathItem = newSpec.paths[pathKey];
      if (!oldPathItem || !newPathItem) continue;

      for (const method of this.getHttpMethods(oldPathItem)) {
        const oldOperation = oldPathItem[method];
        const newOperation = newPathItem[method];

        if (!oldOperation || !newOperation) continue;

        const oldParams = oldOperation.parameters || [];
        const newParams = newOperation.parameters || [];

        // Find added parameters
        for (const newParam of newParams) {
          const oldParam = oldParams.find(p => p.name === newParam.name && p.in === newParam.in);
          if (!oldParam) {
            const change: ParameterChange = {
              endpoint: pathKey,
              method,
              parameterName: newParam.name,
              location: newParam.in,
              changeType: ChangeType.FIELD_ADDED,
              newParameter: newParam,
              changes: []
            };

            const changeRecord: Change = {
              type: ChangeType.FIELD_ADDED,
              path: `paths.${pathKey}.${method}.parameters[${newParam.name}]`,
              newValue: newParam,
              severity: newParam.required ? ChangeSeverity.BREAKING : ChangeSeverity.MINOR,
              description: `Added ${newParam.required ? 'required' : 'optional'} parameter '${newParam.name}' in ${newParam.in}`
            };

            change.changes.push(changeRecord);
            added.push(change);
            allChanges.push(changeRecord);
          }
        }

        // Find removed or modified parameters
        for (const oldParam of oldParams) {
          const newParam = newParams.find(p => p.name === oldParam.name && p.in === oldParam.in);

          if (!newParam) {
            // Parameter removed
            const change: ParameterChange = {
              endpoint: pathKey,
              method,
              parameterName: oldParam.name,
              location: oldParam.in,
              changeType: ChangeType.FIELD_REMOVED,
              oldParameter: oldParam,
              changes: []
            };

            const changeRecord: Change = {
              type: ChangeType.FIELD_REMOVED,
              path: `paths.${pathKey}.${method}.parameters[${oldParam.name}]`,
              oldValue: oldParam,
              severity: ChangeSeverity.BREAKING,
              description: `Removed parameter '${oldParam.name}' from ${oldParam.in}`
            };

            change.changes.push(changeRecord);
            removed.push(change);
            allChanges.push(changeRecord);
          } else {
            // Check for modifications
            const paramChanges = this.compareParameters(oldParam, newParam, `paths.${pathKey}.${method}.parameters[${oldParam.name}]`);

            if (paramChanges.length > 0) {
              const change: ParameterChange = {
                endpoint: pathKey,
                method,
                parameterName: oldParam.name,
                location: oldParam.in,
                changeType: ChangeType.TYPE_CHANGED,
                oldParameter: oldParam,
                newParameter: newParam,
                changes: paramChanges
              };

              modified.push(change);
              allChanges.push(...paramChanges);

              // Track specific change types
              if (paramChanges.some(c => c.path.includes('.required'))) {
                requiredChanged.push(change);
              }
              if (paramChanges.some(c => c.path.includes('.schema.type'))) {
                typeChanged.push(change);
              }
            }
          }
        }
      }
    }

    return {
      added,
      removed,
      modified,
      requiredChanged,
      typeChanged,
      total: added.length + removed.length + modified.length
    };
  }

  /**
   * Detect schema changes in components
   */
  detectSchemaChanges(oldSpec: OpenAPISpec, newSpec: OpenAPISpec, allChanges: Change[]): SchemaChanges {
    const added: SchemaChange[] = [];
    const removed: SchemaChange[] = [];
    const modified: SchemaChange[] = [];
    const propertyChanges: SchemaChange[] = [];
    const typeChanges: SchemaChange[] = [];

    const oldSchemas = oldSpec.components?.schemas || {};
    const newSchemas = newSpec.components?.schemas || {};

    const oldSchemaNames = Object.keys(oldSchemas);
    const newSchemaNames = Object.keys(newSchemas);

    // Find added schemas
    for (const schemaName of newSchemaNames) {
      if (!oldSchemaNames.includes(schemaName)) {
        const affectedEndpoints = this.findEndpointsUsingSchema(newSpec, schemaName);

        const change: SchemaChange = {
          schemaName,
          path: `components.schemas.${schemaName}`,
          changeType: ChangeType.FIELD_ADDED,
          newSchema: newSchemas[schemaName],
          changes: [],
          affectedEndpoints
        };

        const changeRecord: Change = {
          type: ChangeType.FIELD_ADDED,
          path: `components.schemas.${schemaName}`,
          newValue: newSchemas[schemaName],
          severity: ChangeSeverity.MINOR,
          description: `Added schema '${schemaName}'`,
          affectedEndpoints
        };

        change.changes.push(changeRecord);
        added.push(change);
        allChanges.push(changeRecord);
      }
    }

    // Find removed schemas
    for (const schemaName of oldSchemaNames) {
      if (!newSchemaNames.includes(schemaName)) {
        const affectedEndpoints = this.findEndpointsUsingSchema(oldSpec, schemaName);

        const change: SchemaChange = {
          schemaName,
          path: `components.schemas.${schemaName}`,
          changeType: ChangeType.FIELD_REMOVED,
          oldSchema: oldSchemas[schemaName],
          changes: [],
          affectedEndpoints
        };

        const changeRecord: Change = {
          type: ChangeType.FIELD_REMOVED,
          path: `components.schemas.${schemaName}`,
          oldValue: oldSchemas[schemaName],
          severity: ChangeSeverity.BREAKING,
          description: `Removed schema '${schemaName}'`,
          affectedEndpoints
        };

        change.changes.push(changeRecord);
        removed.push(change);
        allChanges.push(changeRecord);
      }
    }

    // Find modified schemas
    for (const schemaName of oldSchemaNames) {
      if (newSchemaNames.includes(schemaName)) {
        const oldSchema = oldSchemas[schemaName];
        const newSchema = newSchemas[schemaName];
        if (!oldSchema || !newSchema) continue;
        const affectedEndpoints = this.findEndpointsUsingSchema(newSpec, schemaName);

        const schemaChanges = this.compareSchemas(oldSchema, newSchema, `components.schemas.${schemaName}`);

        if (schemaChanges.length > 0) {
          const change: SchemaChange = {
            schemaName,
            path: `components.schemas.${schemaName}`,
            changeType: ChangeType.TYPE_CHANGED,
            oldSchema,
            newSchema,
            changes: schemaChanges,
            affectedEndpoints
          };

          modified.push(change);
          allChanges.push(...schemaChanges);

          // Track specific change types
          if (schemaChanges.some(c => c.path.includes('.properties'))) {
            propertyChanges.push(change);
          }
          if (schemaChanges.some(c => c.path.includes('.type') && !c.path.includes('.properties'))) {
            typeChanges.push(change);
          }
        }
      }
    }

    return {
      added,
      removed,
      modified,
      propertyChanges,
      typeChanges,
      total: added.length + removed.length + modified.length
    };
  }

  /**
   * Detect authentication/security changes
   */
  detectAuthChanges(oldSpec: OpenAPISpec, newSpec: OpenAPISpec, allChanges: Change[]): AuthChanges {
    const added: AuthChange[] = [];
    const removed: AuthChange[] = [];
    const modified: AuthChange[] = [];

    const oldSchemes = oldSpec.components?.securitySchemes || {};
    const newSchemes = newSpec.components?.securitySchemes || {};

    const oldSchemeNames = Object.keys(oldSchemes);
    const newSchemeNames = Object.keys(newSchemes);

    // Find added schemes
    for (const schemeName of newSchemeNames) {
      if (!oldSchemeNames.includes(schemeName)) {
        const newScheme = newSchemes[schemeName];
        if (!newScheme) continue;
        const affectedEndpoints = this.findEndpointsUsingAuth(newSpec, schemeName);

        const change: AuthChange = {
          schemeName,
          changeType: 'added',
          schemeType: newScheme.type,
          newScheme: newScheme,
          changes: [],
          affectedEndpoints
        };

        const changeRecord: Change = {
          type: ChangeType.FIELD_ADDED,
          path: `components.securitySchemes.${schemeName}`,
          newValue: newScheme,
          severity: ChangeSeverity.MINOR,
          description: `Added security scheme '${schemeName}' (${newScheme.type})`,
          affectedEndpoints
        };

        change.changes.push(changeRecord);
        added.push(change);
        allChanges.push(changeRecord);
      }
    }

    // Find removed schemes
    for (const schemeName of oldSchemeNames) {
      if (!newSchemeNames.includes(schemeName)) {
        const oldScheme = oldSchemes[schemeName];
        if (!oldScheme) continue;
        const affectedEndpoints = this.findEndpointsUsingAuth(oldSpec, schemeName);

        const change: AuthChange = {
          schemeName,
          changeType: 'removed',
          schemeType: oldScheme.type,
          oldScheme: oldScheme,
          changes: [],
          affectedEndpoints
        };

        const changeRecord: Change = {
          type: ChangeType.FIELD_REMOVED,
          path: `components.securitySchemes.${schemeName}`,
          oldValue: oldScheme,
          severity: ChangeSeverity.BREAKING,
          description: `Removed security scheme '${schemeName}'`,
          affectedEndpoints
        };

        change.changes.push(changeRecord);
        removed.push(change);
        allChanges.push(changeRecord);
      }
    }

    // Find modified schemes
    for (const schemeName of oldSchemeNames) {
      if (newSchemeNames.includes(schemeName)) {
        const oldScheme = oldSchemes[schemeName];
        const newScheme = newSchemes[schemeName];
        if (!oldScheme || !newScheme) continue;
        const affectedEndpoints = this.findEndpointsUsingAuth(newSpec, schemeName);

        const schemeChanges = this.compareSecuritySchemes(oldScheme, newScheme, `components.securitySchemes.${schemeName}`);

        if (schemeChanges.length > 0) {
          const change: AuthChange = {
            schemeName,
            changeType: 'modified',
            schemeType: newScheme.type,
            oldScheme,
            newScheme,
            changes: schemeChanges,
            affectedEndpoints
          };

          modified.push(change);
          allChanges.push(...schemeChanges);
        }
      }
    }

    return {
      added,
      removed,
      modified,
      total: added.length + removed.length + modified.length
    };
  }

  /**
   * Detect metadata changes (info, servers, etc.)
   */
  private detectMetadataChanges(oldSpec: OpenAPISpec, newSpec: OpenAPISpec, allChanges: Change[]): MetadataChanges {
    const metadata: MetadataChanges = {};

    // Title
    if (oldSpec.info.title !== newSpec.info.title) {
      const change: Change = {
        type: ChangeType.VALUE_CHANGED,
        path: 'info.title',
        oldValue: oldSpec.info.title,
        newValue: newSpec.info.title,
        severity: ChangeSeverity.PATCH,
        description: `API title changed from '${oldSpec.info.title}' to '${newSpec.info.title}'`
      };
      metadata.title = change;
      allChanges.push(change);
    }

    // Description
    if (oldSpec.info.description !== newSpec.info.description && !this.options.ignoreDescriptionChanges) {
      const change: Change = {
        type: ChangeType.VALUE_CHANGED,
        path: 'info.description',
        oldValue: oldSpec.info.description,
        newValue: newSpec.info.description,
        severity: ChangeSeverity.PATCH,
        description: 'API description changed'
      };
      metadata.description = change;
      allChanges.push(change);
    }

    // Version
    if (oldSpec.info.version !== newSpec.info.version) {
      const change: Change = {
        type: ChangeType.VALUE_CHANGED,
        path: 'info.version',
        oldValue: oldSpec.info.version,
        newValue: newSpec.info.version,
        severity: ChangeSeverity.PATCH,
        description: `API version changed from '${oldSpec.info.version}' to '${newSpec.info.version}'`
      };
      metadata.version = change;
      allChanges.push(change);
    }

    return metadata;
  }

  /**
   * Generate human-readable diff report
   */
  generateDiffReport(diff: SpecDiff): DiffReport {
    const breakingChanges: string[] = [];
    const majorChanges: string[] = [];
    const minorChanges: string[] = [];
    const recommendations: string[] = [];
    const migrationNotes: string[] = [];

    // Categorize changes
    for (const change of diff.allChanges) {
      const msg = `${change.path}: ${change.description}`;

      switch (change.severity) {
        case ChangeSeverity.BREAKING:
          breakingChanges.push(msg);
          break;
        case ChangeSeverity.MAJOR:
          majorChanges.push(msg);
          break;
        case ChangeSeverity.MINOR:
          minorChanges.push(msg);
          break;
      }
    }

    // Generate summary
    const summary = `API diff: ${diff.oldVersion} → ${diff.newVersion}
Total changes: ${diff.summary.totalChanges}
Breaking: ${diff.summary.breakingChanges}, Major: ${diff.summary.majorChanges}, Minor: ${diff.summary.minorChanges}
Backward compatible: ${diff.summary.isBackwardCompatible ? 'Yes' : 'No'}`;

    // Generate recommendations
    if (diff.summary.breakingChanges > 0) {
      recommendations.push('⚠️  Breaking changes detected - consider major version bump');
      recommendations.push('Update client SDKs and documentation');
      recommendations.push('Plan migration strategy for existing users');
    }

    if (diff.endpoints.removed.length > 0) {
      recommendations.push(`${diff.endpoints.removed.length} endpoint(s) removed - ensure clients are updated`);
    }

    if (diff.schemas.modified.length > 0) {
      recommendations.push(`${diff.schemas.modified.length} schema(s) modified - validate data contracts`);
    }

    // Generate migration notes
    if (diff.parameters.requiredChanged.length > 0) {
      migrationNotes.push('Required parameters changed - update request validation');
    }

    if (diff.auth.modified.length > 0) {
      migrationNotes.push('Authentication schemes modified - update security configurations');
    }

    return {
      summary,
      breakingChanges,
      majorChanges,
      minorChanges,
      recommendations,
      migrationNotes
    };
  }

  /**
   * Helper: Get HTTP methods from path item
   */
  private getHttpMethods(pathItem: any): HttpMethod[] {
    const methods: HttpMethod[] = [];
    const httpMethods: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];

    for (const method of httpMethods) {
      if (pathItem[method]) {
        methods.push(method);
      }
    }

    return methods;
  }

  /**
   * Helper: Compare two operations
   */
  private compareOperations(oldOp: OpenAPIOperation, newOp: OpenAPIOperation, basePath: string): Change[] {
    const changes: Change[] = [];

    // Compare deprecated status
    if (oldOp.deprecated !== newOp.deprecated) {
      changes.push({
        type: ChangeType.DEPRECATED_CHANGED,
        path: `${basePath}.deprecated`,
        oldValue: oldOp.deprecated,
        newValue: newOp.deprecated,
        severity: newOp.deprecated ? ChangeSeverity.MAJOR : ChangeSeverity.MINOR,
        description: newOp.deprecated ? 'Endpoint marked as deprecated' : 'Endpoint no longer deprecated'
      });
    }

    // Compare summary/description if not ignored
    if (!this.options.ignoreDescriptionChanges) {
      if (oldOp.summary !== newOp.summary) {
        changes.push({
          type: ChangeType.VALUE_CHANGED,
          path: `${basePath}.summary`,
          oldValue: oldOp.summary,
          newValue: newOp.summary,
          severity: ChangeSeverity.PATCH,
          description: 'Summary changed'
        });
      }
    }

    return changes;
  }

  /**
   * Helper: Compare two parameters
   */
  private compareParameters(oldParam: OpenAPIParameter, newParam: OpenAPIParameter, basePath: string): Change[] {
    const changes: Change[] = [];

    // Required status changed
    if (oldParam.required !== newParam.required) {
      changes.push({
        type: ChangeType.REQUIRED_CHANGED,
        path: `${basePath}.required`,
        oldValue: oldParam.required,
        newValue: newParam.required,
        severity: newParam.required ? ChangeSeverity.BREAKING : ChangeSeverity.MINOR,
        description: `Parameter '${newParam.name}' is now ${newParam.required ? 'required' : 'optional'}`
      });
    }

    // Schema changed
    if (oldParam.schema && newParam.schema) {
      const schemaChanges = this.compareSchemas(oldParam.schema, newParam.schema, `${basePath}.schema`);
      changes.push(...schemaChanges);
    } else if (oldParam.schema && !newParam.schema) {
      changes.push({
        type: ChangeType.FIELD_REMOVED,
        path: `${basePath}.schema`,
        oldValue: oldParam.schema,
        severity: ChangeSeverity.BREAKING,
        description: 'Parameter schema removed'
      });
    } else if (!oldParam.schema && newParam.schema) {
      changes.push({
        type: ChangeType.FIELD_ADDED,
        path: `${basePath}.schema`,
        newValue: newParam.schema,
        severity: ChangeSeverity.MINOR,
        description: 'Parameter schema added'
      });
    }

    return changes;
  }

  /**
   * Helper: Deep comparison of schemas
   */
  private compareSchemas(oldSchema: OpenAPISchema, newSchema: OpenAPISchema, basePath: string): Change[] {
    const changes: Change[] = [];

    // Type changed
    if (oldSchema.type !== newSchema.type) {
      changes.push({
        type: ChangeType.TYPE_CHANGED,
        path: `${basePath}.type`,
        oldValue: oldSchema.type,
        newValue: newSchema.type,
        severity: ChangeSeverity.BREAKING,
        description: `Type changed from '${oldSchema.type}' to '${newSchema.type}'`
      });
    }

    // Required fields
    const oldRequired = oldSchema.required || [];
    const newRequired = newSchema.required || [];

    for (const field of newRequired) {
      if (!oldRequired.includes(field)) {
        changes.push({
          type: ChangeType.REQUIRED_CHANGED,
          path: `${basePath}.required`,
          oldValue: oldRequired,
          newValue: newRequired,
          severity: ChangeSeverity.BREAKING,
          description: `Field '${field}' is now required`
        });
      }
    }

    // Properties
    if (oldSchema.properties && newSchema.properties) {
      const oldProps = Object.keys(oldSchema.properties);
      const newProps = Object.keys(newSchema.properties);

      // Added properties
      for (const prop of newProps) {
        if (!oldProps.includes(prop)) {
          changes.push({
            type: ChangeType.FIELD_ADDED,
            path: `${basePath}.properties.${prop}`,
            newValue: newSchema.properties[prop],
            severity: ChangeSeverity.MINOR,
            description: `Added property '${prop}'`
          });
        }
      }

      // Removed properties
      for (const prop of oldProps) {
        if (!newProps.includes(prop)) {
          changes.push({
            type: ChangeType.FIELD_REMOVED,
            path: `${basePath}.properties.${prop}`,
            oldValue: oldSchema.properties[prop],
            severity: ChangeSeverity.BREAKING,
            description: `Removed property '${prop}'`
          });
        }
      }

      // Modified properties
      for (const prop of oldProps) {
        if (newProps.includes(prop)) {
          const oldPropSchema = oldSchema.properties[prop];
          const newPropSchema = newSchema.properties[prop];
          if (oldPropSchema && newPropSchema) {
            const propChanges = this.compareSchemas(
              oldPropSchema,
              newPropSchema,
              `${basePath}.properties.${prop}`
            );
            changes.push(...propChanges);
          }
        }
      }
    }

    // Enum values
    if (oldSchema.enum && newSchema.enum) {
      const oldEnums = oldSchema.enum;
      const newEnums = newSchema.enum;

      if (JSON.stringify(oldEnums) !== JSON.stringify(newEnums)) {
        changes.push({
          type: ChangeType.ENUM_CHANGED,
          path: `${basePath}.enum`,
          oldValue: oldEnums,
          newValue: newEnums,
          severity: ChangeSeverity.BREAKING,
          description: 'Enum values changed'
        });
      }
    }

    return changes;
  }

  /**
   * Helper: Compare security schemes
   */
  private compareSecuritySchemes(oldScheme: OpenAPISecurityScheme, newScheme: OpenAPISecurityScheme, basePath: string): Change[] {
    const changes: Change[] = [];

    if (oldScheme.type !== newScheme.type) {
      changes.push({
        type: ChangeType.TYPE_CHANGED,
        path: `${basePath}.type`,
        oldValue: oldScheme.type,
        newValue: newScheme.type,
        severity: ChangeSeverity.BREAKING,
        description: `Auth type changed from '${oldScheme.type}' to '${newScheme.type}'`
      });
    }

    return changes;
  }

  /**
   * Helper: Find endpoints using a specific schema
   */
  private findEndpointsUsingSchema(spec: OpenAPISpec, schemaName: string): string[] {
    const endpoints: string[] = [];
    const schemaRef = `#/components/schemas/${schemaName}`;

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const method of this.getHttpMethods(pathItem)) {
        const operation = pathItem[method];
        if (operation && this.operationUsesSchema(operation, schemaRef)) {
          endpoints.push(`${method.toUpperCase()} ${path}`);
        }
      }
    }

    return endpoints;
  }

  /**
   * Helper: Check if operation uses schema
   */
  private operationUsesSchema(operation: OpenAPIOperation, schemaRef: string): boolean {
    const str = JSON.stringify(operation);
    return str.includes(schemaRef);
  }

  /**
   * Helper: Find endpoints using auth scheme
   */
  private findEndpointsUsingAuth(spec: OpenAPISpec, schemeName: string): string[] {
    const endpoints: string[] = [];

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const method of this.getHttpMethods(pathItem)) {
        const operation = pathItem[method];
        if (operation?.security) {
          for (const secReq of operation.security) {
            if (secReq[schemeName]) {
              endpoints.push(`${method.toUpperCase()} ${path}`);
            }
          }
        }
      }
    }

    return endpoints;
  }

  /**
   * Helper: Generate summary statistics
   */
  private generateSummary(allChanges: Change[], endpoints: EndpointChanges, schemas: SchemaChanges): DiffSummary {
    const breakingChanges = allChanges.filter(c => c.severity === ChangeSeverity.BREAKING).length;
    const majorChanges = allChanges.filter(c => c.severity === ChangeSeverity.MAJOR).length;
    const minorChanges = allChanges.filter(c => c.severity === ChangeSeverity.MINOR).length;
    const patchChanges = allChanges.filter(c => c.severity === ChangeSeverity.PATCH).length;

    return {
      totalChanges: allChanges.length,
      breakingChanges,
      majorChanges,
      minorChanges,
      patchChanges,
      endpointsAdded: endpoints.added.length,
      endpointsRemoved: endpoints.removed.length,
      endpointsModified: endpoints.modified.length,
      schemasAdded: schemas.added.length,
      schemasRemoved: schemas.removed.length,
      schemasModified: schemas.modified.length,
      isBackwardCompatible: breakingChanges === 0
    };
  }
}

/**
 * Convenience function to compare two spec files
 */
export async function compareSpecFiles(
  oldSpecPath: string,
  newSpecPath: string,
  options?: Partial<ComparisonOptions>
): Promise<SpecDiff> {
  const analyzer = new SpecDiffAnalyzer(options);

  const oldResult = await analyzer.loadAndParseSpec(oldSpecPath);
  const newResult = await analyzer.loadAndParseSpec(newSpecPath);

  return analyzer.compareSpecs(oldResult.spec, newResult.spec);
}
