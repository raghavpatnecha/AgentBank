/**
 * Code Validator (Feature 4, Task 4.5)
 * Validates generated TypeScript and Playwright test code
 */

import ts from 'typescript';
import type {
  SyntaxValidation,
  SyntaxError as CustomSyntaxError,
  ImportValidation,
  StructureValidation,
  AssertionValidation,
  CompilationResult,
  CompilationError,
  CompilationWarning,
} from '../types/ai-types.js';

/**
 * Code Validator - Validates generated test code
 */
export class CodeValidator {
  /**
   * Validate TypeScript syntax
   */
  validateTypeScriptSyntax(code: string): SyntaxValidation {
    const errors: CustomSyntaxError[] = [];

    try {
      // Create a source file for parsing
      const sourceFile = ts.createSourceFile(
        'temp.ts',
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
      );

      // Check for syntax errors
      const diagnostics = (sourceFile as any).parseDiagnostics || [];

      for (const diagnostic of diagnostics) {
        if (diagnostic.file) {
          const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
            diagnostic.start || 0,
          );

          errors.push({
            message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
            line: line + 1,
            column: character + 1,
            code: `TS${diagnostic.code}`,
          });
        } else {
          errors.push({
            message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
            line: 0,
            column: 0,
            code: `TS${diagnostic.code}`,
          });
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        parser: 'typescript',
      };
    } catch (error) {
      // If parsing completely fails
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        errors: [{
          message: `Parse error: ${errorMessage}`,
          line: 0,
          column: 0,
        }],
        parser: 'typescript',
      };
    }
  }

  /**
   * Validate Playwright imports
   */
  validatePlaywrightImports(code: string): boolean {
    // Check for essential Playwright imports
    const hasTestImport = /import\s+{[^}]*test[^}]*}\s+from\s+['"]@playwright\/test['"]/.test(code);
    const hasExpectImport = /import\s+{[^}]*expect[^}]*}\s+from\s+['"]@playwright\/test['"]/.test(code);

    // At minimum, we need test and expect
    return hasTestImport && hasExpectImport;
  }

  /**
   * Validate test structure
   */
  validateTestStructure(code: string): StructureValidation {
    const issues: string[] = [];

    // Check for test blocks
    const testBlockRegex = /\b(test|it)\s*\(/g;
    const testMatches = code.match(testBlockRegex);
    const hasTestBlocks = testMatches !== null && testMatches.length > 0;
    const testCount = testMatches?.length || 0;

    if (!hasTestBlocks) {
      issues.push('No test blocks found (expected test() or it() calls)');
    }

    // Check for describe blocks (optional but good practice)
    const describeBlockRegex = /\bdescribe\s*\(/g;
    const describeMatches = code.match(describeBlockRegex);
    const hasDescribeBlocks = describeMatches !== null && describeMatches.length > 0;

    // Check for proper async test functions
    const asyncTestRegex = /\b(test|it)\s*\(\s*['"][^'"]*['"]\s*,\s*async\s*\(/g;
    const asyncTestMatches = code.match(asyncTestRegex);
    const asyncTestCount = asyncTestMatches?.length || 0;

    if (testCount > 0 && asyncTestCount === 0) {
      issues.push('Tests should be async functions for API testing');
    }

    // Check for request object usage (Playwright API testing pattern)
    const hasRequestUsage = /\brequest\b/.test(code);
    if (testCount > 0 && !hasRequestUsage) {
      issues.push('No request object found (expected for API tests)');
    }

    // Check for proper test structure (no empty tests)
    const emptyTestRegex = /\b(test|it)\s*\([^)]*\)\s*{\s*}/g;
    const emptyTests = code.match(emptyTestRegex);
    if (emptyTests && emptyTests.length > 0) {
      issues.push(`Found ${emptyTests.length} empty test(s)`);
    }

    return {
      valid: issues.length === 0,
      hasTestBlocks,
      testCount,
      hasDescribeBlocks,
      issues,
    };
  }

  /**
   * Validate assertions
   */
  validateAssertions(code: string): AssertionValidation {
    const issues: string[] = [];

    // Count expect statements
    const expectRegex = /\bexpect\s*\(/g;
    const expectMatches = code.match(expectRegex);
    const assertionCount = expectMatches?.length || 0;
    const hasExpectStatements = assertionCount > 0;

    if (!hasExpectStatements) {
      issues.push('No expect() assertions found');
    }

    // Check for common assertion patterns
    const hasStatusAssertion = /expect\([^)]*\.status\s*\(\s*\)\s*\)/.test(code);
    const hasBodyAssertion = /expect\([^)]*\.json\s*\(\s*\)\s*\)/.test(code);
    const hasToBeAssertion = /\.toBe\s*\(/.test(code);
    const hasToEqualAssertion = /\.toEqual\s*\(/.test(code);

    // Warnings for best practices
    if (hasExpectStatements && !hasStatusAssertion) {
      issues.push('Consider adding status code assertions for API tests');
    }

    if (hasExpectStatements && !hasBodyAssertion) {
      issues.push('Consider adding response body assertions');
    }

    if (!hasToBeAssertion && !hasToEqualAssertion) {
      issues.push('No comparison assertions found (toBe, toEqual, etc.)');
    }

    // Check for proper assertion chains
    const assertionChainRegex = /expect\([^)]*\)\s*\.\s*\w+\s*\(/g;
    const chainMatches = code.match(assertionChainRegex);
    const properAssertions = chainMatches?.length || 0;

    if (assertionCount > properAssertions) {
      issues.push('Some expect() calls may be missing assertion methods');
    }

    return {
      valid: hasExpectStatements && properAssertions > 0,
      assertionCount,
      hasExpectStatements,
      issues,
    };
  }

  /**
   * Compile TypeScript code and check for errors
   */
  compileCode(code: string): CompilationResult {
    try {
      // Create compiler options
      const options: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        noEmit: false,
        noEmitOnError: false,
        declaration: false,
        sourceMap: false,
      };

      // Create a virtual file system
      const fileName = 'temp.ts';
      const sourceFile = ts.createSourceFile(
        fileName,
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
      );

      // Create a compiler host
      const compilerHost: ts.CompilerHost = {
        getSourceFile: (name: string) => {
          if (name === fileName) {
            return sourceFile;
          }
          // For imports, return undefined (we're not resolving dependencies)
          return undefined;
        },
        writeFile: () => {}, // No-op
        getCurrentDirectory: () => process.cwd(),
        getDirectories: () => [],
        fileExists: (name: string) => name === fileName,
        readFile: (name: string) => (name === fileName ? code : undefined),
        getCanonicalFileName: (name: string) => name,
        useCaseSensitiveFileNames: () => true,
        getNewLine: () => '\n',
        getDefaultLibFileName: (opts: ts.CompilerOptions) => ts.getDefaultLibFilePath(opts),
      };

      // Create program
      const program = ts.createProgram([fileName], options, compilerHost);

      // Get diagnostics
      const allDiagnostics = ts.getPreEmitDiagnostics(program);

      // Extract errors and warnings
      const errors = this.extractErrors(allDiagnostics);
      const warnings = this.extractWarnings(allDiagnostics);

      // Try to emit (transpile)
      let output: string | undefined;
      program.emit(undefined, (name, text) => {
        if (name.endsWith('.js')) {
          output = text;
        }
      });

      return {
        success: errors.length === 0,
        errors,
        warnings,
        output,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        errors: [{
          message: `Compilation error: ${errorMessage}`,
          file: 'temp.ts',
          line: 0,
          column: 0,
          code: 0,
          category: ts.DiagnosticCategory.Error,
        }],
        warnings: [],
      };
    }
  }

  /**
   * Extract compilation errors from diagnostics
   */
  extractErrors(diagnostics: readonly ts.Diagnostic[]): CompilationError[] {
    const errors: CompilationError[] = [];

    for (const diagnostic of diagnostics) {
      // Only process errors (not warnings or messages)
      if (diagnostic.category !== ts.DiagnosticCategory.Error) {
        continue;
      }

      let line = 0;
      let column = 0;
      let file = 'temp.ts';

      if (diagnostic.file && diagnostic.start !== undefined) {
        const { line: l, character } = diagnostic.file.getLineAndCharacterOfPosition(
          diagnostic.start,
        );
        line = l + 1;
        column = character + 1;
        file = diagnostic.file.fileName;
      }

      errors.push({
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        file,
        line,
        column,
        code: diagnostic.code,
        category: diagnostic.category,
      });
    }

    return errors;
  }

  /**
   * Extract warnings from diagnostics
   */
  private extractWarnings(diagnostics: readonly ts.Diagnostic[]): CompilationWarning[] {
    const warnings: CompilationWarning[] = [];

    for (const diagnostic of diagnostics) {
      // Only process warnings
      if (diagnostic.category !== ts.DiagnosticCategory.Warning) {
        continue;
      }

      let line = 0;
      let column = 0;
      let file = 'temp.ts';

      if (diagnostic.file && diagnostic.start !== undefined) {
        const { line: l, character } = diagnostic.file.getLineAndCharacterOfPosition(
          diagnostic.start,
        );
        line = l + 1;
        column = character + 1;
        file = diagnostic.file.fileName;
      }

      warnings.push({
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        file,
        line,
        column,
      });
    }

    return warnings;
  }

  /**
   * Validate complete code (all checks)
   */
  validateAll(code: string): {
    valid: boolean;
    syntax: SyntaxValidation;
    imports: ImportValidation;
    structure: StructureValidation;
    assertions: AssertionValidation;
    compilation: CompilationResult;
  } {
    const syntax = this.validateTypeScriptSyntax(code);
    const hasPlaywrightImports = this.validatePlaywrightImports(code);
    const structure = this.validateTestStructure(code);
    const assertions = this.validateAssertions(code);
    const compilation = this.compileCode(code);

    const imports: ImportValidation = {
      valid: hasPlaywrightImports,
      hasPlaywrightImports,
      missingImports: hasPlaywrightImports ? [] : ['@playwright/test'],
      invalidImports: [],
    };

    const valid =
      syntax.valid &&
      imports.valid &&
      structure.valid &&
      assertions.valid &&
      compilation.success;

    return {
      valid,
      syntax,
      imports,
      structure,
      assertions,
      compilation,
    };
  }

  /**
   * Get detailed validation report
   */
  getValidationReport(code: string): string {
    const result = this.validateAll(code);
    const lines: string[] = [];

    lines.push('=== Code Validation Report ===\n');
    lines.push(`Overall Status: ${result.valid ? '✓ VALID' : '✗ INVALID'}\n`);

    // Syntax
    lines.push('Syntax Validation:');
    lines.push(`  Status: ${result.syntax.valid ? '✓' : '✗'}`);
    if (result.syntax.errors.length > 0) {
      lines.push('  Errors:');
      for (const error of result.syntax.errors) {
        lines.push(`    - Line ${error.line}, Col ${error.column}: ${error.message}`);
      }
    }
    lines.push('');

    // Imports
    lines.push('Import Validation:');
    lines.push(`  Status: ${result.imports.valid ? '✓' : '✗'}`);
    lines.push(`  Has Playwright Imports: ${result.imports.hasPlaywrightImports ? '✓' : '✗'}`);
    if (result.imports.missingImports.length > 0) {
      lines.push(`  Missing: ${result.imports.missingImports.join(', ')}`);
    }
    lines.push('');

    // Structure
    lines.push('Structure Validation:');
    lines.push(`  Status: ${result.structure.valid ? '✓' : '✗'}`);
    lines.push(`  Test Blocks: ${result.structure.testCount}`);
    lines.push(`  Has Describe: ${result.structure.hasDescribeBlocks ? '✓' : '✗'}`);
    if (result.structure.issues.length > 0) {
      lines.push('  Issues:');
      for (const issue of result.structure.issues) {
        lines.push(`    - ${issue}`);
      }
    }
    lines.push('');

    // Assertions
    lines.push('Assertion Validation:');
    lines.push(`  Status: ${result.assertions.valid ? '✓' : '✗'}`);
    lines.push(`  Assertion Count: ${result.assertions.assertionCount}`);
    if (result.assertions.issues.length > 0) {
      lines.push('  Issues:');
      for (const issue of result.assertions.issues) {
        lines.push(`    - ${issue}`);
      }
    }
    lines.push('');

    // Compilation
    lines.push('Compilation:');
    lines.push(`  Status: ${result.compilation.success ? '✓' : '✗'}`);
    if (result.compilation.errors.length > 0) {
      lines.push('  Errors:');
      for (const error of result.compilation.errors) {
        lines.push(`    - Line ${error.line}, Col ${error.column}: ${error.message}`);
      }
    }
    if (result.compilation.warnings.length > 0) {
      lines.push('  Warnings:');
      for (const warning of result.compilation.warnings) {
        lines.push(`    - Line ${warning.line}, Col ${warning.column}: ${warning.message}`);
      }
    }

    return lines.join('\n');
  }
}
