# Deploying the API on Railway

The API runs on [Railway](https://railway.com) in Singapore: eight Node
services built from one Docker image, plus Postgres, RabbitMQ and Redis. The
web app stays on Vercel and calls the two public gateways.

```
Vercel (web, sin1) ──HTTPS──► api-gateway   (public)  ──┐
                   ──HTTPS──► admin-gateway (public)  ──┤ RabbitMQ (private)
                                                         ├─► auth / user / course /
                                                         │   assessment / ai /
                                                         │   subscription services
                                     Postgres, Redis (private) ◄──┘
```

## How the repo is set up

- **`Dockerfile`** builds every service into one image. Railway uses it
  automatically because it sits at the repo root.
- **`APP`** picks the service a container runs
  (`scripts/start-service.sh`), e.g. `APP=api-gateway`. Each Railway service is
  the same repo with a different `APP`.
- **Migrations** run as `api-gateway`'s pre-deploy command,
  `node scripts/setup-db.mjs`. On an empty database it creates the schema; after
  that it applies pending files from `migrations/`. A failing migration stops
  the deploy.
- **Health:** `GET /api/v1/internal/health/live` and `GET /admin/health/live`
  answer as soon as a gateway is up (used by Railway). `GET
  /api/v1/internal/health` pings all six workers (use it to check the whole
  system).
- Gateways listen on Railway's `PORT`.

## 1. Project and data services

1. Create a project. In **Project → Settings**, set the default region to
   **Southeast Asia (Singapore)** if offered; otherwise set it per service in
   step 3.
2. **+ New → Database → PostgreSQL.**
3. **+ New → Database → Redis.**
4. **RabbitMQ:** **+ New → Template**, search "RabbitMQ" and deploy it. If you'd
   rather not use a template: **+ New → Docker Image** `rabbitmq:3-management`,
   attach a volume at `/var/lib/rabbitmq`, and set `RABBITMQ_DEFAULT_USER` and a
   long random `RABBITMQ_DEFAULT_PASS`. Don't give it a public domain.

Put all three in Singapore (**service → Settings → Deploy → Region**).

## 2. Shared variables

**Project → Settings → Shared Variables.** Generate each secret separately,
e.g. `openssl rand -base64 48`.

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `RABBITMQ_URL` | `amqp://USER:PASS@${{RabbitMQ.RAILWAY_PRIVATE_DOMAIN}}:5672` (or the AMQP URL variable the template exposes — use the **private** one) |
| `AUTH_QUEUE` … `AI_QUEUE` | `auth_queue`, `user_queue`, `course_queue`, `assessment_queue`, `subscription_queue`, `ai_queue` |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACTION_SECRET` | three **different** random values, 32+ chars |
| `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES` | `15m` / `7d` |
| `RESEND_API_KEY` | from Resend (required in production) |
| `EMAIL_FROM` | a sender on a domain verified in Resend |
| `SUPPORT_TO_EMAIL` | where the contact form goes (optional) |
| `CORS_ORIGINS` | `https://elearning.apsara.social` |
| `WEB_APP_URL` | `https://elearning.apsara.social` (must be HTTPS) |
| `INTERNAL_PROXY_SECRET` | random, 32+ chars — the **same** value goes into Vercel |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | tutor (optional; mock replies without a key) |
| `AI_MONTHLY_TOKEN_LIMIT`, `AI_REQUEST_TIMEOUT_MS` | optional; defaults `1000000`, `60000` |
| `JUDGE0_URL`, `JUDGE0_TOKEN` | coding challenges (optional; mock grading without them) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | **required** — subscription-service won't start in production without them. Stripe doesn't serve Cambodia; until a local payment rail exists, use **test-mode** keys (`sk_test_…`, `whsec_…`). |

## 3. The eight services

For each name below: **+ New → GitHub Repo →** this repository, branch
`main`. Then on the service:

- **Settings → Service name:** the name below.
- **Variables:** `APP` = the same name, and add all shared variables
  (**Shared Variable → Add all**, or reference them as `${{shared.NAME}}`).
- **Settings → Deploy:** Region **Singapore**; restart policy **On Failure**.

| Service (`APP`) | Public domain | Healthcheck path | Pre-deploy command |
|---|---|---|---|
| `api-gateway` | yes | `/api/v1/internal/health/live` | `node scripts/setup-db.mjs` |
| `admin-gateway` | yes | `/admin/health/live` | — |
| `auth-service` | no | — | — |
| `user-service` | no | — | — |
| `course-service` | no | — | — |
| `assessment-service` | no | — | — |
| `ai-service` | no | — | — |
| `subscription-service` | no | — | — |

Public domain: **Settings → Networking → Generate Domain** (or add a custom one
such as `api.apsara.social`, then the CNAME Railway shows). Workers need no
domain; they only talk to RabbitMQ and Postgres.

Deploy `api-gateway` first on a new database so its pre-deploy step creates the
schema; the others can follow.

## 4. After the first deploy

- **Check:** `https://<api domain>/api/v1/internal/health` should list all six
  services as `up`.
- **Plans:** the pricing catalog isn't created automatically. From your
  machine, using Postgres's **public** connection URL (Postgres service →
  Connect):

  ```bash
  DATABASE_URL='<public postgres url>' npm run seed:plans
  ```

  Never run `npm run seed` against production — it creates demo accounts (it
  refuses when `NODE_ENV=production`).
- **Course content:** import the Grade 12 courses (Mathematics Advanced and
  Basic, Biology, Chemistry) the same way:

  ```bash
  DATABASE_URL='<public postgres url>' NODE_ENV=production npm run seed:content
  ```

  Add `-- --draft` to import them unpublished and publish from the admin panel
  after a review. It creates no users or reviews, and it's safe to rerun: a
  course whose slug already exists is skipped, never rewritten, so admin edits
  and learners' progress are kept. Each course is imported in one transaction,
  so a failed run leaves nothing half-imported. To change an imported course,
  edit it in the admin panel.
- **First admin:** register on the site, verify the email, then in Postgres
  (Data tab or psql): `UPDATE users SET is_admin = true WHERE email = '…';`
- **Stripe webhook:** endpoint `https://<api domain>/api/v1/internal/subscription/webhook`
  with events `checkout.session.completed`,
  `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`,
  `invoice.paid`, `invoice.payment_failed`, `refund.created`,
  `refund.updated`, `refund.failed`. Put its signing secret in
  `STRIPE_WEBHOOK_SECRET`.

## 5. Point Vercel at the API

In the Vercel project (**Settings → Environment Variables**, Production):

| Variable | Value |
|---|---|
| `API_URL` | `https://<api domain>/api/v1/internal` |
| `NEXT_PUBLIC_API_URL` | same as `API_URL` |
| `ADMIN_API_URL` | `https://<admin domain>/admin` |
| `INTERNAL_PROXY_SECRET` | same value as on Railway |
| `APP_ORIGIN` | `https://elearning.apsara.social` |

Then **Settings → Functions → Function Region → Singapore (sin1)**, so the
web app's server routes sit next to the API, and redeploy.

## Releasing

Every merge to `main` (via the develop → main release PR) redeploys all eight
services from the new commit; `api-gateway`'s pre-deploy step applies any new
migration first.

The workers don't wait for that migration — they deploy in parallel. Keep
migrations additive (new columns nullable or defaulted, nothing dropped in the
same release that stops using it) so the old and new code both run against
either schema for the minute it takes.
