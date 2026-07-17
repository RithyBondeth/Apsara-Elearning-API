import { QuestionType } from '@app/contracts';

export interface GradableQuestion {
  id: string;
  type: QuestionType;
  correctAnswer: unknown;
  points: number;
}

export interface StudentAnswer {
  questionId: string;
  selectedOptionId?: string | null;
  answerData?: Record<string, unknown> | null;
}

export interface GradeResult {
  isCorrect: boolean;
  pointsAwarded: number;
  /** True when the answer needs a human to score it. */
  requiresReview: boolean;
}

/** Context a strategy needs beyond the question and the answer itself. */
export interface GradeContext {
  /** Ids of the options flagged `isCorrect` for this question. */
  correctOptionIds: Set<string>;
}

type Strategy = (
  question: GradableQuestion,
  answer: StudentAnswer,
  ctx: GradeContext,
) => boolean | 'review';

interface Pair {
  left: string;
  right: string;
}

const spec = (question: GradableQuestion): Record<string, unknown> =>
  (question.correctAnswer as Record<string, unknown>) ?? {};

const normalizeText = (value: string, caseSensitive: boolean): string => {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return caseSensitive ? trimmed : trimmed.toLowerCase();
};

const toBool = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const isPair = (value: unknown): value is Pair =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Pair).left === 'string' &&
  typeof (value as Pair).right === 'string';

/** Keeps only well-formed pairs; a short result means the input was malformed. */
const toPairs = (value: unknown): Pair[] | null => {
  if (!Array.isArray(value)) return null;
  const pairs = (value as unknown[]).filter(isPair);
  return pairs.length === value.length ? pairs : null;
};

const matchesAcceptedText: Strategy = (question, answer) => {
  const accepted = spec(question).accepted;
  const caseSensitive = spec(question).caseSensitive === true;
  const text = answer.answerData?.text;
  if (!Array.isArray(accepted) || accepted.length === 0) return 'review';
  if (typeof text !== 'string') return false;
  const submitted = normalizeText(text, caseSensitive);
  return (accepted as unknown[]).some(
    (candidate) =>
      typeof candidate === 'string' &&
      normalizeText(candidate, caseSensitive) === submitted,
  );
};

const strategies: Record<QuestionType, Strategy> = {
  multiple_choice: (_question, answer, ctx) =>
    !!answer.selectedOptionId &&
    ctx.correctOptionIds.has(answer.selectedOptionId),

  true_false: (question, answer, ctx) => {
    // Authors may model true/false either as two options or as a boolean spec.
    if (answer.selectedOptionId && ctx.correctOptionIds.size > 0) {
      return ctx.correctOptionIds.has(answer.selectedOptionId);
    }
    const expected = toBool(spec(question).value);
    const submitted = toBool(answer.answerData?.value);
    if (expected === undefined) return 'review';
    return submitted !== undefined && submitted === expected;
  },

  fill_blank: matchesAcceptedText,

  short_answer: matchesAcceptedText,

  numeric: (question, answer) => {
    const { value, tolerance = 0 } = spec(question);
    const expected = Number(value);
    const submitted = Number(answer.answerData?.value);
    if (!Number.isFinite(expected)) return 'review';
    if (!Number.isFinite(submitted)) return false;
    return Math.abs(submitted - expected) <= Math.abs(Number(tolerance) || 0);
  },

  matching: (question, answer) => {
    const expectedPairs = toPairs(spec(question).pairs);
    if (!expectedPairs || expectedPairs.length === 0) return 'review';

    const submittedPairs = toPairs(answer.answerData?.pairs);
    if (!submittedPairs || submittedPairs.length !== expectedPairs.length)
      return false;

    const submittedByLeft = new Map<string, string>();
    for (const pair of submittedPairs) {
      submittedByLeft.set(
        normalizeText(pair.left, false),
        normalizeText(pair.right, false),
      );
    }
    // Every expected pair must be present with the same mapping (order-independent).
    return expectedPairs.every(
      (pair) =>
        submittedByLeft.get(normalizeText(pair.left, false)) ===
        normalizeText(pair.right, false),
    );
  },
};

/**
 * Grades a single answer against its question. Unknown types fall back to
 * review rather than silently scoring zero.
 */
export function gradeAnswer(
  question: GradableQuestion,
  answer: StudentAnswer,
  ctx: GradeContext,
): GradeResult {
  const strategy = strategies[question.type];
  const outcome = strategy ? strategy(question, answer, ctx) : 'review';

  if (outcome === 'review') {
    return { isCorrect: false, pointsAwarded: 0, requiresReview: true };
  }
  return {
    isCorrect: outcome,
    pointsAwarded: outcome ? question.points : 0,
    requiresReview: false,
  };
}
