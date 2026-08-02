export async function seedSubscriptionPlans(sql, plans) {
  for (const plan of plans) {
    const [row] = await sql`
      INSERT INTO plans (
        name, slug, description, price, billing_period, ai_credits,
        trial_days, grace_period_days, stripe_price_id
      )
      VALUES (
        ${plan.name}, ${plan.slug}, ${plan.description}, ${plan.price},
        ${plan.billingPeriod}, ${plan.aiCredits}, ${plan.trialDays}, 3,
        ${plan.stripePriceId}
      )
      ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            billing_period = EXCLUDED.billing_period,
            ai_credits = EXCLUDED.ai_credits,
            trial_days = EXCLUDED.trial_days,
            grace_period_days = EXCLUDED.grace_period_days,
            stripe_price_id = EXCLUDED.stripe_price_id,
            updated_at = now()
      RETURNING id`;

    await sql`DELETE FROM plan_entitlements WHERE plan_id = ${row.id}`;
    for (const entitlement of plan.entitlements) {
      await sql`
        INSERT INTO plan_entitlements (plan_id, entitlement)
        VALUES (${row.id}, ${entitlement})`;
    }
  }
}
