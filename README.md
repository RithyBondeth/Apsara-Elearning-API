# KodeKH API — Apsara AI

Backend for **KodeKH / Apsara AI**, a bilingual (English + Khmer) coding-education
platform. It's a **NestJS microservices monorepo**: HTTP gateways talk to backend
services over **RabbitMQ**, with **Drizzle ORM** on **Neon** (serverless Postgres).

## Architecture

```
            HTTP                         RabbitMQ (request/response)
client ──► api-gateway   (:1111) ──┐
client ──► admin-gateway (:2222) ──┤──► auth-service
                                   │──► user-service
                                   │──► course-service
                                   │──► assessment-service
                                   └──► ai-service
                          (all services share Neon Postgres via Drizzle)
```

| App | Type | Responsibility |
|-----|------|----------------|
| `api-gateway` | HTTP (public) | Auth, profile, course reads, enrollment, progress, quizzes, challenges, AI tutor |
| `admin-gateway` | HTTP (admin-only) | Authoring: courses/modules/lessons, quizzes, challenges, users, badges |
| `auth-service` | RMQ consumer | Register, login, tokens, email verification, password reset |
| `user-service` | RMQ consumer | Profile, XP, streaks, badges |
| `course-service` | RMQ consumer | Categories, courses, modules, lessons, enrollment, progress |
| `assessment-service` | RMQ consumer | Quizzes (auto-graded) + coding challenges (Judge0) |
| `ai-service` | RMQ consumer | "Apsara AI" tutor (Anthropic Claude) |
| `subscription-service` | RMQ consumer | Plans, subscriptions, payments (mock gateway) |

Shared libraries: `@app/common` (config, JWT, guards, email, logger, RabbitMQ,
RPC exceptions), `@app/contracts` (message patterns + DTOs), `@app/database`
(Drizzle schemas + Neon connection).

## Prerequisites

- **Node.js** ≥ 20 and **npm**
- **Docker** (for RabbitMQ via `docker-compose.yml`)
- A **Neon** Postgres connection string

## Setup

```bash
npm install
cp .env.example .env   # then fill in values (see "Environment" below)
npm run db:push        # sync the Drizzle schema to your Neon database
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
| Admin | `admin@kodekh.com` | `Admin@123` |
| Student | `student@kodekh.com` | `Student@123` |

…plus a published "Intro to JavaScript" course with a module, two lessons, a
quiz, a coding challenge, and a "First Steps" badge.

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
| **Courses** | reads: `GET /course`, `/course/published`, `/course/:id`, `/course/slug/:slug`, `/course/category/:categoryId` · 🔒admin: `POST/PUT/DELETE /course`, `PATCH /course/:id/publish\|unpublish` |
| **Categories** | `GET /category`, `/category/:id`, `/category/slug/:slug` · 🔒admin mutations |
| **Modules / Lessons** | `GET /module?courseId=`, `/module/:id` · `GET /lesson?moduleId=`, `/lesson/slug/:slug`, `/lesson/:id` |
| **Enrollment** 🔒 | `POST/DELETE /enrollment/:courseId` · `GET /enrollment` · `GET /enrollment/check/:courseId` |
| **Progress** 🔒 | `POST /lesson-progress/lesson/:lessonId` · `GET /lesson-progress` · `POST /lesson-progress/course/:courseId/recalculate` |
| **Quiz** 🔒 | `GET /quiz/lesson/:lessonId` · `POST /quiz/:quizId/start` · `POST /quiz/attempt/:attemptId/submit` · `GET /quiz/attempts` · `GET /quiz/attempt/:id[/answers]` |
| **Challenge** 🔒 | `GET /challenge/lesson/:lessonId` · `GET /challenge/:id[/test-cases]` · `POST /challenge/:id/submit` · `GET /challenge/submissions` · `GET /challenge/submission/:id` |
| **Apsara AI** 🔒 | `POST/GET /ai/conversations` · `GET/DELETE /ai/conversations/:id` · `POST/GET /ai/conversations/:id/messages` · `GET /ai/usage` · `GET /ai/credits` |
| **Subscription** | public: `GET /subscription/plans[/:id]`, `POST /subscription/webhook` · 🔒: `POST /subscription/subscribe`, `GET /subscription/me\|check\|history\|payments`, `DELETE /subscription/:id` |

### admin-gateway (`/admin`, port 2222) — all routes require an **admin** token

| Group | Routes |
|-------|--------|
| **Categories / Courses** | full CRUD under `/categories` and `/courses` |
| **Modules** | `/courses/:courseId/modules` (POST, GET) · `PATCH /…/modules/reorder` · `PATCH/DELETE /…/modules/:id` |
| **Lessons** | `/modules/:moduleId/lessons` (POST, GET, GET `:id`) · `PATCH /…/lessons/reorder` · `PATCH/DELETE /…/lessons/:id` |
| **Users / Badges** | `GET /users`, `GET/DELETE /users/:id` · `/badges` CRUD · `POST /badges/:id/award/:userId` |
| **Plans / Payments** | `/plans` CRUD · `POST /payments` (manual record) |
| **Quiz authoring** | `/lessons/:lessonId/quizzes`, `/quizzes/:id`, `/quizzes/:quizId/questions`, `PATCH /questions/reorder`, `/questions/:id`, `/questions/:questionId/options`, `/options/:id` |
| **Challenge authoring** | `/lessons/:lessonId/challenges`, `/challenges/:id`, `/challenges/:challengeId/test-cases`, `/test-cases/:id` |

## Gamification

Completing a lesson grants **10 XP**; passing a quiz grants **25 XP**; solving a
coding challenge grants its `xpReward` (default **50**) — each on first
completion only. Crossing a badge's `xpRequired` auto-awards it.

## Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | Neon Postgres connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ✅ | token signing |
| `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES` | ✅ | e.g. `15m` / `7d` |
| `BCRYPT_SALT` | — | default `10` |
| `RABBITMQ_URL` + `*_QUEUE` | ✅ | broker URL + one queue name per service |
| `API_GATEWAY_PORT` / `ADMIN_GATEWAY_PORT` | — | default `1111` / `2222` |
| `RESEND_API_KEY` / `EMAIL_FROM` | ✅ | transactional email (verification, reset) |
| `ANTHROPIC_API_KEY` | — | enables the real Claude tutor; **mock replies without it** |
| `ANTHROPIC_MODEL` | — | default `claude-opus-4-8` |
| `JUDGE0_URL` / `JUDGE0_TOKEN` | — | enables real code execution; **mock grading without it** |
| `CORS_ORIGINS` | — | comma-separated allowed origins; **`*` (open) if unset** |
| `WEBHOOK_SECRET` | — | shared secret for the payment webhook (`x-webhook-secret`); check skipped if unset |
| `REDIS_URL` | — | distributed rate limiting across replicas; in-memory if unset |

> **Mock modes:** without `ANTHROPIC_API_KEY` the AI tutor returns canned replies,
> and without `JUDGE0_URL` code grading uses a placeholder (a test passes when its
> expected output appears in the source). Both become real once the key/URL is set.

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
