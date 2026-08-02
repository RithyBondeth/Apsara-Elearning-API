import 'dotenv/config';
import postgres from 'postgres';
import { SUBSCRIPTION_PLANS } from './content/subscription-plans.mjs';
import { seedSubscriptionPlans } from './lib/seed-subscription-plans.mjs';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required to seed plans');

const sql = postgres(databaseUrl, { max: 1 });

seedSubscriptionPlans(sql, SUBSCRIPTION_PLANS)
  .then(() => console.log(`Seeded ${SUBSCRIPTION_PLANS.length} plans.`))
  .then(() => sql.end())
  .catch(async (error) => {
    console.error('Plan seed failed:', error.message);
    await sql.end({ timeout: 1 });
    process.exitCode = 1;
  });
