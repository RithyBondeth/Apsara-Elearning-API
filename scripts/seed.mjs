// Seeds demo data for local development. Idempotent: clears prior demo rows,
// then re-inserts. Run with: npm run seed
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

const sql = neon(process.env.DATABASE_URL);
const saltRounds = parseInt(process.env.BCRYPT_SALT ?? '10', 10);

const ADMIN = { email: 'admin@apsara-elearning.com', password: 'Admin@123' };
const STUDENT = { email: 'student@apsara-elearning.com', password: 'Student@123' };
const COURSE_SLUG = 'intro-to-javascript';
const CATEGORY_SLUG = 'web-development';
const BADGE_NAME = 'First Steps';

async function clear() {
  // Courses cascade to modules → lessons → quizzes/questions/options and
  // challenges/test-cases. Delete those roots, then standalone rows.
  await sql`DELETE FROM courses WHERE slug = ${COURSE_SLUG}`;
  await sql`DELETE FROM categories WHERE slug = ${CATEGORY_SLUG}`;
  await sql`DELETE FROM badges WHERE name = ${BADGE_NAME}`;
  await sql`DELETE FROM users WHERE email IN (${ADMIN.email}, ${STUDENT.email})`;
}

async function seed() {
  console.log('Clearing previous demo data…');
  await clear();

  console.log('Creating users…');
  const adminHash = await bcrypt.hash(ADMIN.password, saltRounds);
  const studentHash = await bcrypt.hash(STUDENT.password, saltRounds);
  await sql`INSERT INTO users (email, password, first_name, last_name, is_email_verified, is_admin)
            VALUES (${ADMIN.email}, ${adminHash}, 'Admin', 'User', true, true)`;
  await sql`INSERT INTO users (email, password, first_name, last_name, is_email_verified, is_admin)
            VALUES (${STUDENT.email}, ${studentHash}, 'Demo', 'Student', true, false)`;

  console.log('Creating category + course…');
  const [category] = await sql`
    INSERT INTO categories (name, slug, description, icon)
    VALUES ('Web Development', ${CATEGORY_SLUG}, 'Learn to build for the web', 'code')
    RETURNING id`;
  const [course] = await sql`
    INSERT INTO courses (category_id, title, slug, description, difficulty, estimated_hours, published)
    VALUES (${category.id}, 'Intro to JavaScript', ${COURSE_SLUG},
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

  console.log('Creating quiz…');
  const [quiz] = await sql`
    INSERT INTO quizzes (lesson_id, title, description)
    VALUES (${lesson1.id}, 'Variables Quiz', 'Check your understanding of variables')
    RETURNING id`;
  const [q1] = await sql`
    INSERT INTO quiz_questions (quiz_id, question, explanation, "order")
    VALUES (${quiz.id}, 'Which keyword declares a constant in JS?', 'const creates a read-only binding.', 0)
    RETURNING id`;
  await sql`INSERT INTO quiz_options (question_id, answer, is_correct) VALUES
    (${q1.id}, 'const', true), (${q1.id}, 'var', false), (${q1.id}, 'let', false)`;

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
  console.log(`  Course:  "Intro to JavaScript" (published) with a quiz + a coding challenge.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
