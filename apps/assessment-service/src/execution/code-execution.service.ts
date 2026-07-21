import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcBadRequestException } from '@app/common';

export interface TestCaseIO {
  input: string | null;
  expectedOutput: string;
}

export interface ExecutionResult {
  passed: number;
  total: number;
  allPassed: boolean;
  executionTimeMs: number;
  errorMessage: string | null;
  mock: boolean;
}

// Minimal language → Judge0 language_id map (extend as needed).
const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  javascript: 93, // Node.js 18
  typescript: 94,
  python: 71, // Python 3.8
  java: 62,
  c: 50,
  cpp: 54,
  go: 60,
  ruby: 72,
};

/**
 * Grades a submission against test cases. Uses a Judge0 instance when
 * JUDGE0_URL is configured; otherwise falls back to a deterministic mock so
 * the grading pipeline is testable without a sandbox.
 */
@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);
  private readonly judge0Url: string | undefined;
  private readonly judge0Token: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.judge0Url = this.configService.get<string>('judge0.url') || undefined;
    this.judge0Token =
      this.configService.get<string>('judge0.token') || undefined;
    if (!this.judge0Url) {
      this.logger.warn(
        'JUDGE0_URL not set — code grading is running in MOCK mode',
      );
    }
  }

  get enabled(): boolean {
    return !!this.judge0Url;
  }

  async grade(
    language: string,
    sourceCode: string,
    testCases: TestCaseIO[],
  ): Promise<ExecutionResult> {
    if (!this.judge0Url) {
      return this.mockGrade(sourceCode, testCases);
    }
    return this.judge0Grade(language, sourceCode, testCases);
  }

  /**
   * Deterministic placeholder: a test case "passes" when its expected output
   * appears in the submitted source. Not real execution — replaced by Judge0
   * when configured — but exercises the full grade → score → XP pipeline.
   */
  private mockGrade(
    sourceCode: string,
    testCases: TestCaseIO[],
  ): ExecutionResult {
    let passed = 0;
    for (const tc of testCases) {
      const expected = (tc.expectedOutput ?? '').trim();
      if (expected.length > 0 && (sourceCode ?? '').includes(expected)) {
        passed++;
      }
    }
    return {
      passed,
      total: testCases.length,
      allPassed: testCases.length > 0 && passed === testCases.length,
      executionTimeMs: 0,
      errorMessage: null,
      mock: true,
    };
  }

  private async judge0Grade(
    language: string,
    sourceCode: string,
    testCases: TestCaseIO[],
  ): Promise<ExecutionResult> {
    const languageId = JUDGE0_LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) {
      throw new RpcBadRequestException(`Unsupported language: ${language}`);
    }

    const start = Date.now();
    let passed = 0;
    let errorMessage: string | null = null;

    for (const tc of testCases) {
      try {
        const accepted = await this.runOne(
          languageId,
          sourceCode,
          tc.input ?? '',
          tc.expectedOutput,
        );
        if (accepted) passed++;
      } catch (error) {
        errorMessage =
          error instanceof Error ? error.message : 'Execution error';
        break;
      }
    }

    return {
      passed,
      total: testCases.length,
      allPassed:
        !errorMessage && testCases.length > 0 && passed === testCases.length,
      executionTimeMs: Date.now() - start,
      errorMessage,
      mock: false,
    };
  }

  private async runOne(
    languageId: number,
    sourceCode: string,
    stdin: string,
    expectedOutput: string,
  ): Promise<boolean> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.judge0Token) headers['X-Auth-Token'] = this.judge0Token;

    const res = await fetch(
      `${this.judge0Url}/submissions?base64_encoded=false&wait=true`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          language_id: languageId,
          source_code: sourceCode,
          stdin,
          expected_output: expectedOutput,
        }),
      },
    );
    if (!res.ok) {
      throw new Error(`Judge0 returned ${res.status}`);
    }
    const data = (await res.json()) as { status?: { id?: number } };
    // Judge0 status 3 === "Accepted" (stdout matched expected_output).
    return data.status?.id === 3;
  }
}
