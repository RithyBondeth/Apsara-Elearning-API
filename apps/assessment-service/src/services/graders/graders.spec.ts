import { gradeAnswer, GradableQuestion } from './index';

const question = (
  over: Partial<GradableQuestion> & Pick<GradableQuestion, 'type'>,
): GradableQuestion => ({
  id: 'q1',
  correctAnswer: null,
  points: 1,
  ...over,
});

const grade = (
  q: GradableQuestion,
  answer: Record<string, unknown> | null,
  correctOptionIds: string[] = [],
  selectedOptionId?: string,
) =>
  gradeAnswer(
    q,
    { questionId: q.id, selectedOptionId, answerData: answer },
    { correctOptionIds: new Set(correctOptionIds) },
  );

describe('gradeAnswer', () => {
  describe('multiple_choice', () => {
    const q = question({ type: 'multiple_choice', points: 3 });

    it('awards full points for the correct option', () => {
      expect(grade(q, null, ['opt-a'], 'opt-a')).toEqual({
        isCorrect: true,
        pointsAwarded: 3,
        requiresReview: false,
      });
    });

    it('scores zero for a wrong option', () => {
      expect(grade(q, null, ['opt-a'], 'opt-b')).toMatchObject({
        isCorrect: false,
        pointsAwarded: 0,
      });
    });

    it('scores zero when nothing was selected', () => {
      expect(grade(q, null, ['opt-a'])).toMatchObject({ isCorrect: false });
    });
  });

  describe('true_false', () => {
    it('compares against the boolean spec', () => {
      const q = question({
        type: 'true_false',
        correctAnswer: { value: true },
      });
      expect(grade(q, { value: true })).toMatchObject({ isCorrect: true });
      expect(grade(q, { value: false })).toMatchObject({ isCorrect: false });
    });

    it('accepts stringified booleans', () => {
      const q = question({
        type: 'true_false',
        correctAnswer: { value: false },
      });
      expect(grade(q, { value: 'false' })).toMatchObject({ isCorrect: true });
    });

    it('falls back to options when authored as two choices', () => {
      const q = question({ type: 'true_false' });
      expect(grade(q, null, ['opt-true'], 'opt-true')).toMatchObject({
        isCorrect: true,
      });
    });

    it('needs review when neither options nor a spec exist', () => {
      const q = question({ type: 'true_false' });
      expect(grade(q, { value: true })).toMatchObject({ requiresReview: true });
    });
  });

  describe('numeric', () => {
    const q = question({
      type: 'numeric',
      correctAnswer: { value: 1.5, tolerance: 0.01 },
      points: 2,
    });

    it('accepts an exact match', () => {
      expect(grade(q, { value: 1.5 })).toEqual({
        isCorrect: true,
        pointsAwarded: 2,
        requiresReview: false,
      });
    });

    it('accepts a value inside the tolerance', () => {
      expect(grade(q, { value: 1.505 })).toMatchObject({ isCorrect: true });
    });

    it('rejects a value outside the tolerance', () => {
      expect(grade(q, { value: 1.6 })).toMatchObject({ isCorrect: false });
    });

    it('coerces numeric strings', () => {
      expect(grade(q, { value: '1.5' })).toMatchObject({ isCorrect: true });
    });

    it('rejects non-numeric input', () => {
      expect(grade(q, { value: 'abc' })).toMatchObject({ isCorrect: false });
    });

    it('defaults to an exact match when no tolerance is given', () => {
      const exact = question({ type: 'numeric', correctAnswer: { value: 42 } });
      expect(grade(exact, { value: 42 })).toMatchObject({ isCorrect: true });
      expect(grade(exact, { value: 42.1 })).toMatchObject({ isCorrect: false });
    });
  });

  describe('fill_blank / short_answer', () => {
    const q = question({
      type: 'fill_blank',
      correctAnswer: { accepted: ['const', 'const keyword'] },
    });

    it('matches any accepted answer', () => {
      expect(grade(q, { text: 'const' })).toMatchObject({ isCorrect: true });
      expect(grade(q, { text: 'const keyword' })).toMatchObject({
        isCorrect: true,
      });
    });

    it('is case-insensitive and trims whitespace by default', () => {
      expect(grade(q, { text: '  CONST  ' })).toMatchObject({
        isCorrect: true,
      });
    });

    it('collapses internal whitespace', () => {
      expect(grade(q, { text: 'const    keyword' })).toMatchObject({
        isCorrect: true,
      });
    });

    it('respects caseSensitive when set', () => {
      const cs = question({
        type: 'fill_blank',
        correctAnswer: { accepted: ['Phnom Penh'], caseSensitive: true },
      });
      expect(grade(cs, { text: 'Phnom Penh' })).toMatchObject({
        isCorrect: true,
      });
      expect(grade(cs, { text: 'phnom penh' })).toMatchObject({
        isCorrect: false,
      });
    });

    it('rejects a wrong answer', () => {
      expect(grade(q, { text: 'let' })).toMatchObject({ isCorrect: false });
    });

    it('flags short_answer with no accepted list for review', () => {
      const manual = question({ type: 'short_answer' });
      expect(grade(manual, { text: 'anything' })).toEqual({
        isCorrect: false,
        pointsAwarded: 0,
        requiresReview: true,
      });
    });
  });

  describe('matching', () => {
    const q = question({
      type: 'matching',
      points: 4,
      correctAnswer: {
        pairs: [
          { left: '2+2', right: '4' },
          { left: '3+3', right: '6' },
        ],
      },
    });

    it('awards points when every pair matches', () => {
      expect(
        grade(q, {
          pairs: [
            { left: '2+2', right: '4' },
            { left: '3+3', right: '6' },
          ],
        }),
      ).toEqual({ isCorrect: true, pointsAwarded: 4, requiresReview: false });
    });

    it('is order-independent', () => {
      expect(
        grade(q, {
          pairs: [
            { left: '3+3', right: '6' },
            { left: '2+2', right: '4' },
          ],
        }),
      ).toMatchObject({ isCorrect: true });
    });

    it('rejects a single wrong mapping', () => {
      expect(
        grade(q, {
          pairs: [
            { left: '2+2', right: '6' },
            { left: '3+3', right: '4' },
          ],
        }),
      ).toMatchObject({ isCorrect: false });
    });

    it('rejects an incomplete answer', () => {
      expect(grade(q, { pairs: [{ left: '2+2', right: '4' }] })).toMatchObject({
        isCorrect: false,
      });
    });
  });

  it('flags an unknown question type for review rather than scoring zero', () => {
    const q = question({ type: 'essay' as never });
    expect(grade(q, { text: 'hi' })).toMatchObject({ requiresReview: true });
  });
});
