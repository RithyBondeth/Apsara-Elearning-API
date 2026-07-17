// Seeds reference data + demo content for local development.
// Idempotent: reference data is upserted, demo rows are cleared and re-inserted.
// Run with: npm run seed
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

const sql = neon(process.env.DATABASE_URL);
const saltRounds = parseInt(process.env.BCRYPT_SALT ?? '10', 10);

const ADMIN = { email: 'admin@apsara-elearning.com', password: 'Admin@123' };
const STUDENT = {
  email: 'student@apsara-elearning.com',
  password: 'Student@123',
};
const COURSE_SLUG = 'intro-to-javascript';
const BADGE_NAME = 'First Steps';

// Cambodia's K–12 structure: primary 1–6, lower secondary 7–9, upper secondary 10–12.
const KHMER_NUMERALS = ['១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩', '១០', '១១', '១២'];
const stageFor = (grade) =>
  grade <= 6 ? 'primary' : grade <= 9 ? 'lower_secondary' : 'upper_secondary';

const SUBJECTS = [
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

async function clearDemo() {
  // Courses cascade to modules → lessons → quizzes/questions/options and
  // challenges/test-cases. Delete those roots, then standalone rows.
  await sql`DELETE FROM courses WHERE slug = ${COURSE_SLUG}`;
  await sql`DELETE FROM badges WHERE name = ${BADGE_NAME}`;
  await sql`DELETE FROM users WHERE email IN (${ADMIN.email}, ${STUDENT.email})`;
}

async function seedGradeLevels() {
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

async function seedSubjects() {
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

async function seedUniversity() {
  const [faculty] = await sql`
    INSERT INTO faculties (name, name_km, slug, description, icon)
    VALUES ('Faculty of Engineering', 'មហាវិទ្យាល័យវិស្វកម្ម', 'engineering',
            'Engineering disciplines and programs', 'cpu')
    ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name, name_km = EXCLUDED.name_km, updated_at = now()
    RETURNING id`;
  const [major] = await sql`
    INSERT INTO majors (faculty_id, name, name_km, slug, description)
    VALUES (${faculty.id}, 'Computer Science', 'វិទ្យាសាស្ត្រកុំព្យូទ័រ',
            'computer-science', 'Software, algorithms and systems')
    ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name, faculty_id = EXCLUDED.faculty_id, updated_at = now()
    RETURNING id`;
  return { facultyId: faculty.id, majorId: major.id };
}

async function seed() {
  console.log('Seeding reference data…');
  const gradeIds = await seedGradeLevels();
  const subjectIds = await seedSubjects();
  const { majorId } = await seedUniversity();
  console.log(
    `  ${Object.keys(gradeIds).length} grade levels, ${Object.keys(subjectIds).length} subjects, 1 faculty + 1 major.`,
  );

  console.log('Clearing previous demo data…');
  await clearDemo();

  console.log('Creating users…');
  const adminHash = await bcrypt.hash(ADMIN.password, saltRounds);
  const studentHash = await bcrypt.hash(STUDENT.password, saltRounds);
  await sql`INSERT INTO users (email, password, first_name, last_name, is_email_verified, is_admin)
            VALUES (${ADMIN.email}, ${adminHash}, 'Admin', 'User', true, true)`;
  await sql`INSERT INTO users (email, password, first_name, last_name, is_email_verified, is_admin)
            VALUES (${STUDENT.email}, ${studentHash}, 'Demo', 'Student', true, false)`;

  console.log('Creating demo course…');
  const [course] = await sql`
    INSERT INTO courses (program_type, subject_id, grade_level_id, title, title_km, slug,
                         description, difficulty, estimated_hours, published)
    VALUES ('k12', ${subjectIds['information-technology']}, ${gradeIds[10]},
            'Intro to JavaScript', 'ការណែនាំអំពី JavaScript', ${COURSE_SLUG},
            'JavaScript fundamentals for absolute beginners', 'beginner', 8, true)
    RETURNING id`;

  console.log('Creating module + lessons…');
  const [module] = await sql`
    INSERT INTO modules (course_id, title, description, "order")
    VALUES (${course.id}, 'Getting Started', 'Setup and the basics', 0)
    RETURNING id`;
  const [lesson1] = await sql`
    INSERT INTO lessons (module_id, title, slug, type, content, "order", estimated_minutes)
    VALUES (${module.id}, 'Variables and Types', 'variables-and-types', 'article',
            '# Variables\n\nUse const and let to declare variables…', 0, 15)
    RETURNING id`;
  const [lesson2] = await sql`
    INSERT INTO lessons (module_id, title, slug, type, content, "order", estimated_minutes)
    VALUES (${module.id}, 'Functions', 'functions', 'article',
            '# Functions\n\nFunctions are reusable blocks…', 1, 20)
    RETURNING id`;

  console.log('Creating quiz (multiple-choice + numeric)…');
  const [quiz] = await sql`
    INSERT INTO quizzes (lesson_id, title, description, xp_reward)
    VALUES (${lesson1.id}, 'Variables Quiz', 'Check your understanding of variables', 25)
    RETURNING id`;
  const [q1] = await sql`
    INSERT INTO quiz_questions (quiz_id, type, question, explanation, points, "order")
    VALUES (${quiz.id}, 'multiple_choice', 'Which keyword declares a constant in JS?',
            'const creates a read-only binding.', 1, 0)
    RETURNING id`;
  await sql`INSERT INTO quiz_options (question_id, answer, is_correct) VALUES
    (${q1.id}, 'const', true), (${q1.id}, 'var', false), (${q1.id}, 'let', false)`;
  // Exercises the generalized grader: auto-graded with a numeric tolerance.
  await sql`
    INSERT INTO quiz_questions (quiz_id, type, question, correct_answer, explanation, points, "order")
    VALUES (${quiz.id}, 'numeric', 'What does 12 / 8 evaluate to in JavaScript?',
            ${JSON.stringify({ value: 1.5, tolerance: 0.01 })}::jsonb,
            'JavaScript division returns a float, not an integer.', 2, 1)`;

  console.log('Creating coding challenge…');
  const [challenge] = await sql`
    INSERT INTO coding_challenges (lesson_id, title, description, starter_code, solution_code, xp_reward)
    VALUES (${lesson2.id}, 'Sum two numbers',
            'Read two integers from stdin and print their sum.',
            'const [a, b] = input.split(" ").map(Number);\n// print a + b',
            'const [a, b] = input.split(" ").map(Number);\nconsole.log(a + b);', 50)
    RETURNING id`;
  await sql`INSERT INTO challenge_test_cases (challenge_id, input, expected_output, is_hidden, "order") VALUES
    (${challenge.id}, '2 3', '5', false, 0),
    (${challenge.id}, '10 20', '30', true, 1)`;

  console.log('Creating badge…');
  await sql`INSERT INTO badges (name, description, icon, xp_required)
            VALUES (${BADGE_NAME}, 'Earned your first 10 XP', 'trophy', 10)`;

  console.log('\n✓ Seed complete.');
  console.log(`  Admin:   ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`  Student: ${STUDENT.email} / ${STUDENT.password}`);
  console.log(`  Reference: Grades 1–12, ${SUBJECTS.length} subjects, Engineering → Computer Science.`);
  console.log(`  Course:  "Intro to JavaScript" — K–12, Grade 10, Information Technology (published).`);
  console.log(`           Quiz (multiple-choice + numeric) and a coding challenge.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
