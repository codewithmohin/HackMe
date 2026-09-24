# HackMe

HackMe is a student-first hackathon management platform built with Next.js, TypeScript, Tailwind CSS and Supabase.

## Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS 4
- Supabase Auth and PostgreSQL
- PostgreSQL Row Level Security
- Zod validation

## Setup

1. Create a Supabase project.
2. Enable Anonymous Sign-Ins in Supabase Authentication.
3. Open the SQL editor and run `supabase/migrations/001_initial.sql`.
4. Copy `.env.example` to `.env.local`.
5. Add your Supabase project URL and publishable key.
6. Run `npm install`.
7. Run `npm run dev`.

## Environment

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are required.

The browser key is safe to expose when RLS is correctly configured. Never put a service-role key in a `NEXT_PUBLIC_*` variable.

## Main routes

- `/` landing page
- `/login` anonymous username sign-in
- `/dashboard` user dashboard
- `/explore` public hackathon discovery
- `/join` join by code
- `/create` create a hackathon
- `/hackathon/[id]` event page
- `/hackathon/[id]/team` team management
- `/hackathon/[id]/submit` project submission
- `/hackathon/[id]/leaderboard` results
- `/host/[id]` host overview
- `/host/[id]/participants` participant management
- `/host/[id]/teams` team management
- `/host/[id]/submissions` submission review
- `/host/[id]/judging` judging
- `/host/[id]/settings` event settings

## Validation

Run:

`npm run typecheck`

`npm run build`

The build is the release gate. Configure Supabase before using authenticated database flows.

## Security model

Authorization is enforced with Supabase RLS and database functions. Critical team and submission operations use PostgreSQL functions instead of trusting client-provided user IDs. Submission deadlines are checked using database `now()`.

## Open-source references used for architecture research

- https://github.com/HackSC/hibiscus
- https://github.com/MahendraDani/supabase-hackathon
- https://github.com/ilhamfp/pasal
- https://github.com/bedih7663/nextjs-supabase-auth-rls-starter

These repositories were used as architectural reference points. HackMe source code is independently written for this product specification.
