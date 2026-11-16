# Cowculator — Project Instructions

React + Next.js + Payload CMS + PostgreSQL (Neon) + Tailwind CSS project.

This file is supplied as project instructions at the start of each task. Do not reread it before opening source files.

## 1. Development Principles

- Inspect the relevant source files before making changes.
- Understand the existing implementation before replacing or refactoring it.
- Make the smallest change that correctly satisfies the request.
- Preserve working functionality unless the user explicitly asks to change it.
- Do not introduce unnecessary dependencies, abstractions, or architectural changes.
- Explain important technical decisions in plain language when working with the user.
- Do not assume the user wants a feature simply because the project supports it.

Always load the `payload-framework` skill when working with Payload. Load `nextjs-docs` when working with routing, pages, components, caching, images, or metadata. Load `payload-content` before working with Payload documents or content.

## 2. Completion and Verification

Before reporting an application change as complete:

- Preview every requested route.
- Check for runtime errors and build errors.
- Check that Server Components do not contain event handlers. Use CSS interaction or a Client Component boundary.
- When a Client Component calls a Server Action inside `useTransition`, keep `revalidatePath` out of the action. Return a serializable result and call `router.refresh()` in the client after success.
- Run the most relevant typecheck or build command when practical.
- Verify the deployed application through Vercel when production delivery is requested.

Do not claim that production deployment has been verified merely because local development works or a build succeeds.

### Rendering and caching

Keep fixed informational pages static.

Choose the content lifecycle before implementing dynamic routes:

- **Build-time content:** Use build-time reads when the user explicitly wants a snapshot. Explain that changes may require another deployment.
- **Content that must update after publication:** Use cached reads and appropriate invalidation hooks. Invalidate the list and both previous and current detail routes when a slug changes. Also invalidate affected pages when related media changes.
- **Frequently changing application data:** Use request-time rendering when the data genuinely needs to remain current.

A time-based revalidation interval alone is not a substitute for invalidation when immediate updates are required.

When working on caching, verify that the intended content changes appear in a fresh production request.

## 3. Project Architecture

This project uses Next.js App Router route groups to separate the frontend from Payload admin and API routes.

### Project structure

- `src/app/(frontend)/` — Public application pages.
- `src/app/(payload)/` — Payload admin panel and API routes. Do not directly modify generated Payload routes.
- `src/collections/` — Payload collection definitions.
- `src/globals/` — Payload global definitions.
- `src/payload.config.ts` — Payload configuration.
- `src/payload-types.ts` — Automatically generated TypeScript types.
- `src/lib/payload.ts` — Shared Payload utilities.
- `next.config.ts` — Next.js configuration.
- `package.json` — Dependencies and scripts.
- `.mise.toml` — Toolchain versions.

### Key files

- `src/app/(frontend)/layout.tsx` — Frontend root layout.
- `src/app/(frontend)/page.tsx` — Homepage.
- `src/app/(frontend)/not-found.tsx` — Custom not-found page.
- `src/app/(frontend)/styles.css` — Global styles and Tailwind CSS import.
- `src/payload.config.ts`