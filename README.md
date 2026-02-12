## Auth Nest

Auth Nest is a full-featured authentication and user management API built with NestJS 11, PostgreSQL, Drizzle ORM and an email delivery flow using MailCatcher.
The goal of this project is to showcase production-style architecture, clean code and automated tests around a realistic auth workflow.

### Why this project exists

Most of my professional backend work lives in private repositories.
This project provides a public reference that reflects how I design and structure backend systems in production environments.

It focuses on clarity of architecture, realistic workflows and automated validation, rather than being a tutorial or boilerplate template.

### What this demonstrates

- Production-style NestJS architecture
- Auth/session management
- Feature-based authorization
- Database access patterns
- End-to-end testing
- Containerized infrastructure

---

### Stack & main libraries

- **Runtime & framework**
  - Node.js
  - NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- **Database**
  - PostgreSQL (Docker)
  - Drizzle ORM (`drizzle-orm/node-postgres`)
- **Auth & security**
  - `bcryptjs` for password hashing
  - Cookie-based sessions with a custom session store
  - Feature-based authorization using Nest guards and decorators
- **Email**
  - `nodemailer` for sending emails
  - MailCatcher (Docker) for local email inspection
- **Tooling & DX**
  - TypeScript 5
  - Jest 30 + `@nestjs/testing` + `supertest`
  - ESLint + Prettier
  - Husky + Commitlint + Commitizen
  - Docker Compose for infrastructure

---

### High-level architecture

The project follows a **modular, feature-first architecture**:

- **`AppModule`**
  - Root module that wires all feature modules and global concerns:
    - `DrizzleModule` (database)
    - `CommonModule` (cross-cutting services, guards)
    - `UsersModule`
    - `SessionsModule`
    - `ActivationsModule`
  - Registers global providers:
    - `HttpExceptionFilter` (error normalization and logging)
    - `SessionGuard` (injects the current user into the request)
    - `FeatureGuard` (checks feature flags / permissions)

- **`infra/database/drizzle`**
  - `DrizzleService` encapsulates:
    - loading `.env.development` with `dotenv` + `dotenv-expand`
    - creation of a `pg` connection pool
    - creation of a strongly-typed `NodePgDatabase` via `drizzle(pool, { schema })`
  - All repositories depend on `DrizzleService` instead of touching `pg` directly.

- **Domain modules**
  - **Users**
    - `UsersService` handles user lifecycle (creation, queries, updates, features).
    - `DrizzleUsersRepository` is an implementation of `IUsersRepository` over Drizzle ORM.
    - Exposed through REST controllers.
  - **Sessions**
    - `SessionsService` encapsulates login, session creation/renewal/destruction and token validation.
    - Uses `PasswordsService` to compare hashed passwords.
    - Provides a factory-style `createForUser(userId)` used by other parts of the system (tests, orchestrator, etc.).
  - **Activations**
    - Manages user activation tokens and activation workflow.
    - Integrates with `EmailModule` to send activation emails.

- **`common` module**
  - **Guards**
    - `SessionGuard`:
      - Reads `session_id` from cookies.
      - Uses `SessionsService` to resolve an authenticated user or falls back to an anonymous user.
      - Always attaches `request.user` (typed as `UserWithFeatures`), simplifying downstream code.
    - `FeatureGuard`:
      - Uses the `@RequireFeature()` decorator metadata.
      - Checks `request.user.features` and throws a `ForbiddenException` if the required feature is missing.
  - **Filters**
    - `HttpExceptionFilter`:
      - Centralizes error logging.
      - Normalizes the error shape into a public DTO with `name`, `message`, `action`, `status_code`.
  - **Services / types / decorators / exceptions**
    - Provide reusable building blocks shared across modules (authorization helpers, typed user models, etc.).

---

### Authentication & authorization flow

**1. Sessions & login**

- A user logs in with email + password.
- `SessionsService.create()`:
  - Normalizes the email (lowercasing).
  - Looks up the user via `IUsersRepository.findByEmail`.
  - Validates the password using `PasswordsService.compare`.
  - Generates a secure random session token (`crypto.randomBytes(48)`).
  - Persists the session in the sessions repository with an expiration timestamp.
  - Returns the session token and expiry time.
- Controllers set this token into a `session_id` cookie to be used by subsequent requests.

**2. Injecting the current user**

- For every HTTP request, `SessionGuard` runs globally:
  - If `session_id` cookie exists:
    - Uses `SessionsService.getUserByToken` to resolve the user.
    - Injects the sanitized user into `request.user` (password removed, features array ensured).
  - If not, or on error:
    - Injects an anonymous user via `createAnonymousUser()`.

**3. Feature-based authorization**

- Routes that require specific capabilities use the `@RequireFeature('some:feature')` decorator.
- `FeatureGuard` (also global) reads that metadata and checks if:
  - There is a current user in `request.user`.
  - The user’s `features` array contains the required feature name.
- If not, it throws a `ForbiddenException` with a user-friendly error payload.

This setup cleanly separates concerns:

- **Authentication** → sessions & cookies.
- **Authorization** → feature flags on the user entity, enforced via guards.
- **Transport** → controllers only orchestrate inputs/outputs, delegated to services.

---

### Database & Drizzle ORM

- PostgreSQL runs via Docker Compose (`src/infra/compose.yml`).
- `DrizzleService`:
  - Loads database config from `DATABASE_URL` in `.env.development`.
  - Creates a shared `Pool` from `pg`, then passes it into Drizzle.
  - Exposes a `connection` getter returning the shared `NodePgDatabase` instance.
- Repositories (e.g. `DrizzleUsersRepository`) receive `DrizzleService` through Nest DI and use the typed `db` to:
  - Insert new users with feature defaults (`['read:activation_token']`).
  - Query by ID, email, username.
  - Update user data and feature sets.

By centralizing the database connection in `DrizzleService`, the code benefits from:

- A single, reusable connection pool.
- Strong typing driven by the Drizzle schema.
- Easy swapping or reuse of the same DB instance in tests (through the Nest application context).

---

### Email flow

The email layer uses `nodemailer` and MailCatcher to simulate real-world scenarios:

- Activation emails are sent when a new user needs to confirm their account.
- MailCatcher (Docker) captures outgoing emails and exposes:
  - A web UI on `http://localhost:1080` for manual inspection.
  - An HTTP API (`EMAIL_HTTP_HOST` / `EMAIL_HTTP_PORT`) used in e2e tests.
- The `test/orchestrator.ts` helpers:
  - `deleteAllEmails()` clears the inbox before a scenario.
  - `getLastEmail()` + `extractUUID()` parse links and tokens out of the activation email body.

---

### Testing strategy

The project is built with testing in mind:

- **Test runner & tooling**
  - Jest 30 with `ts-jest` and `@nestjs/testing`.
  - `supertest` to drive HTTP requests against a real Nest application instance.
  - Custom orchestrator utilities in `test/orchestrator.ts` to:
    - Wait for all external services (`waitForAllServices`).
    - Clear the database between tests (`clearDatabase` using Drizzle + raw SQL).
    - Create/activate users and sessions programmatically via the real services.

- **How tests are executed**
  - `npm test`
    - Brings up infrastructure with Docker Compose (`services:up`).
    - Starts the Nest application and runs Jest in-band with verbose output.
    - Stops the services afterwards (`posttest` → `services:stop`).
  - Jest is configured in `package.json` to use:
    - `rootDir: "test"`
    - `testRegex: ".*\\.spec\\.ts$"`
    - which means all `*.spec.ts` files inside `test/` are treated as tests (including e2e-style specs).

This gives a high level of confidence by testing **real HTTP flows** end-to-end against a live Nest app and real PostgreSQL + MailCatcher containers.

---

### Local development

- **Requirements**
  - Node.js (version compatible with Nest 11 / TypeScript 5)
  - Docker + Docker Compose

- **Install dependencies**

```bash
npm install
```

- **Start infrastructure (Postgres + MailCatcher)**

```bash
npm run services:up
```

- **Run the application in dev mode**

```bash
npm run dev
# or
npm run start:dev
```

- **Stop / tear down services**

```bash
npm run services:stop   # stop containers
npm run services:down   # stop and remove containers
```

---

### Linting & formatting

- **Prettier**

```bash
npm run lint:prettier:check
npm run lint:prettier:fix
```

- **ESLint**

```bash
npm run lint:eslint:check
```

Husky + Commitlint + Commitizen are configured to enforce consistent commits and style in a real-world workflow.
