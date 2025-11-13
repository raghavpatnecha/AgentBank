/**
 * AI-Powered Test Generator
 * Uses GPT-4 to generate intelligent, context-aware tests
 *
 * This generator analyzes OpenAPI specs and generates tests that understand:
 * - Business logic and domain constraints
 * - Endpoint relationships and workflows
 * - Security implications
 * - Real-world edge cases
 * - Implicit requirements not in the spec
 */

import OpenAI from 'openai';
import type { ApiEndpoint } from '../types/openapi-types.js';
import type { TestCase } from '../types/test-generator-types.js';

export interface AITestGeneratorOptions {
  /** OpenAI API key */
  apiKey?: string;

  /** OpenAI model to use */
  model?: string;

  /** Number of AI-generated tests per endpoint */
  testsPerEndpoint?: number;

  /** Focus areas for AI generation */
  focus?: Array<'business-logic' | 'security' | 'workflows' | 'edge-cases' | 'performance'>;

  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * AI-Powered Test Generator
 * Generates intelligent tests using GPT-4 that understand context and business logic
 */
export class AITestGenerator {
  private client: OpenAI | null = null;
  private options: Required<AITestGeneratorOptions>;
  private enabled: boolean = false;

  constructor(options: AITestGeneratorOptions = {}) {
    this.options = {
      apiKey: options.apiKey || process.env.OPENAI_API_KEY || '',
      model: options.model || process.env.OPENAI_MODEL || 'gpt-4',
      testsPerEndpoint: options.testsPerEndpoint || 3,
      focus: options.focus || ['business-logic', 'security', 'workflows', 'edge-cases'],
      verbose: options.verbose || false,
    };

    // Only enable if API key is provided
    if (this.options.apiKey) {
      this.client = new OpenAI({ apiKey: this.options.apiKey });
      this.enabled = true;

      if (this.options.verbose) {
        console.log('✨ AI Test Generator enabled (GPT-4)');
      }
    } else {
      if (this.options.verbose) {
        console.log('ℹ️  AI Test Generator disabled (no OPENAI_API_KEY)');
      }
    }
  }

  /**
   * Check if AI generation is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Generate intelligent tests for multiple endpoints
   */
  async generateTests(endpoints: ApiEndpoint[]): Promise<TestCase[]> {
    if (!this.enabled || !this.client) {
      return [];
    }

    const allTests: TestCase[] = [];

    // Generate tests for each endpoint
    for (const endpoint of endpoints) {
      try {
        const tests = await this.generateTestsForEndpoint(endpoint, endpoints);
        allTests.push(...tests);
      } catch (error) {
        if (this.options.verbose) {
          console.error(`Failed to generate AI tests for ${endpoint.path}:`, error);
        }
        // Continue with other endpoints even if one fails
      }
    }

    return allTests;
  }

  /**
   * Generate intelligent tests for a single endpoint
   */
  private async generateTestsForEndpoint(
    endpoint: ApiEndpoint,
    allEndpoints: ApiEndpoint[]
  ): Promise<TestCase[]> {
    if (!this.client) return [];

    const prompt = this.buildPrompt(endpoint, allEndpoints);

    if (this.options.verbose) {
      console.log(`🤖 Generating AI tests for ${endpoint.method.toUpperCase()} ${endpoint.path}...`);
    }

    const response = await this.client.chat.completions.create({
      model: this.options.model,
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '[]';

    try {
      const aiTests = JSON.parse(content);
      return this.convertAITestsToTestCases(aiTests, endpoint);
    } catch (error) {
      if (this.options.verbose) {
        console.error('Failed to parse AI response:', content);
      }
      return [];
    }
  }

  /**
   * Build system prompt for GPT-4
   */
  private getSystemPrompt(): string {
    return `You are an expert API testing engineer with deep knowledge of:
- Business logic validation and domain constraints
- Security vulnerabilities (OWASP Top 10)
- RESTful API best practices
- Real-world edge cases and failure scenarios
- Workflow dependencies and state management
- Performance and scalability testing

Your task is to analyze API endpoints and generate intelligent test cases that go beyond basic schema validation.
Focus on tests that catch real bugs, security issues, and business logic violations.

Return your response as a JSON array of test scenarios. Each scenario should have:
{
  "name": "Clear, descriptive test name",
  "description": "What this test validates and why it matters",
  "category": "business-logic" | "security" | "workflow" | "edge-case" | "performance",
  "priority": "critical" | "high" | "medium" | "low",
  "scenario": {
    "requestData": { /* test data */ },
    "expectedStatus": 200,
    "expectedBehavior": "Description of expected behavior",
    "validationPoints": ["Key things to verify"]
  }
}`;
  }

  /**
   * Build prompt for specific endpoint
   */
  private buildPrompt(endpoint: ApiEndpoint, allEndpoints: ApiEndpoint[]): string {
    const relatedEndpoints = this.findRelatedEndpoints(endpoint, allEndpoints);

    return `Analyze this API endpoint and generate ${this.options.testsPerEndpoint} intelligent test scenarios:

**Endpoint:**
${endpoint.method.toUpperCase()} ${endpoint.path}
${endpoint.summary || ''}
${endpoint.description || ''}

**Parameters:**
${JSON.stringify(endpoint.parameters || [], null, 2)}

**Request Body:**
${endpoint.requestBody ? JSON.stringify(endpoint.requestBody, null, 2) : 'None'}

**Responses:**
${JSON.stringify(endpoint.responses || {}, null, 2)}

**Security:**
${JSON.stringify(endpoint.security || [], null, 2)}

**Related Endpoints:**
${relatedEndpoints.map(e => `${e.method.toUpperCase()} ${e.path}`).join('\n')}

**Focus Areas:** ${this.options.focus.join(', ')}

Generate ${this.options.testsPerEndpoint} test scenarios that:
1. Test business logic constraints and domain rules
2. Test security vulnerabilities and authorization
3. Test workflow dependencies with related endpoints
4. Test realistic edge cases and error conditions
5. Consider implicit requirements not explicitly in the spec

Return ONLY a JSON array of test scenarios, no additional text.`;
  }

  /**
   * Find endpoints related to the current one (same resource, CRUD operations, etc.)
   */
  private findRelatedEndpoints(endpoint: ApiEndpoint, allEndpoints: ApiEndpoint[]): ApiEndpoint[] {
    const basePath = endpoint.path.split('/').slice(0, -1).join('/') || endpoint.path;

    return allEndpoints
      .filter(e => {
        if (e.path === endpoint.path) return false;

        const eBasePath = e.path.split('{')[0] || e.path;
        return e.path.startsWith(basePath) || basePath.startsWith(eBasePath);
      })
      .slice(0, 5); // Limit to 5 related endpoints
  }

  /**
   * Convert AI-generated test scenarios to TestCase objects
   */
  private convertAITestsToTestCases(aiTests: any[], endpoint: ApiEndpoint): TestCase[] {
    if (!Array.isArray(aiTests)) {
      return [];
    }

    return aiTests.map((aiTest, index) => {
      const testId = `${endpoint.operationId || endpoint.path.replace(/\//g, '-')}-ai-${index}`;

      const testCase: TestCase = {
        id: testId,
        name: aiTest.name || `AI Generated Test ${index + 1}`,
        description: aiTest.description || 'AI-generated intelligent test scenario',
        type: 'validation', // AI tests are complex validation tests
        method: endpoint.method,
        endpoint: endpoint.path,
        request: {
          pathParams: this.extractPathParams(aiTest.scenario?.requestData),
          queryParams: this.extractQueryParams(aiTest.scenario?.requestData),
          body: aiTest.scenario?.requestData?.body ? {
            contentType: 'application/json',
            data: aiTest.scenario.requestData.body,
            generated: true,
          } : undefined,
        },
        expectedResponse: {
          status: aiTest.scenario?.expectedStatus || 200,
        },
        metadata: {
          tags: [
            ...(endpoint.tags || []),
            'ai-generated',
            aiTest.category || 'intelligent',
          ],
          priority: aiTest.priority || 'medium',
          stability: 'experimental' as const,
          operationId: endpoint.operationId,
          generatedAt: new Date().toISOString(),
          generatorVersion: '1.0.0-ai',
        },
      };

      return testCase;
    });
  }

  /**
   * Extract path parameters from AI test data
   */
  private extractPathParams(requestData: any): Record<string, any> | undefined {
    if (!requestData?.pathParams) return undefined;

    const pathParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(requestData.pathParams)) {
      pathParams[key] = {
        value,
        description: `AI-generated value for ${key}`,
        generated: true,
      };
    }
    return pathParams;
  }

  /**
   * Extract query parameters from AI test data
   */
  private extractQueryParams(requestData: any): Record<string, any> | undefined {
    if (!requestData?.queryParams) return undefined;

    const queryParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(requestData.queryParams)) {
      queryParams[key] = {
        value,
        description: `AI-generated value for ${key}`,
        generated: true,
      };
    }
    return queryParams;
  }
}

/**
 * Create an AI test generator instance
 */
export function createAITestGenerator(options?: AITestGeneratorOptions): AITestGenerator {
  return new AITestGenerator(options);
}
