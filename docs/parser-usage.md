# OpenAPI Parser - Usage Guide

## Overview

The OpenAPI Parser is a TypeScript library that parses OpenAPI 3.0.x and Swagger 2.0 specifications, extracting endpoint metadata, schemas, authentication requirements, and request/response structures.

## Installation

```bash
npm install api-test-agent
```

## Quick Start

```typescript
import { parseOpenAPIFile } from 'api-test-agent';

// Parse from file
const parsed = await parseOpenAPIFile('./openapi.yaml');

console.log(`API: ${parsed.info.title} v${parsed.info.version}`);
console.log(`Type: ${parsed.type}`);
console.log(`Servers: ${parsed.servers.map(s => s.url).join(', ')}`);
```

## Basic Usage

### Parse from File

```typescript
import { parseOpenAPIFile, OpenAPIParser } from 'api-test-agent';

// Simple parse
const spec = await parseOpenAPIFile('./api-spec.yaml');

// Advanced usage with parser instance
const parser = new OpenAPIParser();
const parsed = await parser.parseFromFile('./api-spec.yaml');
const endpoints = parser.extractEndpoints();
const authSchemes = parser.extractAuthSchemes();
```

### Parse from Object

```typescript
import { parseOpenAPISpec } from 'api-test-agent';

const specObject = {
  openapi: '3.0.3',
  info: { title: 'My API', version: '1.0.0' },
  paths: { /* ... */ }
};

const parsed = await parseOpenAPISpec(specObject);
```

### Parse JSON or YAML

The parser automatically detects file format based on extension:

```typescript
// YAML files (.yaml or .yml)
await parseOpenAPIFile('./spec.yaml');
await parseOpenAPIFile('./spec.yml');

// JSON files (.json)
await parseOpenAPIFile('./spec.json');
```

## Working with Endpoints

### Extract All Endpoints

```typescript
import { OpenAPIParser } from 'api-test-agent';

const parser = new OpenAPIParser();
await parser.parseFromFile('./api-spec.yaml');

const endpoints = parser.extractEndpoints();

endpoints.forEach(endpoint => {
  console.log(`${endpoint.method.toUpperCase()} ${endpoint.path}`);
  console.log(`  Operation ID: ${endpoint.operationId}`);
  console.log(`  Summary: ${endpoint.summary}`);
  console.log(`  Parameters: ${endpoint.parameters.length}`);
  console.log(`  Auth required: ${endpoint.security.length > 0}`);
});
```

### Access Endpoint Details

```typescript
const getUserEndpoint = endpoints.find(
  e => e.path === '/users/{id}' && e.method === 'get'
);

if (getUserEndpoint) {
  // Path and method
  console.log(getUserEndpoint.path);        // "/users/{id}"
  console.log(getUserEndpoint.method);      // "get"

  // Metadata
  console.log(getUserEndpoint.operationId); // "getUserById"
  console.log(getUserEndpoint.summary);     // "Get user by ID"
  console.log(getUserEndpoint.description); // Full description
  console.log(getUserEndpoint.tags);        // ["users"]

  // Parameters
  getUserEndpoint.parameters.forEach(param => {
    console.log(`${param.name} (${param.in}): ${param.required ? 'required' : 'optional'}`);
  });

  // Request body
  if (getUserEndpoint.requestBody) {
    console.log('Request body required:', getUserEndpoint.requestBody.required);
    console.log('Content types:', Object.keys(getUserEndpoint.requestBody.content));
  }

  // Responses
  getUserEndpoint.responses.forEach((response, status) => {
    console.log(`Response ${status}: ${response.description}`);
  });

  // Security
  getUserEndpoint.security.forEach(requirement => {
    console.log('Required auth:', Object.keys(requirement));
  });

  // Servers
  getUserEndpoint.servers.forEach(server => {
    console.log('Server:', server.url);
  });
}
```

## Working with Authentication

### Extract Authentication Schemes

```typescript
const authSchemes = parser.extractAuthSchemes();

authSchemes.forEach(scheme => {
  console.log(`Name: ${scheme.name}`);
  console.log(`Type: ${scheme.type}`);

  if (scheme.type === 'http') {
    console.log(`Scheme: ${scheme.config.scheme}`);
    if (scheme.config.bearerFormat) {
      console.log(`Bearer format: ${scheme.config.bearerFormat}`);
    }
  }

  if (scheme.type === 'apiKey') {
    console.log(`Location: ${scheme.config.in}`);
    console.log(`Parameter name: ${scheme.config.name}`);
  }

  if (scheme.type === 'oauth2') {
    console.log('OAuth2 flows:', Object.keys(scheme.config.flows || {}));
  }
});
```

### Check Endpoint Authentication

```typescript
endpoints.forEach(endpoint => {
  if (endpoint.security.length === 0) {
    console.log(`${endpoint.path}: No authentication required`);
  } else if (endpoint.security.some(req => Object.keys(req).length === 0)) {
    console.log(`${endpoint.path}: Optional authentication`);
  } else {
    console.log(`${endpoint.path}: Authentication required`);
    endpoint.security.forEach(req => {
      console.log(`  Options: ${Object.keys(req).join(' AND ')}`);
    });
  }
});
```

## Working with Schemas

### Access Component Schemas

```typescript
const parsed = await parseOpenAPIFile('./api-spec.yaml');

if (parsed.components?.schemas) {
  Object.entries(parsed.components.schemas).forEach(([name, schema]) => {
    if ('$ref' in schema) {
      console.log(`${name}: Reference to ${schema.$ref}`);
    } else {
      console.log(`${name}: ${schema.type || 'complex'} schema`);
      if (schema.properties) {
        console.log(`  Properties: ${Object.keys(schema.properties).join(', ')}`);
      }
    }
  });
}
```

## Error Handling

The parser provides specific error types for different failures:

```typescript
import {
  parseOpenAPIFile,
  FileNotFoundError,
  ParseError,
  ValidationError,
  UnsupportedVersionError
} from 'api-test-agent';

try {
  const parsed = await parseOpenAPIFile('./api-spec.yaml');
  // Success
} catch (error) {
  if (error instanceof FileNotFoundError) {
    console.error('File not found:', error.filePath);
  } else if (error instanceof ParseError) {
    console.error('Parse error:', error.message);
    console.error('Source:', error.source);
  } else if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Errors:', error.errors);
  } else if (error instanceof UnsupportedVersionError) {
    console.error('Unsupported version:', error.version);
    console.error('Supported versions:', error.supportedVersions);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Supported Specifications

### OpenAPI 3.0.x
- ✅ OpenAPI 3.0.0
- ✅ OpenAPI 3.0.1
- ✅ OpenAPI 3.0.2
- ✅ OpenAPI 3.0.3
- ❌ OpenAPI 3.1.x (not supported by swagger-parser)

### Swagger 2.0
- ✅ Swagger 2.0

## TypeScript Types

The parser provides comprehensive TypeScript types:

```typescript
import type {
  ParsedApiSpec,
  ApiEndpoint,
  AuthScheme,
  OpenAPISpec,
  SwaggerSpec,
  ParameterObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject
} from 'api-test-agent';

// Fully typed API specification
const spec: ParsedApiSpec = await parseOpenAPIFile('./api-spec.yaml');

// Type-safe endpoint access
const endpoint: ApiEndpoint = spec.endpoints[0];

// Type-safe auth scheme access
const authScheme: AuthScheme = spec.authSchemes[0];
```

## Advanced Usage

### Multiple Servers

```typescript
const parsed = await parseOpenAPIFile('./api-spec.yaml');

// Global servers
parsed.servers.forEach(server => {
  console.log(`${server.description}: ${server.url}`);
  if (server.variables) {
    Object.entries(server.variables).forEach(([name, variable]) => {
      console.log(`  Variable ${name}: ${variable.default}`);
      if (variable.enum) {
        console.log(`    Options: ${variable.enum.join(', ')}`);
      }
    });
  }
});

// Endpoint-specific servers
endpoints.forEach(endpoint => {
  if (endpoint.servers.length > 0) {
    console.log(`${endpoint.path} uses custom servers:`);
    endpoint.servers.forEach(server => {
      console.log(`  ${server.url}`);
    });
  }
});
```

### Tags and Organization

```typescript
const parsed = await parseOpenAPIFile('./api-spec.yaml');

// Group endpoints by tag
const endpointsByTag = new Map<string, ApiEndpoint[]>();

endpoints.forEach(endpoint => {
  endpoint.tags.forEach(tag => {
    if (!endpointsByTag.has(tag)) {
      endpointsByTag.set(tag, []);
    }
    endpointsByTag.get(tag)?.push(endpoint);
  });
});

endpointsByTag.forEach((endpoints, tag) => {
  console.log(`\n${tag} (${endpoints.length} endpoints):`);
  endpoints.forEach(endpoint => {
    console.log(`  ${endpoint.method.toUpperCase()} ${endpoint.path}`);
  });
});
```

### Parameter Details

```typescript
endpoints.forEach(endpoint => {
  endpoint.parameters.forEach(param => {
    console.log(`Parameter: ${param.name}`);
    console.log(`  Location: ${param.in}`);
    console.log(`  Required: ${param.required ?? false}`);
    console.log(`  Deprecated: ${param.deprecated ?? false}`);

    if (param.schema) {
      if ('$ref' in param.schema) {
        console.log(`  Schema: ${param.schema.$ref}`);
      } else {
        console.log(`  Type: ${param.schema.type}`);
        if (param.schema.enum) {
          console.log(`  Enum: ${param.schema.enum.join(', ')}`);
        }
        if (param.schema.default !== undefined) {
          console.log(`  Default: ${param.schema.default}`);
        }
      }
    }
  });
});
```

## Performance Considerations

The parser is optimized for performance:

- Specs with 50+ endpoints parse in under 5 seconds
- Multiple concurrent parses are supported
- swagger-parser handles $ref dereferencing automatically

```typescript
// Concurrent parsing
const [spec1, spec2, spec3] = await Promise.all([
  parseOpenAPIFile('./api1.yaml'),
  parseOpenAPIFile('./api2.yaml'),
  parseOpenAPIFile('./api3.yaml')
]);
```

## Best Practices

1. **Error Handling**: Always wrap parser calls in try-catch blocks
2. **Type Safety**: Use TypeScript types for better IDE support
3. **Performance**: Reuse parser instances when parsing multiple times
4. **Validation**: The parser validates specs automatically using swagger-parser
5. **Security**: Review authentication requirements before testing APIs

## Examples

### Complete Workflow Example

```typescript
import { OpenAPIParser, ApiEndpoint } from 'api-test-agent';

async function analyzeAPI(specPath: string): Promise<void> {
  const parser = new OpenAPIParser();

  try {
    // Parse specification
    const parsed = await parser.parseFromFile(specPath);

    console.log(`\nAPI: ${parsed.info.title} v${parsed.info.version}`);
    console.log(`Type: ${parsed.type}`);
    console.log(`Base URL: ${parsed.servers[0]?.url}\n`);

    // Extract endpoints
    const endpoints = parser.extractEndpoints();
    console.log(`Total endpoints: ${endpoints.length}\n`);

    // Extract authentication
    const authSchemes = parser.extractAuthSchemes();
    console.log(`Authentication schemes: ${authSchemes.length}`);
    authSchemes.forEach(scheme => {
      console.log(`  - ${scheme.name} (${scheme.type})`);
    });

    // Analyze endpoints
    console.log('\nEndpoints by method:');
    const methodCounts = new Map<string, number>();
    endpoints.forEach(endpoint => {
      const count = methodCounts.get(endpoint.method) || 0;
      methodCounts.set(endpoint.method, count + 1);
    });
    methodCounts.forEach((count, method) => {
      console.log(`  ${method.toUpperCase()}: ${count}`);
    });

    // Find endpoints requiring authentication
    const secureEndpoints = endpoints.filter(e => e.security.length > 0);
    console.log(`\nSecured endpoints: ${secureEndpoints.length}/${endpoints.length}`);

  } catch (error) {
    console.error('Failed to parse API:', error);
    throw error;
  }
}

// Usage
analyzeAPI('./api-spec.yaml');
```

## Limitations

1. **OpenAPI 3.1**: Not supported (swagger-parser limitation)
2. **Circular References**: Basic handling only
3. **Custom Extensions**: Not parsed (x-* fields ignored)

## Resources

- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3)
- [Swagger 2.0 Specification](https://swagger.io/specification/v2/)
- [swagger-parser Documentation](https://apitools.dev/swagger-parser/docs/)

## Support

For issues and questions, please refer to the project repository.
