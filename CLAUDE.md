# QuizLab – quiz application (WTaM course project, team VAFG)

Web app for creating, sharing and taking learning quizzes, with a focus on learning from mistakes.
Built for the course *Web Technology and Methodology* (FMFI UK). The full specification is in
`docs/specification.md` – it is the source of truth for functionality. This file describes how to build it.

## Stack

- **SvelteKit + TypeScript** – one codebase for UI and server API, server-rendered pages
- **Pico CSS** + own CSS variables (colours, logo) – no Tailwind, no component library
- **zod** – validation of all input on the server
- **Cloudflare D1** (SQLite) – database, binding name `DB`, accessed via `platform.env.DB`
- **Cloudflare Workers** (free plan) via `@sveltejs/adapter-cloudflare`, deployed automatically from GitHub `main`

Keep it simple: no ORM, no auth library, no state management library, no extra UI frameworks.

## Commands

```bash
npm run dev                                              # local dev server
npx wrangler d1 migrations apply quizlab --local         # apply migrations locally
npx wrangler d1 migrations apply quizlab --remote        # apply migrations in production
npm run build && npx wrangler dev                        # run the built worker locally
npm run check                                            # svelte-check / TypeScript
npm run gen                                              # regenerate worker-configuration.d.ts after editing wrangler.jsonc
```

SvelteKit 3 notes: kit options (adapter, CSP) live in `vite.config.ts` – there is no `svelte.config.js`;
import from `src/lib` via `#lib/...`.

## Key design decisions

- **No user accounts.** Creating a quiz returns a random **edit token**. Only its SHA-256 hash is stored.
  Edit/delete requests send it as `Authorization: Bearer <token>`. The edit link is `/q/[id]/edit?key=<token>`.
- The client stores `{ id, title, editToken }` of created quizzes in `localStorage` → "My quizzes" page.
- **Quiz evaluation happens in the browser.** Results are never sent to or stored on the server.
- History of taken quizzes (`{ id, title, date, score }`) is stored only in the browser (`localStorage`) → "Recently taken" + marking taken quizzes in the catalogue.
- Wrap every `localStorage` access in try/catch; the app must work without it.
- Questions are stored as a JSON column on the quiz (always loaded/saved together with the quiz).

## Database (`migrations/0001_init.sql`)

```sql
CREATE TABLE quizzes (
  id              TEXT PRIMARY KEY,               -- short random id used in URLs
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  visibility      TEXT NOT NULL DEFAULT 'unlisted'
                  CHECK (visibility IN ('public', 'unlisted')),
  questions       TEXT NOT NULL,                  -- JSON array of Question
  question_count  INTEGER NOT NULL CHECK (question_count >= 1),
  start_count     INTEGER NOT NULL DEFAULT 0,     -- anonymous popularity counter
  edit_token_hash TEXT NOT NULL,                  -- SHA-256 of the edit token
  forked_from     TEXT REFERENCES quizzes(id) ON DELETE SET NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE quiz_tags (
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL,                          -- normalised: lowercase, trimmed
  PRIMARY KEY (quiz_id, tag)
);

CREATE INDEX idx_quizzes_public_created ON quizzes(visibility, created_at);
CREATE INDEX idx_quizzes_public_popular ON quizzes(visibility, start_count);
CREATE INDEX idx_quiz_tags_tag ON quiz_tags(tag);
```

- `question_count` is set by the server from the JSON on every save.
- Tags are replaced as a whole set on every save.

## Question format (`src/lib/types.ts` + zod schema in `src/lib/schema.ts`)

```ts
type Base = { id: string; text: string; explanation?: string };   // explanation = why the correct answer is right
type Option = { id: string; text: string; correct: boolean; explanation?: string }; // explanation = why this option is wrong

type Question = Base & (
  | { type: 'single';    options: Option[] }                     // >= 2 options, exactly 1 correct
  | { type: 'multiple';  options: Option[] }                     // >= 2 options, >= 1 correct
  | { type: 'truefalse'; correct: boolean; incorrectExplanation?: string }
  | { type: 'numeric';   value: number; tolerance?: number; incorrectExplanation?: string }
  | { type: 'matching';  pairs: { left: string; right: string }[]; incorrectExplanation?: string } // >= 2 pairs
  | { type: 'ordering';  items: string[]; incorrectExplanation?: string }                         // stored in correct order
);
```

Scoring rules (all-or-nothing per question):
- multiple: correct only if exactly the correct options are selected
- numeric: correct if `|answer - value| <= (tolerance ?? 0)`
- matching / ordering: correct only if all pairs / the whole order are correct
- matching right column and ordering items are shuffled on the client when taking the quiz

## API (`src/routes/api/**/+server.ts`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/quizzes?q=&tags=a,b&length=short\|medium\|long&sort=newest\|popular\|questions\|title&page=` | public catalogue |
| GET | `/api/tags` | most used tags of public quizzes |
| GET | `/api/quizzes/:id` | one quiz (public or unlisted), without `edit_token_hash` |
| POST | `/api/quizzes` | create → `{ id, editToken }` |
| PUT | `/api/quizzes/:id` | update (Bearer token) |
| DELETE | `/api/quizzes/:id` | delete (Bearer token) |
| POST | `/api/quizzes/:id/start` | increment `start_count` |
| POST | `/api/quizzes/:id/fork` | copy a public quiz → new unlisted quiz, `{ id, editToken }` |

- Length filter: short = 1–10, medium = 11–25, long = 26+ questions.
- Multi-tag filter: a quiz must have **all** selected tags (`GROUP BY quiz_id HAVING COUNT(*) = n`).
- Always use prepared statements (`DB.prepare(...).bind(...)`), never string concatenation.
- Validate every request body with zod; return 400 / 401 / 404 with a short JSON error.
- Compare token hashes in constant time.

## Pages (`src/routes`)

| Route | Content |
|---|---|
| `/` | what the app does, "Create a quiz" CTA, search, newest/popular quizzes, recently taken |
| `/quizzes` | catalogue: search, tag filter, length filter, sorting, pagination; filters live in the URL |
| `/q/[id]` | quiz detail: title, description, tags, question count, Start, Copy share link, Make a copy |
| `/q/[id]/play` | taking: choose feedback mode (after each question / at the end), one question at a time, progress, back/next |
| results (in play) | score, overview with user answer vs correct answer and explanations, "Repeat incorrect only", "Retake whole quiz" |
| `/new`, `/q/[id]/edit` | editor: title, description, tags, visibility, add/edit/reorder/delete questions; after saving show share + edit links with a warning to keep the edit link |
| `/my` | "My quizzes" from localStorage |
| `/about` | about, privacy (GDPR), licence, contact |
| `+error.svelte` | 404 / error page with a way back |

## UI requirements (graded by the course – always follow)

- **Mobile first, responsive.** Bottom navigation bar on mobile (Home, Catalogue, Create, My quizzes), top menu on desktop. Nothing may break when resizing or rotating.
- **Freestanding pages:** header with logo linking to `/`, footer with © year, licence, contact and privacy link. Every page has a unique `<title>` matching its `<h1>`. Quiz detail shows created/updated date.
- **Navigation context:** breadcrumbs (e.g. Catalogue › Quiz › Taking), no dead ends, clear labels on buttons and links.
- **Accessibility, WCAG 2.2 AA:** contrast ≥ 4.5:1, semantic HTML5 (`header`, `nav`, `main`, `footer`, `fieldset`/`legend` for questions), `label` for every input, visible focus, everything operable by keyboard.
- **No drag & drop.** Matching = a `<select>` for each left item; ordering = up/down buttons.
- **Valid HTML and CSS** (W3C validators), works in current Chrome, Firefox, Safari, Edge.
- **Security:** never render user content with `{@html}`; set a Content-Security-Policy header.

## Scope per round

- **R2 (by 6 Dec):** F1–F6, question types single choice, multiple choice, true/false.
- **R3 (by 10 Jan):** F7 forking, question types numeric, matching, ordering, features requested by lecturers.
- Before R3 work starts, the R2 version is kept online as a separate Worker (`quizlab-v1`).

## Working conventions

- One feature at a time, end to end (types → API → UI), deployable after each step.
- Agree on types and API shape before splitting work between UI / client logic / server.
- Every change goes through a pull request reviewed by another team member.
