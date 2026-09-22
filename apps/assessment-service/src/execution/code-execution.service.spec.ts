import { ConfigService } from '@nestjs/config';
import { CodeExecutionService, TestCaseIO } from './code-execution.service';

/**
 * The grading pipeline has two modes: a deterministic mock (no JUDGE0_URL) and
 * a real Judge0 path. The mock keeps the score/XP pipeline testable; the Judge0
 * path must map status 3 to a pass, reject unsupported languages, and treat a
 * transport failure as a graceful non-pass rather than a thrown grade.
 */

function config(values: Record<string, string | undefined> = {}) {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

const tc = (expectedOutput: string, input: string | null = null): TestCaseIO => ({
  input,
  expectedOutput,
});

describe('CodeExecutionService mock mode', () => {
  const service = new CodeExecutionService(config()); // no judge0.url

  it('is not enabled without a Judge0 URL', () => {
    expect(service.enabled).toBe(false);
  });

  it('passes a case when its expected output appears in the source', async () => {
    const res = await service.grade('javascript', 'console.log("42")', [tc('42')]);
    expect(res).toMatchObject({ passed: 1, total: 1, allPassed: true, mock: true });
    expect(res.executionTimeMs).toBe(0);
    expect(res.errorMessage).toBeNull();
  });

  it('counts only the matching cases and is not all-passed', async () => {
    const res = await service.grade('javascript', 'return "foo"', [tc('foo'), tc('bar')]);
    expect(res.passed).toBe(1);
    expect(res.total).toBe(2);
    expect(res.allPassed).toBe(false);
  });

  it('never counts an empty expected output as a match', async () => {
    const res = await service.grade('javascript', '', [tc('')]);
    expect(res.passed).toBe(0);
    expect(res.allPassed).toBe(false);
  });

  it('is not all-passed when there are no test cases', async () => {
    const res = await service.grade('javascript', 'anything', []);
    expect(res).toMatchObject({ passed: 0, total: 0, allPassed: false });
  });
});

describe('CodeExecutionService Judge0 mode', () => {
  const withJudge0 = () =>
    new CodeExecutionService(config({ 'judge0.url': 'https://judge0.test' }));

  const okStatus = (id: number) => ({
    ok: true,
    json: async () => ({ status: { id } }),
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is enabled when a Judge0 URL is configured', () => {
    expect(withJudge0().enabled).toBe(true);
  });

  it('marks all cases passed when Judge0 accepts each (status 3)', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(okStatus(3) as never);
    const res = await withJudge0().grade('python', 'print(x)', [tc('1'), tc('2')]);
    expect(res).toMatchObject({ passed: 2, total: 2, allPassed: true, mock: false });
  });

  it('does not pass a case whose status is not Accepted', async () => {
    // status 4 === Wrong Answer.
    jest.spyOn(global, 'fetch').mockResolvedValue(okStatus(4) as never);
    const res = await withJudge0().grade('python', 'print(x)', [tc('1')]);
    expect(res.passed).toBe(0);
    expect(res.allPassed).toBe(false);
  });

  it('rejects an unsupported language with a 400', async () => {
    await expect(
      withJudge0().grade('cobol', 'IDENTIFICATION DIVISION.', [tc('1')]),
    ).rejects.toMatchObject({ error: { statusCode: 400 } });
  });

  it('records a transport failure as an error and stops grading', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 502 } as never);
    const res = await withJudge0().grade('python', 'print(x)', [tc('1'), tc('2')]);
    expect(res.passed).toBe(0);
    expect(res.allPassed).toBe(false);
    expect(res.errorMessage).toContain('502');
  });
});
