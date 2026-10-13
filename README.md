<div align="center">

# Apsara Elearning — API

**The microservices backend for Apsara Elearning, a bilingual AI-powered learning platform for Cambodian students.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-D97757?style=for-the-badge&logo=anthropic&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)

</div>

---

## Overview

Apsara Elearning (Apsara AI) is a bilingual English and Khmer e-learning platform for Cambodia. It covers **Grades 1–12 across every subject** and **university courses for each major**, and includes a Khmer-speaking AI tutor.

This repository is the backend. It is a **NestJS microservices monorepo**: two HTTP gateways talk to backend services over **RabbitMQ**, and all services share **PostgreSQL** through **Drizzle ORM**.

## Features

- **Two learning tracks.** The K-12 track runs grade level × subject, and the university track runs faculty → major. Both lead into courses → modules → lessons → quizzes and challenges.
- **Auto-graded quizzes** with six question types: multiple choice, true/false, fill-in-the-blank, short answer, numeric, and matching. Answer keys never leave the server.
- **Coding challenges** executed and graded through Judge0.
- **Apsara AI tutor,** with switchable providers (Anthropic Claude, OpenAI, DeepSeek, and Gemini), lesson-aware context, and usage and credit tracking.
- **Gamification:** XP, streaks, auto-awarded badges, and a privacy-safe leaderboard.
- **Enrollment and progress tracking,** certificates, course ratings and reviews, and in-app notifications.
- **Subscriptions:** plans, Stripe Checkout, billing portal, webhooks, and entitlements.
- **Security:** JWT access, refresh and action tokens, an admin guard, email verification, and password reset.
- **Admin gateway** for authoring the structure, courses, lessons, quizzes, challenges, users, badges, and plans.
- **Swagger docs** for both gateways.

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | NestJS (monorepo with microservices) |
| Language | TypeScript |
| Messaging | RabbitMQ |
| Database | PostgreSQL, Drizzle ORM |
| AI | Anthropic Claude, OpenAI, DeepSeek, Google Gemini |
| Payments | Stripe |
| Code execution | Judge0 |
| Email | Resend |
| Infrastructure | Docker Compose, GitHub Actions |

## Architecture

```text
            HTTP                         RabbitMQ (request/response)
client ──► api-gateway   (:1111) ──┐
client ──► admin-gateway (:2222) ──┤──► auth-service
                                   │──► user-service
                                   │──► course-service
                                   │──► assessment-service
                                   │──► ai-service
                                   └──► subscription-service
                          (all services share PostgreSQL via Drizzle)
```

| App | Responsibility |
| --- | --- |
| `api-gateway` | Public HTTP API: auth, profile, courses, enrollment, progress, quizzes, challenges, AI tutor |
| `admin-gateway` | Admin-only authoring API |
| `auth-service` | Registration, login, tokens, email verification, password reset |
| `user-service` | Profile, XP, streaks, badges, leaderboard, notifications |
| `course-service` | Subjects, grade levels, faculties, majors, courses, modules, lessons, enrollment |
| `assessment-service` | Quizzes and Judge0 coding challenges |
| `ai-service` | Apsara AI tutor |
| `subscription-service` | Plans, Stripe Checkout, webhooks, payments, entitlements |

## Getting Started

### Prerequisites

- Node.js 20 or newer, and npm
- Docker (for PostgreSQL and RabbitMQ)

### Installation

```bash
git clone https://github.com/RithyBondeth/Apsara-Elearning-API.git
cd Apsara-Elearning-API
npm install
cp .env.example .env     # set the three JWT_*_SECRET values (32+ characters each)
npm run docker:up        # PostgreSQL + RabbitMQ
npm run db:setup         # create the schema or apply migrations
npm run seed             # optional demo data (local only)
npm run dev              # all services in watch mode
```

Locally, only the JWT secrets need real values. Without keys, emails are printed to the logs, the AI tutor and code grading run in mock mode, and checkout is disabled.

### API Documentation

- Public API: [http://localhost:1111/api/v1/internal/docs](http://localhost:1111/api/v1/internal/docs)
- Admin API: [http://localhost:2222/admin/docs](http://localhost:2222/admin/docs)

### Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACTION_SECRET` | Token-signing secrets |
| `RABBITMQ_URL` and `*_QUEUE` | Broker URL and one queue per service |
| `AI_PROVIDER`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY` | AI tutor providers |
| `JUDGE0_URL`, `JUDGE0_TOKEN` | Code execution |
| `RESEND_API_KEY`, `EMAIL_FROM` | Transactional email |
| `STRIPE_*` | Subscription billing |

See [`.env.example`](.env.example) for the full list.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Prepare the database and start every service with hot reload |
| `npm run start:all` | Start all services in watch mode |
| `npm run build:all` | Build every app |
| `npm run start:prod:all` | Run the production builds |
| `npm run db:migrate` | Apply pending migrations |
| `npm run seed` | Seed demo users, courses, and reviews |

## Project Structure

```text
Apsara-Elearning-API/
├── apps/
│   ├── api-gateway/            # Public HTTP gateway
│   ├── admin-gateway/          # Admin HTTP gateway
│   ├── auth-service/
│   ├── user-service/
│   ├── course-service/
│   ├── assessment-service/
│   ├── ai-service/
│   └── subscription-service/
├── libs/
│   ├── common/                 # Config, JWT, guards, email, logger, RabbitMQ helpers
│   ├── contracts/              # Message patterns and DTOs
│   ├── database/               # Drizzle schemas and connection
│   └── utils/                  # Shared utilities
├── scripts/                    # Dev, production, seed, and migration scripts
├── migrations/                 # SQL migrations
└── docker-compose.yml
```

## Related Repositories

- [Apsara-Elearning-Web](https://github.com/RithyBondeth/Apsara-Elearning-Web): the Next.js student and admin web app

## Author

**Rithy Bondeth** — Full Stack Developer & AI Engineer

[![Portfolio](https://img.shields.io/badge/Portfolio-0A0A0A?style=for-the-badge&logo=vercel&logoColor=white)](https://bondeth.dev)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/RithyBondeth)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/rithy-bondeth-484073282/)
