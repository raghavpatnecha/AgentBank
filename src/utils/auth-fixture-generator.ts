/**
 * Authentication Fixture Generator
 * Generates Playwright fixtures for authentication testing
 */

import type { AuthScheme } from '../types/openapi-types.js';
import {
  authSchemeToConfig,
  getEnvVarName,
  getAuthFixtureName,
} from './auth-helper.js';

/**
 * Options for fixture generation
 */
export interface FixtureGenerationOptions {
  /** Include type definitions */
  includeTypes?: boolean;
  /** Use ESM imports */
  useESM?: boolean;
  /** Add detailed comments */
  addComments?: boolean;
}

/**
 * Generate Playwright auth fixtures
 */
export function generateAuthFixture(
  schemes: AuthScheme[],
  options: FixtureGenerationOptions = {}
): string {
  const {
    includeTypes = true,
    useESM = true,
    addComments = true,
  } = options;

  const lines: string[] = [];

  // Add header comment
  if (addComments) {
    lines.push(
      '/**',
      ' * Authentication Fixtures',
      ' * Auto-generated from OpenAPI specification',
      ' * Provides authentication credentials for API testing',
      ' */'
    );
    lines.push('');
  }

  // Add imports
  const importStyle = useESM ? 'import' : 'require';
  if (useESM) {
    lines.push("import { test as base } from '@playwright/test';");
  } else {
    lines.push("const { test: base } = require('@playwright/test');");
  }
  lines.push('');

  // Generate fixture type interface
  if (includeTypes) {
    if (addComments) {
      lines.push('/**');
      lines.push(' * Auth fixture types');
      lines.push(' */');
    }
    lines.push('type AuthFixtures = {');

    for (const scheme of schemes) {
      const fixtureName = getAuthFixtureName(scheme);
      const config = authSchemeToConfig(scheme);

      if (addComments) {
        lines.push(`  /** ${scheme.name} (${config.type}) */`);
      }

      lines.push(`  ${fixtureName}: string;`);
    }

    lines.push('};');
    lines.push('');
  }

  // Generate fixture extensions
  if (addComments) {
    lines.push('/**');
    lines.push(' * Extended test with auth fixtures');
    lines.push(' */');
  }

  const typeAnnotation = includeTypes ? '<AuthFixtures>' : '';
  lines.push(`export const test = base.extend${typeAnnotation}({`);

  // Generate each fixture
  for (let i = 0; i < schemes.length; i++) {
    const scheme = schemes[i];
    if (!scheme) continue; // Skip undefined schemes
    const fixtureName = getAuthFixtureName(scheme);
    const fixtureCode = generateFixtureImplementation(scheme, addComments);

    lines.push(fixtureCode);

    // Add comma separator except for last item
    if (i < schemes.length - 1) {
      lines.push('');
    }
  }

  lines.push('});');
  lines.push('');

  // Re-export expect
  if (useESM) {
    lines.push("export { expect } from '@playwright/test';");
  } else {
    lines.push("exports.expect = require('@playwright/test').expect;");
  }

  return lines.join('\n');
}

/**
 * Generate fixture implementation for a single auth scheme
 */
function generateFixtureImplementation(
  scheme: AuthScheme,
  addComments: boolean
): string {
  const fixtureName = getAuthFixtureName(scheme);
  const config = authSchemeToConfig(scheme);
  const envVarName = getEnvVarName(scheme);

  const lines: string[] = [];

  if (addComments) {
    lines.push(`  // ${scheme.name} - ${config.type}`);
  }

  lines.push(`  ${fixtureName}: async ({}, use) => {`);

  switch (config.type) {
    case 'apiKey':
      lines.push(
        `    const apiKey = process.env.${envVarName} || 'test-api-key-${scheme.name}';`,
        `    await use(apiKey);`
      );
      break;

    case 'bearer':
      if (addComments) {
        lines.push('    // Get bearer token from env or use test default');
      }
      lines.push(
        `    const token = process.env.${envVarName} || 'test-bearer-token';`,
        `    await use(token);`
      );
      break;

    case 'basic':
      if (addComments) {
        lines.push('    // Generate base64-encoded credentials');
      }
      lines.push(
        `    const username = process.env.${envVarName}_USERNAME || 'test-user';`,
        `    const password = process.env.${envVarName}_PASSWORD || 'test-pass';`,
        `    const credentials = Buffer.from(\`\${username}:\${password}\`).toString('base64');`,
        `    await use(credentials);`
      );
      break;

    case 'oauth2':
      if (addComments) {
        lines.push('    // Get OAuth2 token (could implement token fetch here)');
      }
      lines.push(
        `    const token = process.env.${envVarName} || 'test-oauth2-token';`,
        `    // TODO: Implement OAuth2 flow if needed`,
        `    await use(token);`
      );
      break;

    case 'openIdConnect':
      if (addComments) {
        lines.push('    // Get OpenID Connect token');
      }
      lines.push(
        `    const token = process.env.${envVarName} || 'test-oidc-token';`,
        `    // TODO: Implement OIDC flow if needed`,
        `    await use(token);`
      );
      break;
  }

  lines.push('  },');

  return lines.join('\n');
}

/**
 * Generate auth fixture file content
 */
export function generateFixtureFile(
  schemes: AuthScheme[],
  options: FixtureGenerationOptions = {}
): string {
  return generateAuthFixture(schemes, options);
}

/**
 * Generate environment variable documentation
 */
export function generateEnvDocumentation(schemes: AuthScheme[]): string {
  const lines: string[] = [];

  lines.push('# Authentication Environment Variables');
  lines.push('');
  lines.push('Configure these environment variables for authentication testing:');
  lines.push('');

  for (const scheme of schemes) {
    const config = authSchemeToConfig(scheme);
    const envVarName = getEnvVarName(scheme);

    lines.push(`## ${scheme.name} (${config.type})`);
    lines.push('');

    switch (config.type) {
      case 'apiKey':
        lines.push(`\`${envVarName}\` - API key value`);
        if (config.location) {
          lines.push(`  - Location: ${config.location}`);
        }
        if (config.name) {
          lines.push(`  - Parameter name: ${config.name}`);
        }
        break;

      case 'bearer':
        lines.push(`\`${envVarName}\` - Bearer token`);
        if (config.bearerFormat) {
          lines.push(`  - Format: ${config.bearerFormat}`);
        }
        break;

      case 'basic':
        lines.push(`\`${envVarName}_USERNAME\` - Username for basic auth`);
        lines.push(`\`${envVarName}_PASSWORD\` - Password for basic auth`);
        break;

      case 'oauth2':
        lines.push(`\`${envVarName}\` - OAuth2 access token`);
        lines.push('  - Alternative: Configure OAuth2 client credentials');
        break;

      case 'openIdConnect':
        lines.push(`\`${envVarName}\` - OpenID Connect token`);
        break;
    }

    lines.push('');
  }

  lines.push('## Example .env file');
  lines.push('');
  lines.push('```');

  for (const scheme of schemes) {
    const config = authSchemeToConfig(scheme);
    const envVarName = getEnvVarName(scheme);

    switch (config.type) {
      case 'basic':
        lines.push(`${envVarName}_USERNAME=your-username`);
        lines.push(`${envVarName}_PASSWORD=your-password`);
        break;
      default:
        lines.push(`${envVarName}=your-${config.type}-token`);
        break;
    }
  }

  lines.push('```');

  return lines.join('\n');
}

/**
 * Generate a complete auth fixture file with all necessary imports and exports
 */
export function generateCompleteFixtureFile(
  schemes: AuthScheme[],
  options: FixtureGenerationOptions = {}
): {
  fixtureFile: string;
  envDoc: string;
} {
  return {
    fixtureFile: generateFixtureFile(schemes, options),
    envDoc: generateEnvDocumentation(schemes),
  };
}

// Re-export camelCase helper for consistency
function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}
