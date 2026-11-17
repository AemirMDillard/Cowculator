# Cowculator 🐮🌱

**Small swaps. Big moo-vement.** Cowculator is a playful, research-informed food-impact app where people can explore realistic food swaps, track a plant-based journey, invite friends, and celebrate progress for animals and the planet.

This guide is for people and AI assistants helping develop the project. Keep the product useful, trustworthy, compact, and kind.

## The project at a glance

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, and a small shared CSS design system.
- **CMS and API:** Payload CMS, including its authentication and REST API.
- **Database:** PostgreSQL through Payload's Postgres adapter; the deployed database is Neon.
- **Package manager and runtime:** pnpm 10.34.3 and Node.js 24.22.1, pinned in `.mise.toml`.
- **Deployment output:** Next.js standalone output.
- **Product feel:** Friendly farm-meets-earth visuals, clear estimates, concise layouts, and mobile-first interactions.

## Get started

Install the pinned tools with [mise](https://mise.jdx.dev/) if it is available, then install dependencies and configure local environment variables:

```sh
corepack pnpm install
```

Create a local `.env.local` file with values for:

```dotenv
DATABASE_URL=your-postgres-connection-string
PAYLOAD_SECRET=your-long-random-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never commit `.env.local`, database connection strings, or other credentials. Use a development database when working locally; do not point experiments at production.

Start the app:

```sh
corepack pnpm dev
```

The site runs at `http://localhost:3000`; the Payload admin is at `/admin`.

## Useful commands

| Purpose                  | Command                                       |
| ------------------------ | --------------------------------------------- |
| Start development server | `corepack pnpm dev`                           |
| Type-check               | `corepack pnpm typecheck`                     |
| Run unit tests           | `corepack pnpm test`                          |
| Check formatting         | `corepack pnpm exec oxfmt --check <files...>` |
| Format files             | `corepack pnpm exec oxfmt <files...>`         |
| Production build         | `corepack pnpm build`                         |

The production build fails on TypeScript errors, and CI runs the type-check, unit tests, and build. The standalone build can use significant disk space.

## Where things live

```text
src/
  app/
    (frontend)/       Public website routes and global styles
    (payload)/        Payload admin and generated Payload API routes
    api/              App-specific API routes
  collections/        Payload collections and access rules
  components/
    cowculator/       Feature-focused React components
  lib/                Calculations and shared application helpers
  migrations/         Database migrations as code
  payload.config.ts   Payload and PostgreSQL configuration
  payload-types.ts    Generated Payload TypeScript types
```

Prefer the existing feature modules in `src/components/cowculator/` over growing the legacy `src/components/cowculator.tsx` barrel or putting a full feature in one oversized component. Keep generated Payload routes and generated types in sync with their source rather than editing generated output by hand.

## Main website routes

| Route                  | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `/`                    | Welcome page and paths into Cowculator                               |
| `/calculator`          | Food-habit questionnaire                                             |
| `/results`             | Results from the questionnaire                                       |
| `/swaps`               | Animal-food and plant-food comparisons                               |
| `/dashboard`           | Impact, points, current swaps, referrals, and progress               |
| `/journey`             | Plant-based pledge and self-reported habit tracking                  |
| `/friends`             | Friend search and connections                                        |
| `/community`           | Member-only, text-based posts and discussion                         |
| `/leaderboard`         | Monthly and community rankings                                       |
| `/settings`            | Theme and username preferences                                       |
| `/login`, `/signup`    | Payload-backed account flows                                         |
| `/plant-a-seed/<code>` | Friendly referral URL; redirects to signup with referral attribution |

New referral URLs use `/plant-a-seed/<code>`. The older `/signup?ref=<code>` format remains supported.

## Important API areas

- `/api/foods` — active food catalog.
- `/api/active-swaps` — authenticated swap persistence and leaderboard scoring.
- `/api/impact` — impact and account summary.
- `/api/leaderboard` — community rankings.
- `/api/referrals` — invite URL/QR data, referral points, and vegan-signup tally.
- `/api/friends` and `/api/friends/requests/...` — friend search and requests.
- `/api/community/...` — member-only posts, comments, reactions, reports, blocks, and age confirmation.
- `/api/journey` — authenticated plant-based pledge and check-ins.
- `/api/profile` — profile name reads/updates and immediate leaderboard-name synchronization.
- `/api/users/...` — Payload's authentication endpoints.

Use [`src/lib/api-session.ts`](./src/lib/api-session.ts) for route authentication: `getUserSession` requires a user account, while `getPayloadSession` also supports anonymous requests. Both exclude Payload admin accounts from user-facing app sessions. Keep authorization checks server-side.

## Data and product rules

### Food swaps and impact

- Shared impact and scoring logic belongs in [`src/lib/impact-calculations.ts`](./src/lib/impact-calculations.ts); test it in [`src/lib/impact-calculations.test.ts`](./src/lib/impact-calculations.test.ts).
- Animal-to-plant comparisons and plant-to-plant comparisons are different kinds of choices. A vegan can compare plant foods and earn optimization points; never require an animal-food swap to use that path.
- `considered` entries in `activeSwaps` record browsing history. They are **not** active swaps and must not earn points or contribute impact.
- Present environmental numbers as estimates with clear units and assumptions. Do not describe a comparison as a guaranteed personal saving.
- Keep reference material in the Payload `Sources` collection and make educational claims traceable to sources.

### Plant-based journey

- Weekly goals use the existing `plantBasedGoalDaysPerWeek` user field.
- Pledge dates and self-reported check-ins are stored under the reserved `quizResponses.__cowculator.plantBasedJourney` JSON key. This avoids a schema change; preserve this metadata when changing quiz-answer handling.
- Journey check-ins represent a person's reported habits. They are not verified emissions reductions and should not be silently converted into environmental impact or leaderboard points.
- The dashboard's tracked-day count is derived from unique saved check-in dates; it is separate from environmental impact totals.
- Keep the tracker encouraging and compact: realistic goals, clear weekly progress, and no guilt-based language.

### Referrals and friends

- `referralCode` belongs to the inviter; `referralCodeUsed` attributes a new account to its inviter.
- New friend invites use `/plant-a-seed/<code>` and redirect through the existing signup flow. Keep old query-string links working.
- Signup snapshots whether a referred friend joined as vegan under `quizResponses.__cowculator.veganReferralAtSignup`. Count a referred person at most once.
- Referral points and the vegan-signup tally are separate metrics. A signup alone does not grant swap points.
- User profile names are also shown in friend search and leaderboard records. Update the leaderboard's stored display names when a profile name changes.

### Community and moderation

- Community posts are visible only to signed-in members, are not included in public pages, and are served through authenticated, no-store API routes.
- Feed and comment pages use bounded cursor pagination. Post, comment, reaction, report, and block writes are validated and rate-limited in PostgreSQL.
- Posts and comments are plain text. The API limits post length to 1,000 characters and comment length to 500; React renders content as text rather than HTML.
- Community collections are admin-only in Payload. User-facing routes perform session, ownership, age-confirmation, and block checks before using privileged Payload or SQL operations.
- Reports are stored in the `Community Reports` admin collection for manual review. Moderators can hide posts and comments there; members can report content, block people, and manage their own block list.
- Community access requires a self-confirmation that a member is at least 13. Only the confirmation timestamp is stored, not a birth date; this does not verify age. There are no direct messages or media uploads in this first release.
- Do not describe the feed as ready for minors in production until Cowculator has an age-assurance, moderation-response, privacy, and jurisdiction-specific safeguarding plan.

### Browser storage and themes

- `cowculator-swaps` and `cowculator-answers` are user-specific local caches. Clear them on logout and before a successful login can reuse guest data.
- `cowculator-theme` is a local appearance preference; preserve it across logout.
- The supported themes are `classic`, `chicken`, and `spooky`. Theme colors live in the global frontend stylesheet.

## Payload and database safety

Collections are defined in `src/collections/` and registered in `src/payload.config.ts`. The current model includes users, foods, sources, leaderboards, friendships, and community content/moderation records.

Treat database changes carefully:

1. Make schema changes in collection definitions and migrations, not as ad hoc SQL.
2. Read the migration and inspect the target environment before running it.
3. Use a development database or isolated branch first.
4. Do not run schema synchronization, destructive migrations, or production database operations without the project owner's explicit approval.
5. Regenerate Payload types through the project's Payload tooling when collection schemas change; do not hand-edit generated files to conceal a schema mismatch.

The journey and referral snapshots currently reuse existing JSON fields and therefore do not require a database migration.

## UI and contribution notes

- Inspect the relevant implementation before editing; make the smallest complete change.
- Prioritize responsive, concise layouts. Prefer compact cards and grids over long walls of text.
- Reuse existing typography, controls, theme variables, and components where possible.
- Keep form controls labeled and keyboard accessible; use visible focus styles and clear loading, success, and error states.
- Keep the keyboard skip link enabled by default and respect reduced-motion preferences.
- Keep Server Components free of browser event handlers. Put interactive behavior in Client Components.
- Do not add a dependency for a small UI detail or duplicate an existing helper.
- Preserve existing account, guest, vegan, referral, and mobile behavior when changing shared components.
- Add focused tests for new calculation or persistence behavior, and run the narrowest relevant checks plus TypeScript.
- Comment domain assumptions and non-obvious decisions; leave straightforward code self-explanatory.
- Preview the routes a change affects when local browser access is available. Do not claim a production deployment was verified unless it was actually checked.
- Keep copy warm, hopeful, and educational. Cow jokes are welcome; unclear science and guilt are not. 🐔🐄🌍
