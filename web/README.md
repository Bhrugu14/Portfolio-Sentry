# Portfolio (web)

A [Next.js](https://nextjs.org) app backed by [Sanity](https://www.sanity.io) as its CMS. This README covers cloning the repo, configuring your own credentials, and running it locally or in Docker.

## What's here

The site itself: hero/about, projects, experience, skills, and a contact form — all content-driven from Sanity (see [Adding/editing content](#addingediting-content-sanity-studio) below). Also included: light/dark theme, optional GA4 analytics, resume-download event tracking, and contact-form persistence with an optional email notification.

This `web/` folder is one of two projects in this repo — the other, `../studio`, is the Sanity Studio where the content itself lives.

## Quickstart

```bash
git clone <this-repo-url>
cd Portfolio-Sentry/web
cp .env.local.example .env.local   # then fill in the values, see below
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll see real content once the two required env vars below point at a Sanity project that has data — either your fork of `../studio`'s content, or your own (see [Adding/editing content](#addingediting-content-sanity-studio)).

Other scripts:

```bash
npm run build   # production build (also run automatically by Docker)
npm run start   # serve that production build, after npm run build
npm test        # vitest
npm run lint    # eslint
```

## Environment variables

All environment variables are read through one module, [`src/lib/env.ts`](src/lib/env.ts) — nothing in the codebase reads `process.env` directly outside that file. Copy `.env.local.example` to `.env.local` and fill it in; `.env.local` is git-ignored, so your credentials never get committed.

| Variable | Required? | Used for | Where to get it |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | **Required** | Which Sanity project to read/write | [sanity.io/manage](https://www.sanity.io/manage) → your project → Project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | **Required** | Which dataset in that project (usually `production`) | Same project page, under Datasets |
| `SANITY_API_READ_TOKEN` | Optional | Draft/preview content via Presentation Tool | Sanity project → API → Tokens (Viewer role) |
| `SANITY_API_WRITE_TOKEN` | Optional | Persisting contact form submissions to Sanity | Sanity project → API → Tokens (Editor role) |
| `RESEND_API_KEY` | Optional | Emailing you when someone submits the contact form | [resend.com](https://resend.com) → API Keys |
| `CONTACT_EMAIL_TO` | Optional | Address the contact form notification is sent to | Your own inbox address |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics (GA4) page/event tracking | [Google Analytics](https://analytics.google.com) → Admin → Data Streams |

**Every optional variable enables its feature only when set.** Leave any of them blank and the app runs fine with that feature quietly turned off — no code changes needed:
- No `NEXT_PUBLIC_GA_MEASUREMENT_ID` → no analytics script is loaded.
- No `RESEND_API_KEY`/`CONTACT_EMAIL_TO` → the contact form still saves to Sanity, just skips the email notification.
- No `SANITY_API_READ_TOKEN`/`SANITY_API_WRITE_TOKEN` → published content still renders; drafts/preview and contact-form persistence are skipped.

The two required variables fail the app fast with a clear error (both at `next dev`/`next build` and inside Docker) if left unset — see `src/lib/env.ts`.

**Maintaining this table:** when you add, rename, or remove an env var, update it in all three places together: `.env.local.example`, `src/lib/env.ts`, and this table.

## Running with Docker

Requires [Docker](https://www.docker.com) and Compose v2. Same `.env.local` as above — Docker never needs separate configuration.

```bash
npm run docker:up    # production build (matches what gets deployed)
npm run docker:dev   # local dev with hot reload instead
npm run docker:down  # stop and remove the containers
```

Either way, open [http://localhost:3000](http://localhost:3000). These wrap `docker compose --env-file .env.local ...` — `--env-file .env.local` tells Compose which file to read for both the container's runtime env and the `NEXT_PUBLIC_*` build args (these are inlined into the client bundle at build time, so they must be present when the image builds — see comments in `Dockerfile`). Secrets are never baked into the image; they're injected at container run time.

## Adding/editing content (Sanity Studio)

Projects, experience, skills, and site settings are all managed in the Sanity Studio, a separate project at `../studio` (not inside `web/`):

```bash
cd ../studio
npm install
npm run dev   # opens the Studio at http://localhost:3333
```

Add a Project, Experience entry, etc. there and it appears on the site the next time it fetches data — no code changes needed. From the repo root you can also run `npm run dev` to start the Studio and this app together (see the root `package.json`).

**If you're forking this for your own portfolio**, note that `studio/sanity.config.ts` has its `projectId`/`dataset` hardcoded (unlike `web/`, which reads them from `.env.local`) — update that file to point at your own Sanity project too.

## Deploying

- **Vercel** (recommended, zero config): [vercel.com/new](https://vercel.com/new), import this repo, set the environment variables from the table above in the project settings.
- **Any Docker host**: build the production image from `Dockerfile` (`target: runner`), passing the required `NEXT_PUBLIC_*` values as build args and the rest as runtime env vars — same shape as `docker-compose.yml`.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Sanity Documentation](https://www.sanity.io/docs)
