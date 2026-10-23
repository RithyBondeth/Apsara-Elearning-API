// Imports the authored Grade 12 courses (scripts/content/) into any database,
// production included. Run with: npm run seed:content [-- --draft]
//
// Unlike `npm run seed`, this is safe on a live site:
// - It creates no users, reviews, badges or demo courses.
// - It is insert-only. A course whose slug already exists is skipped, never
//   rewritten: replacing it would cascade-delete every learner's enrollment,
//   progress, quiz attempts and certificate for that course, and would undo
//   any edits made in the admin panel.
// - Each course is written in one transaction, so a failure part-way leaves
//   no half-imported course behind (which a rerun would then skip).
// - Grade levels and subjects are upserted, since courses are placed on them.
//
// --draft imports new courses unpublished, for review in the admin panel.
import 'dotenv/config';
import postgres from 'postgres';
import {
  GRADE_12_CURRICULA,
  createFullCourse,
  seedGradeLevels,
  seedSubjects,
} from './lib/course-content.mjs';
import { FRESH_DATABASE_HINT, hasBaseSchema } from './lib/migrations.mjs';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const published = !process.argv.includes('--draft');
const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

async function main() {
  if (!(await hasBaseSchema(sql))) {
    throw new Error(FRESH_DATABASE_HINT);
  }

  const gradeIds = await seedGradeLevels(sql);
  const subjectIds = await seedSubjects(sql);
  console.log('Grade levels and subjects are up to date.');

  let imported = 0;
  for (const curriculum of GRADE_12_CURRICULA) {
    const [existing] = await sql`
      SELECT id FROM courses WHERE slug = ${curriculum.slug} LIMIT 1`;
    if (existing) {
      console.log(`  - ${curriculum.slug}: already exists, left unchanged`);
      continue;
    }

    const subjectId = subjectIds[curriculum.subjectSlug];
    const gradeLevelId = gradeIds[curriculum.grade];
    if (!subjectId || !gradeLevelId) {
      throw new Error(
        `${curriculum.slug}: unknown subject "${curriculum.subjectSlug}" or grade ${curriculum.grade}`,
      );
    }

    const counts = await sql.begin((tx) =>
      createFullCourse(tx, curriculum, { subjectId, gradeLevelId, published }),
    );
    imported++;
    console.log(
      `  ✓ ${curriculum.slug}: ${counts.modules} modules, ${counts.lessons} lessons, ` +
        `${counts.quizzes} quizzes, ${counts.questions} questions` +
        (published ? '' : ' (draft)'),
    );
  }

  console.log(
    `\n${imported} course(s) imported, ${GRADE_12_CURRICULA.length - imported} already present.`,
  );
}

main()
  .catch((err) => {
    console.error('Content import failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => sql.end({ timeout: 5 }));
