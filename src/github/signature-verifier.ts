/**
 * GitHub Webhook Signature Verifier
 *
 * Implements secure HMAC-SHA256 signature verification for GitHub webhooks.
 * Protects against timing attacks using constant-time comparison.
 */

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Signature verification error
 */
export class SignatureVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignatureVerificationError';
  }
}

/**
 * GitHub webhook signature verifier
 *
 * Verifies webhook signatures using HMAC-SHA256 to ensure webhooks
 * are genuinely from GitHub and have not been tampered with.
 *
 * @example
 * ```typescript
 * const verifier = new SignatureVerifier();
 * const isValid = verifier.verify(
 *   JSON.stringify(req.body),
 *   req.headers['x-hub-signature-256'],
 *   process.env.WEBHOOK_SECRET
 * );
 * ```
 */
export class SignatureVerifier {
  /**
   * Algorithm used for signature generation
   */
  private readonly algorithm = 'sha256';

  /**
   * Prefix for GitHub signatures
   */
  private readonly signaturePrefix = 'sha256=';

  /**
   * Verify webhook signature
   *
   * Compares the provided signature against a computed signature
   * using constant-time comparison to prevent timing attacks.
   *
   * @param payload - Raw webhook payload as string
   * @param signature - Signature from X-Hub-Signature-256 header
   * @param secret - Webhook secret configured in GitHub
   * @returns true if signature is valid, false otherwise
   * @throws {SignatureVerificationError} If inputs are invalid
   *
   * @example
   * ```typescript
   * const verifier = new SignatureVerifier();
   * const payload = JSON.stringify(req.body);
   * const signature = req.headers['x-hub-signature-256'];
   * const secret = process.env.WEBHOOK_SECRET;
   *
   * if (!verifier.verify(payload, signature, secret)) {
   *   throw new Error('Invalid signature');
   * }
   * ```
   */
  public verify(payload: string, signature: string | undefined, secret: string): boolean {
    // Validate inputs
    if (!payload) {
      throw new SignatureVerificationError('Payload is required');
    }

    if (!signature) {
      throw new SignatureVerificationError('Signature is required');
    }

    if (!secret) {
      throw new SignatureVerificationError('Secret is required');
    }

    // Validate signature format
    if (!signature.startsWith(this.signaturePrefix)) {
      throw new SignatureVerificationError(
        `Invalid signature format. Expected format: ${this.signaturePrefix}<hex>`
      );
    }

    // Generate expected signature
    const expectedSignature = this.generateSignature(payload, secret);

    // Compare signatures using constant-time comparison
    return this.constantTimeCompare(signature, expectedSignature);
  }

  /**
   * Generate HMAC-SHA256 signature
   *
   * Creates a signature using the provided payload and secret.
   * The signature is prefixed with "sha256=" to match GitHub's format.
   *
   * @param payload - Data to sign
   * @param secret - Secret key
   * @returns Signature in format "sha256=<hex>"
   *
   * @example
   * ```typescript
   * const verifier = new SignatureVerifier();
   * const signature = verifier.generateSignature(
   *   JSON.stringify({ event: 'test' }),
   *   'my-secret'
   * );
   * // Returns: "sha256=abc123..."
   * ```
   */
  public generateSignature(payload: string, secret: string): string {
    if (!payload) {
      throw new SignatureVerificationError('Payload is required');
    }

    if (!secret) {
      throw new SignatureVerificationError('Secret is required');
    }

    // Create HMAC with SHA-256
    const hmac = createHmac(this.algorithm, secret);
    hmac.update(payload);

    // Generate hex digest
    const digest = hmac.digest('hex');

    // Return with GitHub's prefix format
    return `${this.signaturePrefix}${digest}`;
  }

  /**
   * Constant-time string comparison
   *
   * Prevents timing attacks by comparing strings in constant time.
   * Uses Node.js crypto.timingSafeEqual for secure comparison.
   *
   * @param a - First string to compare
   * @param b - Second string to compare
   * @returns true if strings match, false otherwise
   *
   * @remarks
   * This method protects against timing attacks where an attacker
   * could determine the correct signature by measuring comparison time.
   * Regular string comparison (===) can leak timing information.
   *
   * @example
   * ```typescript
   * const verifier = new SignatureVerifier();
   * const match = verifier.constantTimeCompare(
   *   'sha256=abc123',
   *   'sha256=abc123'
   * ); // true
   * ```
   */
  public constantTimeCompare(a: string, b: string): boolean {
    // Check if strings are the same length
    // This is safe to do as length is not secret information
    if (a.length !== b.length) {
      return false;
    }

    try {
      // Convert strings to buffers
      const bufferA = Buffer.from(a, 'utf8');
      const bufferB = Buffer.from(b, 'utf8');

      // Use Node.js built-in constant-time comparison
      return timingSafeEqual(bufferA, bufferB);
    } catch (error) {
      // timingSafeEqual throws if buffers are different lengths
      // This shouldn't happen due to our length check above,
      // but we handle it just in case
      return false;
    }
  }

  /**
   * Extract signature hash from full signature string
   *
   * Removes the "sha256=" prefix to get just the hex digest.
   *
   * @param signature - Full signature with prefix
   * @returns Hex digest without prefix
   * @throws {SignatureVerificationError} If signature format is invalid
   *
   * @example
   * ```typescript
   * const verifier = new SignatureVerifier();
   * const hash = verifier.extractHash('sha256=abc123');
   * // Returns: 'abc123'
   * ```
   */
  public extractHash(signature: string): string {
    if (!signature) {
      throw new SignatureVerificationError('Signature is required');
    }

    if (!signature.startsWith(this.signaturePrefix)) {
      throw new SignatureVerificationError(
        `Invalid signature format. Expected prefix: ${this.signaturePrefix}`
      );
    }

    return signature.substring(this.signaturePrefix.length);
  }

  /**
   * Validate signature format
   *
   * Checks if a signature string has the correct format without
   * performing verification.
   *
   * @param signature - Signature to validate
   * @returns true if format is valid
   *
   * @example
   * ```typescript
   * const verifier = new SignatureVerifier();
   * verifier.isValidFormat('sha256=abc123'); // true
   * verifier.isValidFormat('md5=abc123'); // false
   * verifier.isValidFormat('invalid'); // false
   * ```
   */
  public isValidFormat(signature: string): boolean {
    if (!signature) {
      return false;
    }

    // Check prefix
    if (!signature.startsWith(this.signaturePrefix)) {
      return false;
    }

    // Extract hash part
    const hash = signature.substring(this.signaturePrefix.length);

    // Validate hash is hexadecimal
    const hexPattern = /^[a-f0-9]+$/i;
    if (!hexPattern.test(hash)) {
      return false;
    }

    // SHA-256 produces 64 hex characters
    if (hash.length !== 64) {
      return false;
    }

    return true;
  }

  /**
   * Verify signature with detailed result
   *
   * Similar to verify() but returns detailed information about
   * the verification result including any errors.
   *
   * @param payload - Raw webhook payload
   * @param signature - Signature from header
   * @param secret - Webhook secret
   * @returns Detailed verification result
   *
   * @example
   * ```typescript
   * const verifier = new SignatureVerifier();
   * const result = verifier.verifyDetailed(payload, signature, secret);
   * if (!result.valid) {
   *   console.error('Verification failed:', result.error);
   * }
   * ```
   */
  public verifyDetailed(
    payload: string,
    signature: string | undefined,
    secret: string
  ): { valid: boolean; error?: string } {
    try {
      const valid = this.verify(payload, signature, secret);
      return { valid };
    } catch (error) {
      if (error instanceof SignatureVerificationError) {
        return {
          valid: false,
          error: error.message,
        };
      }
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get algorithm name
   *
   * @returns The algorithm used for signature generation
   */
  public getAlgorithm(): string {
    return this.algorithm;
  }

  /**
   * Get signature prefix
   *
   * @returns The prefix used in signatures
   */
  public getSignaturePrefix(): string {
    return this.signaturePrefix;
  }
}

/**
 * Create a new signature verifier instance
 *
 * Convenience function for creating a verifier.
 *
 * @returns New SignatureVerifier instance
 *
 * @example
 * ```typescript
 * const verifier = createSignatureVerifier();
 * ```
 */
export function createSignatureVerifier(): SignatureVerifier {
  return new SignatureVerifier();
}

/**
 * Verify webhook signature (functional style)
 *
 * Convenience function for one-off signature verification.
 *
 * @param payload - Raw webhook payload
 * @param signature - Signature from header
 * @param secret - Webhook secret
 * @returns true if signature is valid
 *
 * @example
 * ```typescript
 * if (!verifyWebhookSignature(payload, signature, secret)) {
 *   throw new Error('Invalid signature');
 * }
 * ```
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | undefined,
  secret: string
): boolean {
  const verifier = new SignatureVerifier();
  return verifier.verify(payload, signature, secret);
}

/**
 * Generate webhook signature (functional style)
 *
 * Convenience function for generating a signature.
 *
 * @param payload - Data to sign
 * @param secret - Secret key
 * @returns Signature in format "sha256=<hex>"
 *
 * @example
 * ```typescript
 * const signature = generateWebhookSignature(
 *   JSON.stringify(payload),
 *   secret
 * );
 * ```
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  const verifier = new SignatureVerifier();
  return verifier.generateSignature(payload, secret);
}
