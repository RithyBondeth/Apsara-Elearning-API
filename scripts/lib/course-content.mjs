// Course content shared by the dev seed (scripts/seed.mjs) and the
// production import (scripts/seed-content.mjs): the K–12 reference data the
// courses are placed on, and the writer for a full authored course.
import { MATH_GRADE_12_ADVANCED } from '../content/math-grade-12-advanced.mjs';
import { MATH_GRADE_12_BASIC } from '../content/math-grade-12-basic.mjs';
import { BIOLOGY_GRADE_12 } from '../content/biology-grade-12.mjs';
import { CHEMISTRY_GRADE_12 } from '../content/chemistry-grade-12.mjs';

/** The authored Grade 12 curricula in scripts/content/, in catalog order. */
export const GRADE_12_CURRICULA = [
  MATH_GRADE_12_ADVANCED,
  MATH_GRADE_12_BASIC,
  BIOLOGY_GRADE_12,
  CHEMISTRY_GRADE_12,
];

// Cambodia's K–12 structure: primary 1–6, lower secondary 7–9, upper secondary 10–12.
const KHMER_NUMERALS = [
  '១',
  '២',
  '៣',
  '៤',
  '៥',
  '៦',
  '៧',
  '៨',
  '៩',
  '១០',
  '១១',
  '១២',
];
const stageFor = (grade) =>
  grade <= 6 ? 'primary' : grade <= 9 ? 'lower_secondary' : 'upper_secondary';

export const SUBJECTS = [
  ['Mathematics', 'គណិតវិទ្យា', 'mathematics', 'calculator'],
  ['Khmer Language', 'ភាសាខ្មែរ', 'khmer-language', 'book-open'],
  ['English', 'ភាសាអង់គ្លេស', 'english', 'languages'],
  ['Physics', 'រូបវិទ្យា', 'physics', 'atom'],
  ['Chemistry', 'គីមីវិទ្យា', 'chemistry', 'flask-conical'],
  ['Biology', 'ជីវវិទ្យា', 'biology', 'leaf'],
  ['History', 'ប្រវត្តិវិទ្យា', 'history', 'landmark'],
  ['Geography', 'ភូមិវិទ្យា', 'geography', 'globe'],
  ['Information Technology', 'ព័ត៌មានវិទ្យា', 'information-technology', 'code'],
];

export async function seedGradeLevels(sql) {
  const ids = {};
  for (let grade = 1; grade <= 12; grade++) {
    const [row] = await sql`
      INSERT INTO grade_levels (stage, grade, name, name_km, "order")
      VALUES (${stageFor(grade)}, ${grade}, ${'Grade ' + grade},
              ${'ថ្នាក់ទី' + KHMER_NUMERALS[grade - 1]}, ${grade})
      ON CONFLICT (grade) DO UPDATE
        SET stage = EXCLUDED.stage, name = EXCLUDED.name,
            name_km = EXCLUDED.name_km, "order" = EXCLUDED."order",
            updated_at = now()
      RETURNING id`;
    ids[grade] = row.id;
  }
  return ids;
}

export async function seedSubjects(sql) {
  const ids = {};
  for (const [name, nameKm, slug, icon] of SUBJECTS) {
    const [row] = await sql`
      INSERT INTO subjects (name, name_km, slug, icon)
      VALUES (${name}, ${nameKm}, ${slug}, ${icon})
      ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name, name_km = EXCLUDED.name_km,
            icon = EXCLUDED.icon, updated_at = now()
      RETURNING id`;
    ids[slug] = row.id;
  }
  return ids;
}

/** A full authored course: many modules, each with lessons, each lesson
 *  optionally carrying a quiz. Takes the curriculum objects in scripts/content/.
 *  Returns counts so the summary can report what actually landed.
 *
 *  `sql` may be a transaction (`sql.begin`), so a course lands whole or not
 *  at all. `published: false` imports it as a draft for review. */
export async function createFullCourse(
  sql,
  curriculum,
  { subjectId, gradeLevelId, published = true },
) {
  const [course] = await sql`
    INSERT INTO courses (program_type, subject_id, grade_level_id,
                         title, title_km, slug, description, description_km,
                         difficulty, estimated_hours, published)
    VALUES (${curriculum.programType}, ${subjectId ?? null}, ${gradeLevelId ?? null},
            ${curriculum.title}, ${curriculum.title}, ${curriculum.slug},
            ${curriculum.description}, ${curriculum.description},
            ${curriculum.difficulty}, ${curriculum.estimatedHours}, ${published})
    RETURNING id`;

  const counts = { modules: 0, lessons: 0, quizzes: 0, questions: 0 };

  let moduleOrder = 0;
  for (const mod of curriculum.modules) {
    const [moduleRow] = await sql`
      INSERT INTO modules (course_id, title, description, "order")
      VALUES (${course.id}, ${mod.title}, ${mod.description ?? null}, ${moduleOrder})
      RETURNING id`;
    counts.modules++;
    moduleOrder++;

    let lessonOrder = 0;
    for (const lesson of mod.lessons) {
      const [lessonRow] = await sql`
        INSERT INTO lessons (module_id, title, slug, type, content, "order", estimated_minutes)
        VALUES (${moduleRow.id}, ${lesson.title}, ${lesson.slug}, 'article',
                ${lesson.content}, ${lessonOrder}, ${lesson.minutes})
        RETURNING id`;
      counts.lessons++;
      lessonOrder++;

      if (!lesson.quiz) continue;

      const [quizRow] = await sql`
        INSERT INTO quizzes (lesson_id, title, description, xp_reward)
        VALUES (${lessonRow.id}, ${lesson.quiz.title},
                ${lesson.quiz.description ?? null}, ${lesson.quiz.xpReward ?? 25})
        RETURNING id`;
      counts.quizzes++;

      const questions = lesson.quiz.questions;

      let questionOrder = 0;
      for (const q of questions) {
        const [questionRow] = await sql`
          INSERT INTO quiz_questions (quiz_id, type, question, correct_answer,
                                      explanation, points, "order")
          VALUES (${quizRow.id}, ${q.type}, ${q.question},
                  ${q.correctAnswer ? JSON.stringify(q.correctAnswer) : null}::jsonb,
                  ${q.explanation ?? null}, ${q.points ?? 1}, ${questionOrder})
          RETURNING id`;
        counts.questions++;
        questionOrder++;

        // multiple_choice keeps its answer key on quiz_options, not correct_answer.
        for (const [answer, isCorrect] of q.options ?? []) {
          await sql`
            INSERT INTO quiz_options (question_id, answer, is_correct)
            VALUES (${questionRow.id}, ${answer}, ${isCorrect})`;
        }
      }
    }
  }

  return counts;
}
