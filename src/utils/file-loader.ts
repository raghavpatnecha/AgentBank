/**
 * File loading utilities for OpenAPI/Swagger specifications
 * Supports JSON and YAML formats
 */

import { promises as fs } from 'fs';
import { parse as parseYaml } from 'yaml';
import { FileNotFoundError, ParseError } from '../types/errors.js';

export type FileFormat = 'json' | 'yaml' | 'yml';

export interface LoadOptions {
  format?: FileFormat;
  encoding?: BufferEncoding;
}

/**
 * Load a file from the filesystem
 * @param filePath - Path to the file
 * @param options - Loading options
 * @returns File contents as string
 * @throws FileNotFoundError if file doesn't exist
 */
export async function loadFile(filePath: string, options: LoadOptions = {}): Promise<string> {
  const { encoding = 'utf-8' } = options;

  try {
    const content = await fs.readFile(filePath, encoding);
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FileNotFoundError(filePath, {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }
}

/**
 * Detect file format from extension
 * @param filePath - Path to the file
 * @returns Detected format
 */
export function detectFormat(filePath: string): FileFormat {
  const extension = filePath.toLowerCase().split('.').pop();

  if (extension === 'json') {
    return 'json';
  }

  if (extension === 'yaml' || extension === 'yml') {
    return 'yaml';
  }

  return 'json';
}

/**
 * Parse file content based on format
 * @param content - File content as string
 * @param format - File format
 * @returns Parsed object
 * @throws ParseError if parsing fails
 */
export function parseContent(content: string, format: FileFormat): unknown {
  const formatStr = String(format);
  try {
    if (format === 'json') {
      return JSON.parse(content) as unknown;
    }

    if (format === 'yaml' || format === 'yml') {
      return parseYaml(content) as unknown;
    }

    throw new ParseError(`Unsupported format: ${formatStr}`, 'file-loader');
  } catch (error) {
    if (error instanceof ParseError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new ParseError(
      `Failed to parse ${formatStr.toUpperCase()}: ${errorMessage}`,
      'file-loader',
      {
        format: formatStr,
        originalError: errorMessage,
      }
    );
  }
}

/**
 * Load and parse a specification file
 * @param filePath - Path to the file
 * @param options - Loading options
 * @returns Parsed specification object
 * @throws FileNotFoundError if file doesn't exist
 * @throws ParseError if parsing fails
 */
export async function loadSpec(filePath: string, options: LoadOptions = {}): Promise<unknown> {
  const format = options.format ?? detectFormat(filePath);
  const content = await loadFile(filePath, options);
  return parseContent(content, format);
}
