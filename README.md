# Apsara Elearning API — Apsara AI

Backend for **Apsara Elearning / Apsara AI**, a bilingual (English + Khmer) e-learning
platform for Cambodia covering **Grade 1–12 across every subject** and **university
courses per major**. It's a **NestJS microservices monorepo**: HTTP gateways talk to
backend services over **RabbitMQ**, with **Drizzle ORM** on **PostgreSQL** (Docker).

## Content structure

Every course is placed on one of two tracks via its `programType`:

```
k12         Grade level (1–12)  ×  Subject   ──►  course ──► module ──► lesson ──► quiz / challenge
university  Faculty ──► Major               ──►  course ──► module ──► lesson ──► quiz / challenge
```

- **`subjects`** — Mathematics, Khmer, English, Physics… (bilingual `name` / `nameKm`).
- **`gradeLevels`** — Grade 1–12, each tagged with a Cambodian education `stage`
  (`primary` 1–6, `lower_secondary` 7–9, `upper_secondary` 10–12).
- **`faculties` → `majors`** — the university track.

Below courses, the module → lesson → assessment stack is shared by both tracks.

## Architecture

```
            HTTP                         RabbitMQ (request/response)
client ──► api-gateway   (:1111) ──┐
client ──► admin-gateway (:2222) ──┤──► auth-service
                                   │──► user-service
                                   │──► course-service
                                   │──► assessment-service
                                   └──► ai-service
                           (all services share PostgreSQL via Drizzle)
```

| App | Type | Responsibility |
|-----|------|----------------|
| `api-gateway` | HTTP (public) | Auth, profile, structure + course reads, enrollment, progress, quizzes, challenges, AI tutor |
| `admin-gateway` | HTTP (admin-only) | Authoring: structure, courses/modules/lessons, quizzes, challenges, users, badges |
| `auth-service` | RMQ consumer | Register, login, tokens, email verification, password reset |
| `user-service` | RMQ consumer | Profile, XP, streaks, badges |
| `course-service` | RMQ consumer | Subjects, grade levels, faculties, majors, courses, modules, lessons, enrollment, progress |
| `assessment-service` | RMQ consumer | Quizzes (auto-graded, multi-type) + coding challenges (Judge0) |
| `ai-service` | RMQ consumer | "Apsara AI" tutor (Anthropic Claude) |
| `subscription-service` | RMQ consumer | Plans, subscriptions, payments (mock gateway) |

Shared libraries: `@app/common` (config, JWT, guards, email, logger, RabbitMQ,
RPC exceptions), `@app/contracts` (message patterns + DTOs), `@app/database`
(Drizzle schemas + PostgreSQL connection).

## Prerequisites

- **Node.js** ≥ 20 and **npm**
- **Docker** (for PostgreSQL + RabbitMQ via `docker-compose.yml`)

## Setup

```bash
npm install
cp .env.example .env   # then fill in values (see "Environment" below)
npm run db:push        # sync the Drizzle schema to your PostgreSQL database
npm run seed           # optional: load demo data
```

## Running

**One command (watch mode):**

```bash
npm run dev            # starts RabbitMQ + all services with hot reload
```

**Manually:**

```bash
npm run docker:up      # RabbitMQ
npm run start:all      # all services (watch)
# or individually: npm run start:dev:api, start:dev:auth, …
```

**Production (built):**

```bash
npm run build:all
npm run start:prod:all # boots dist builds + RabbitMQ, tears down on Ctrl-C
```

### Swagger

- Public API: <http://localhost:1111/api/v1/internal/docs>
- Admin API: <http://localhost:2222/admin/docs>

The full, interactive endpoint list lives in Swagger — the tables below are a map.

## Demo data

`npm run seed` is idempotent and creates:

| Account | Email | Password |
|---------|-------|----------|
| Admin | `admin@apsara-elearning.com` | `Admin@123` |
| Student | `student@apsara-elearning.com` | `Student@123` |

**Reference data** (upserted, safe to re-run): Grades 1–12 with Khmer names, nine
subjects (Mathematics, Khmer, English, Physics, Chemistry, Biology, History,
Geography, IT), and a Faculty of Engineering → Computer Science major.

**Demo content**: a published "Intro to JavaScript" course placed on the **k12**
track at **Grade 10 / Information Technology**, with a module, two lessons, a quiz
(one multiple-choice + one auto-graded `numeric` question), a coding challenge, and
a "First Steps" badge.

## Auth & roles

- Stateless **JWT** access tokens (+ refresh tokens). The access token carries `isAdmin`.
- `JwtAuthGuard` — any authenticated user (`401` if missing/invalid).
- `AdminGuard` — requires `isAdmin` (`401` no token, `403` non-admin). Applied
  globally on the admin-gateway and on public-gateway course/category mutations.
- Send `Authorization: Bearer <accessToken>` on protected routes (marked 🔒 below).

## Endpoints

### api-gateway (`/api/v1/internal`, port 1111)

| Group | Routes |
|-------|--------|
| **Auth** | `POST /auth/register` · `login` · `refresh` · `verify-email` · `resend-verification` · `forgot-password` · `reset-password` · 🔒`logout` · 🔒`change-password` |
| **User** 🔒 | `GET/PATCH /user/me` · `PATCH /user/me/avatar` · `GET /user/me/badges` |
| **Courses** | reads: `GET /course`, `/course/published`, `/course/:id`, `/course/slug/:slug`, `/course/subject/:subjectId`, `/course/grade/:gradeLevelId`, `/course/major/:majorId` · 🔒admin: `POST/PUT/DELETE /course`, `PATCH /course/:id/publish\|unpublish` |
| **Subjects** | `GET /subject`, `/subject/:id`, `/subject/slug/:slug` · 🔒admin mutations |
| **Structure** (read-only) | `GET /grade-level[/:id]` · `GET /faculty[/:id]`, `/faculty/slug/:slug` · `GET /major[?facultyId=][/:id]`, `/major/slug/:slug` |
| **Modules / Lessons** | `GET /module?courseId=`, `/module/:id` · `GET /lesson?moduleId=`, `/lesson/slug/:slug`, `/lesson/:id` |
| **Enrollment** 🔒 | `POST/DELETE /enrollment/:courseId` · `GET /enrollment` · `GET /enrollment/check/:courseId` |
| **Progress** 🔒 | `POST /lesson-progress/lesson/:lessonId` · `GET /lesson-progress` · `POST /lesson-progress/course/:courseId/recalculate` |
| **Quiz** 🔒 | `GET /quiz/lesson/:lessonId` · `POST /quiz/:quizId/start` · `POST /quiz/attempt/:attemptId/submit` · `GET /quiz/attempts` · `GET /quiz/attempt/:id[/answers]` |
| **Challenge** 🔒 | `GET /challenge/lesson/:lessonId` · `GET /challenge/:id[/test-cases]` · `POST /challenge/:id/submit` · `GET /challenge/submissions` · `GET /challenge/submission/:id` |
| **Apsara AI** 🔒 | `POST/GET /ai/conversations` · `GET/DELETE /ai/conversations/:id` · `POST/GET /ai/conversations/:id/messages` · `GET /ai/usage` · `GET /ai/credits` |
| **Subscription** | public: `GET /subscription/plans[/:id]`, `POST /subscription/webhook` · 🔒: `POST /subscription/checkout`, `POST /subscription/billing-portal`, `GET /subscription/me\|check\|history\|payments\|entitlements`, `DELETE /subscription/:id` |

### admin-gateway (`/admin`, port 2222) — all routes require an **admin** token

| Group | Routes |
|-------|--------|
| **Structure** | full CRUD under `/subjects`, `/grade-levels`, `/faculties`, `/majors` (`/majors?facultyId=` to filter) |
| **Courses** | full CRUD under `/courses` |
| **Modules** | `/courses/:courseId/modules` (POST, GET) · `PATCH /…/modules/reorder` · `PATCH/DELETE /…/modules/:id` |
| **Lessons** | `/modules/:moduleId/lessons` (POST, GET, GET `:id`) · `PATCH /…/lessons/reorder` · `PATCH/DELETE /…/lessons/:id` |
| **Users / Badges** | `GET /users`, `GET/DELETE /users/:id` · `/badges` CRUD · `POST /badges/:id/award/:userId` |
| **Plans / Payments** | `/plans` CRUD (including entitlement, trial, and grace settings) · `POST /payments` (manual record) |
| **Entitlements** | `GET /entitlements/users/:userId` · `GET/POST /entitlements/users/:userId/grants` · `DELETE /entitlements/grants/:id` |
| **Quiz authoring** | `/lessons/:lessonId/quizzes`, `/quizzes/:id`, `/quizzes/:quizId/questions`, `PATCH /questions/reorder`, `/questions/:id`, `/questions/:questionId/options`, `/options/:id` |
| **Challenge authoring** | `/lessons/:lessonId/challenges`, `/challenges/:id`, `/challenges/:challengeId/test-cases`, `/test-cases/:id` |

## Exercises

A quiz holds typed questions, each auto-graded by its own strategy. `points`
weights a question (default `1`); the attempt score is
`round(earnedPoints / totalPoints * 100)` and passes at **70%**.

| `type` | Student sends | `correctAnswer` spec | Graded by |
|--------|---------------|----------------------|-----------|
| `multiple_choice` | `selectedOptionId` | — (uses `quiz_options.isCorrect`) | option match |
| `true_false` | `{ value: true }` | `{ value: true }` *(or two options)* | boolean match |
| `fill_blank` | `{ text: "const" }` | `{ accepted: ["const"], caseSensitive?: false }` | normalized text match |
| `short_answer` | `{ text: "…" }` | `{ accepted: [...] }` — omit to require manual review | normalized text match |
| `numeric` | `{ value: 1.5 }` | `{ value: 1.5, tolerance?: 0.01 }` | absolute tolerance |
| `matching` | `{ pairs: [{left,right}] }` | `{ pairs: [{left,right}] }` | all pairs, order-independent |

Text matching trims, collapses internal whitespace, and is case-insensitive
unless `caseSensitive` is set. A question that cannot be auto-graded (e.g. a
`short_answer` with no `accepted` list) is stored with `requiresReview = true`
and scores 0 pending a human — it is never silently marked wrong.

Answer keys never leave the server: `POST /quiz/:quizId/start` strips
`isCorrect` and `correctAnswer`, and returns matching questions as a `prompt`
of left items plus a **shuffled** pool of right items.

Coding challenges (Judge0) remain a separate, CS-only exercise type.

## Gamification

Completing a lesson grants **10 XP**; passing a quiz grants its `xpReward`
(default **25**); solving a coding challenge grants its `xpReward` (default
**50**) — each on first completion only. Crossing a badge's `xpRequired`
auto-awards it.

## Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `JWT_ACTION_SECRET` | ✅ | distinct token-signing secrets of at least 32 characters |
| `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES` | ✅ | e.g. `15m` / `7d` |
| `JWT_ISSUER` / `JWT_AUDIENCE` | — | token issuer/audience constraints |
| `BCRYPT_SALT` | — | default `12` |
| `RABBITMQ_URL` + `*_QUEUE` | ✅ | broker URL + one queue name per service |
| `API_GATEWAY_PORT` / `ADMIN_GATEWAY_PORT` | — | default `1111` / `2222` |
| `RESEND_API_KEY` / `EMAIL_FROM` | ✅ | transactional email (verification, reset) |
| `AI_PROVIDER` | — | default provider: `anthropic`, `openai`, `deepseek`, or `gemini`; default `anthropic` |
| `AI_MODEL` / `AI_MAX_TOKENS` | — | optional global model override / max output tokens |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | — | enables Claude; **mock replies without key** |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | — | enables OpenAI-compatible GPT chat |
| `DEEPSEEK_API_KEY` / `DEEPSEEK_MODEL` | — | enables DeepSeek chat |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | — | enables Gemini chat |
| `JUDGE0_URL` / `JUDGE0_TOKEN` | — | enables real code execution; **mock grading without it** |
| `CORS_ORIGINS` | production | comma-separated exact allowed origins; required in production |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | subscription production | Stripe server key and endpoint signing secret; never expose these to the browser |
| `WEB_APP_URL` | subscription production | HTTPS web-client origin used for Checkout and portal return URLs |
| `REDIS_URL` | — | distributed rate limiting across replicas; in-memory if unset |

> **Mock modes:** without the selected provider API key the AI tutor returns canned replies,
> and without `JUDGE0_URL` code grading uses a placeholder (a test passes when its
> expected output appears in the source). Both become real once the key/URL is set.

## Named entitlements

Access is resolved server-side using `courses:premium`, `ai:tutor`, and
`certificates`. Plans map to any combination of these capabilities. An active
paid period, an active Stripe trial, or a configured failed-payment grace period
activates the plan's capabilities; expiration removes them automatically.

Administrators can create time-bounded `allow` or `deny` grants. An active deny
overrides both administrative allows and plan access, then an allow overrides a
plan decision. Revoking a grant preserves its audit record. The browser hydrates
`GET /subscription/entitlements` into a non-persisted Zustand store for UI
decisions only; course and AI services always enforce access independently.

Set a course's `requiredEntitlement` to `courses:premium` (the legacy
`requiresSubscription` field is retained for compatibility). Creating a new AI
conversation or sending an AI message requires `ai:tutor`.

Apply `migrations/20260728_add_named_entitlements.sql` after the Stripe webhook
migrations. It maps every existing plan to all three capabilities to preserve
current behavior; edit each plan afterward to narrow its capability set.

## Course authorization

Published courses are public by default. Set `requiredEntitlement` on a course
to require the named capability for its lesson content, quizzes,
challenges, enrollment, and progress updates. Public course/module endpoints
never expose unpublished content, and premium lesson lists return metadata with
`locked: true` while omitting lesson content and video URLs.

Apply `migrations/20260728_add_course_entitlements.sql` before deploying this
feature. Existing courses remain free because the new column defaults to false.

## Stripe billing

Apply `migrations/20260728_add_stripe_billing.sql`, then set each paid plan's
`stripePriceId` to its recurring Stripe Price ID. The web client creates hosted
Checkout Sessions through `POST /subscription/checkout`; it never activates a
subscription itself. Access is provisioned only after a signed Stripe webhook
updates the local subscription.

Configure a Stripe webhook endpoint at
`POST /api/v1/internal/subscription/webhook` for these events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `refund.created`
- `refund.updated`
- `refund.failed`

Webhook event IDs and invoice IDs are stored uniquely. Each event moves through
`processing`, `processed`, or `failed`; failed and stale-processing deliveries
can be claimed by a retry, while concurrent duplicates receive a non-2xx
response so Stripe retries them. Refund IDs are also unique, partial and full
refund totals are reconciled to the original payment, and a full refund of the
current paid period revokes access. Cancellation is scheduled in Stripe at the
end of the paid billing period, and the customer portal handles payment-method
and invoice management.

Apply `migrations/20260728_harden_stripe_webhooks.sql` after the base Stripe
billing migration.

## Database

Schema lives in `libs/database/src/schemas/**`. The dev workflow is **`db:push`**
(`npm run db:push`) — `drizzle/` holds a generated migration baseline
(`npm run db:generate` / `db:migrate` for migration-based flows). On a database
created via `db:push`, run **`npm run db:baseline`** once to mark that baseline
as already-applied so `db:migrate` becomes truthful (a no-op for the baseline,
applying only future migrations). `npm run db:studio` opens Drizzle Studio.

## Tooling

```bash
npm run build:all   # build every app
npm run lint        # eslint --fix
npm run test        # jest
```
